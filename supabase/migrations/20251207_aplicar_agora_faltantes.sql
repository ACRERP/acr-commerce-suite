-- =====================================================
-- APLICAR APENAS O QUE FALTA - CONSOLIDADO
-- Data: 07/12/2025 23:30
-- =====================================================

-- =====================================================
-- MÓDULO CLIENTE - VIEWS, FUNÇÕES E TRIGGERS
-- =====================================================

-- View: Resumo Financeiro do Cliente
CREATE OR REPLACE VIEW vw_client_financial_summary AS
SELECT 
    c.id,
    c.name,
    c.cpf_cnpj,
    c.phone,
    c.whatsapp,
    c.email,
    c.credit_limit,
    c.credit_used,
    c.credit_available,
    c.financial_status,
    c.blocked,
    c.blocked_reason,
    c.allow_credit,
    c.last_purchase_date,
    c.total_purchases,
    c.total_spent,
    COALESCE(SUM(CASE WHEN ar.status = 'pending' THEN ar.amount_remaining ELSE 0 END), 0) as total_debt,
    COALESCE(SUM(CASE WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN ar.amount_remaining ELSE 0 END), 0) as overdue_debt,
    COUNT(CASE WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
    MIN(CASE WHEN ar.status = 'pending' AND ar.due_date >= CURRENT_DATE THEN ar.due_date END) as next_due_date,
    CASE WHEN c.total_purchases > 0 THEN c.total_spent / c.total_purchases ELSE 0 END as average_ticket
FROM clients c
LEFT JOIN accounts_receivable ar ON c.id = ar.client_id
GROUP BY c.id;

-- View: Histórico de Compras
CREATE OR REPLACE VIEW vw_client_purchase_history AS
SELECT 
    s.client_id,
    s.id as sale_id,
    s.created_at,
    s.total_amount,
    s.discount,
    s.payment_method,
    s.type as sale_type,
    s.status,
    COUNT(si.id) as items_count,
    SUM(si.quantity) as total_items,
    STRING_AGG(DISTINCT si.product_name, ', ') as products
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.status = 'concluida'
GROUP BY s.id, s.client_id, s.created_at, s.total_amount, s.discount, s.payment_method, s.type, s.status
ORDER BY s.created_at DESC;

-- View: Histórico de Delivery
CREATE OR REPLACE VIEW vw_client_delivery_history AS
SELECT 
    d.client_id,
    d.id as delivery_id,
    d.created_at,
    d.total_amount,
    d.delivery_fee,
    d.status,
    d.address,
    d.notes,
    s.payment_method
FROM delivery_orders d
LEFT JOIN sales s ON d.sale_id = s.id
ORDER BY d.created_at DESC;

-- View: Clientes Inadimplentes
CREATE OR REPLACE VIEW vw_clients_overdue AS
SELECT 
    c.id,
    c.name,
    c.cpf_cnpj,
    c.phone,
    c.whatsapp,
    c.financial_status,
    c.blocked,
    COUNT(ar.id) as overdue_installments,
    SUM(ar.amount_remaining) as total_overdue,
    MIN(ar.due_date) as oldest_due_date,
    MAX(ar.due_date) as latest_due_date,
    CURRENT_DATE - MIN(ar.due_date) as days_overdue
FROM clients c
INNER JOIN accounts_receivable ar ON c.id = ar.client_id
WHERE ar.status = 'pending'
AND ar.due_date < CURRENT_DATE
GROUP BY c.id
ORDER BY days_overdue DESC;

-- View: Clientes Bloqueados
CREATE OR REPLACE VIEW vw_clients_blocked AS
SELECT 
    c.id,
    c.name,
    c.cpf_cnpj,
    c.phone,
    c.blocked_reason,
    c.blocked_at,
    c.credit_limit,
    c.credit_used,
    c.credit_available,
    SUM(ar.amount_remaining) as total_debt
FROM clients c
LEFT JOIN accounts_receivable ar ON c.id = ar.client_id AND ar.status = 'pending'
WHERE c.blocked = true
GROUP BY c.id
ORDER BY c.blocked_at DESC;

-- Função: Atualizar Crédito
CREATE OR REPLACE FUNCTION fn_update_client_credit(
    p_client_id INTEGER,
    p_amount DECIMAL(10,2),
    p_operation VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
    IF p_operation = 'add' THEN
        UPDATE clients 
        SET credit_used = credit_used + p_amount,
            updated_at = NOW()
        WHERE id = p_client_id;
    ELSIF p_operation = 'subtract' THEN
        UPDATE clients 
        SET credit_used = GREATEST(0, credit_used - p_amount),
            updated_at = NOW()
        WHERE id = p_client_id;
    END IF;
    
    PERFORM fn_check_credit_limit(p_client_id);
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar Limite
CREATE OR REPLACE FUNCTION fn_check_credit_limit(p_client_id INTEGER) 
RETURNS VOID AS $$
DECLARE
    v_credit_used DECIMAL(10,2);
    v_credit_limit DECIMAL(10,2);
    v_allow_credit BOOLEAN;
BEGIN
    SELECT credit_used, credit_limit, allow_credit
    INTO v_credit_used, v_credit_limit, v_allow_credit
    FROM clients 
    WHERE id = p_client_id;
    
    IF v_allow_credit AND v_credit_used >= v_credit_limit AND v_credit_limit > 0 THEN
        UPDATE clients 
        SET blocked = true,
            blocked_reason = 'Limite de crédito excedido',
            blocked_at = NOW(),
            financial_status = 'blocked',
            updated_at = NOW()
        WHERE id = p_client_id
        AND blocked = false;
    ELSIF v_allow_credit AND v_credit_used < v_credit_limit THEN
        UPDATE clients 
        SET blocked = false,
            blocked_reason = NULL,
            blocked_at = NULL,
            financial_status = 'ok',
            updated_at = NOW()
        WHERE id = p_client_id
        AND blocked = true
        AND blocked_reason = 'Limite de crédito excedido';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Bloquear Cliente
CREATE OR REPLACE FUNCTION fn_block_client(
    p_client_id INTEGER,
    p_reason TEXT,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE clients 
    SET blocked = true,
        blocked_reason = p_reason,
        blocked_at = NOW(),
        blocked_by = p_user_id,
        financial_status = 'blocked',
        updated_at = NOW()
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Desbloquear Cliente
CREATE OR REPLACE FUNCTION fn_unblock_client(
    p_client_id INTEGER,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE clients 
    SET blocked = false,
        blocked_reason = NULL,
        blocked_at = NULL,
        blocked_by = NULL,
        financial_status = 'ok',
        updated_at = NOW()
    WHERE id = p_client_id;
    
    PERFORM fn_check_credit_limit(p_client_id);
END;
$$ LANGUAGE plpgsql;

-- Função: Atualizar Estatísticas
CREATE OR REPLACE FUNCTION fn_update_client_stats(p_client_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE clients c
    SET 
        last_purchase_date = (
            SELECT MAX(created_at) 
            FROM sales 
            WHERE client_id = p_client_id 
            AND status = 'concluida'
        ),
        total_purchases = (
            SELECT COUNT(*) 
            FROM sales 
            WHERE client_id = p_client_id 
            AND status = 'concluida'
        ),
        total_spent = (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM sales 
            WHERE client_id = p_client_id 
            AND status = 'concluida'
        ),
        updated_at = NOW()
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar crédito ao vender fiado
CREATE OR REPLACE FUNCTION trg_update_credit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        IF NEW.payment_method = 'fiado' THEN
            PERFORM fn_update_client_credit(NEW.client_id, NEW.total_amount, 'add');
        END IF;
        PERFORM fn_update_client_stats(NEW.client_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_credit_on_sale ON sales;
CREATE TRIGGER trg_update_credit_on_sale
AFTER INSERT ON sales
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL AND NEW.status = 'concluida')
EXECUTE FUNCTION trg_update_credit_on_sale();

-- Trigger: Atualizar crédito ao receber pagamento
CREATE OR REPLACE FUNCTION trg_update_credit_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
            PERFORM fn_update_client_credit(NEW.client_id, NEW.amount_paid, 'subtract');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_credit_on_payment ON accounts_receivable;
CREATE TRIGGER trg_update_credit_on_payment
AFTER UPDATE ON accounts_receivable
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL)
EXECUTE FUNCTION trg_update_credit_on_payment();

-- Trigger: Verificar status financeiro
CREATE OR REPLACE FUNCTION trg_check_client_financial_status()
RETURNS TRIGGER AS $$
DECLARE
    v_overdue_count INTEGER;
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_overdue_count
        FROM accounts_receivable
        WHERE client_id = NEW.client_id
        AND status = 'pending'
        AND due_date < CURRENT_DATE;
        
        IF v_overdue_count > 0 THEN
            UPDATE clients
            SET financial_status = 'late',
                updated_at = NOW()
            WHERE id = NEW.client_id
            AND financial_status != 'blocked';
        ELSIF v_overdue_count = 0 THEN
            UPDATE clients
            SET financial_status = 'ok',
                updated_at = NOW()
            WHERE id = NEW.client_id
            AND financial_status = 'late';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_client_financial_status ON accounts_receivable;
CREATE TRIGGER trg_check_client_financial_status
AFTER INSERT OR UPDATE ON accounts_receivable
FOR EACH ROW
EXECUTE FUNCTION trg_check_client_financial_status();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Execute para confirmar:
SELECT 'Views Cliente' as item, COUNT(*) as criadas
FROM information_schema.views
WHERE table_name LIKE 'vw_client%'

UNION ALL

SELECT 'Funções Cliente' as item, COUNT(*) as criadas
FROM information_schema.routines
WHERE routine_name LIKE 'fn_%client%' OR routine_name LIKE 'fn_%credit%';
