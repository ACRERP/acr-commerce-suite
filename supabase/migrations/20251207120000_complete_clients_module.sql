-- =====================================================
-- MÓDULO CLIENTE - COMPLETAR (65% → 100%)
-- Data: 07/12/2025
-- Objetivo: Adicionar controle de crédito, bloqueio automático e histórico completo
-- =====================================================

-- =====================================================
-- PARTE 1: ADICIONAR CAMPOS FALTANTES
-- =====================================================

-- 1. Campos de Controle de Crédito
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_used DECIMAL(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_available DECIMAL(10,2) GENERATED ALWAYS AS (credit_limit - credit_used) STORED;

-- 2. Campos de Status Financeiro
ALTER TABLE clients ADD COLUMN IF NOT EXISTS financial_status VARCHAR(20) DEFAULT 'ok' CHECK (financial_status IN ('ok', 'late', 'blocked'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS allow_credit BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id);

-- 3. Campos de Contato Expandidos
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20);

-- 4. Campos de Endereço Completo
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complement VARCHAR(100);

-- 5. Campos de Dados Pessoais/Jurídicos
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rg_ie VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type VARCHAR(2) DEFAULT 'pf' CHECK (client_type IN ('pf', 'pj'));

-- 6. Campos de Controle
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- =====================================================
-- PARTE 2: CRIAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clients_financial_status ON clients(financial_status);
CREATE INDEX IF NOT EXISTS idx_clients_blocked ON clients(blocked);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_state ON clients(state);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON clients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_last_purchase ON clients(last_purchase_date);

-- =====================================================
-- PARTE 3: VIEWS DE HISTÓRICO E RESUMO
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
    -- Contas a receber
    COALESCE(SUM(CASE WHEN ar.status = 'pending' THEN ar.amount_remaining ELSE 0 END), 0) as total_debt,
    COALESCE(SUM(CASE WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN ar.amount_remaining ELSE 0 END), 0) as overdue_debt,
    COUNT(CASE WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
    -- Próximo vencimento
    MIN(CASE WHEN ar.status = 'pending' AND ar.due_date >= CURRENT_DATE THEN ar.due_date END) as next_due_date,
    -- Ticket médio
    CASE WHEN c.total_purchases > 0 THEN c.total_spent / c.total_purchases ELSE 0 END as average_ticket
FROM clients c
LEFT JOIN accounts_receivable ar ON c.id = ar.client_id
GROUP BY c.id;

-- View: Histórico de Compras do Cliente
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

-- View: Histórico de Delivery do Cliente
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

-- =====================================================
-- PARTE 4: FUNÇÕES DE CONTROLE DE CRÉDITO
-- =====================================================

-- Função: Atualizar Crédito do Cliente
CREATE OR REPLACE FUNCTION fn_update_client_credit(
    p_client_id INTEGER,
    p_amount DECIMAL(10,2),
    p_operation VARCHAR(10) -- 'add' ou 'subtract'
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
    
    -- Verificar se precisa bloquear ou desbloquear
    PERFORM fn_check_credit_limit(p_client_id);
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar Limite de Crédito e Bloquear se Necessário
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
    
    -- Bloquear se estourou o limite
    IF v_allow_credit AND v_credit_used >= v_credit_limit AND v_credit_limit > 0 THEN
        UPDATE clients 
        SET blocked = true,
            blocked_reason = 'Limite de crédito excedido',
            blocked_at = NOW(),
            financial_status = 'blocked',
            updated_at = NOW()
        WHERE id = p_client_id
        AND blocked = false; -- Só bloqueia se não estiver bloqueado
    -- Desbloquear se voltou abaixo do limite
    ELSIF v_allow_credit AND v_credit_used < v_credit_limit THEN
        UPDATE clients 
        SET blocked = false,
            blocked_reason = NULL,
            blocked_at = NULL,
            financial_status = 'ok',
            updated_at = NOW()
        WHERE id = p_client_id
        AND blocked = true
        AND blocked_reason = 'Limite de crédito excedido'; -- Só desbloqueia se foi bloqueado por crédito
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Bloquear Cliente Manualmente
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

-- Função: Desbloquear Cliente Manualmente
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
    
    -- Verificar novamente o limite após desbloquear
    PERFORM fn_check_credit_limit(p_client_id);
END;
$$ LANGUAGE plpgsql;

-- Função: Atualizar Estatísticas do Cliente
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

-- =====================================================
-- PARTE 5: TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger: Atualizar crédito ao vender fiado
CREATE OR REPLACE FUNCTION trg_update_credit_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        -- Se for fiado, adiciona ao crédito usado
        IF NEW.payment_method = 'fiado' THEN
            PERFORM fn_update_client_credit(NEW.client_id, NEW.total_amount, 'add');
        END IF;
        
        -- Atualizar estatísticas
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
        -- Se mudou de pending para paid, subtrai do crédito usado
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

-- Trigger: Verificar status financeiro ao atualizar contas
CREATE OR REPLACE FUNCTION trg_check_client_financial_status()
RETURNS TRIGGER AS $$
DECLARE
    v_overdue_count INTEGER;
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        -- Contar parcelas vencidas
        SELECT COUNT(*) INTO v_overdue_count
        FROM accounts_receivable
        WHERE client_id = NEW.client_id
        AND status = 'pending'
        AND due_date < CURRENT_DATE;
        
        -- Atualizar status financeiro
        IF v_overdue_count > 0 THEN
            UPDATE clients
            SET financial_status = 'late',
                updated_at = NOW()
            WHERE id = NEW.client_id
            AND financial_status != 'blocked'; -- Não sobrescreve bloqueado
        ELSIF v_overdue_count = 0 THEN
            UPDATE clients
            SET financial_status = 'ok',
                updated_at = NOW()
            WHERE id = NEW.client_id
            AND financial_status = 'late'; -- Só muda se estava em atraso
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
-- FIM DA MIGRATION - MÓDULO CLIENTE COMPLETO
-- =====================================================

-- VERIFICAÇÃO: Execute para confirmar
/*
SELECT 
    'Campos Adicionados' as tipo,
    COUNT(*) as quantidade
FROM information_schema.columns
WHERE table_name = 'clients'
AND column_name IN ('credit_limit', 'credit_used', 'financial_status', 'blocked', 'whatsapp', 'city');

SELECT 
    'Views Criadas' as tipo,
    COUNT(*) as quantidade
FROM information_schema.views
WHERE table_name LIKE 'vw_client%';

SELECT 
    'Funções Criadas' as tipo,
    COUNT(*) as quantidade
FROM information_schema.routines
WHERE routine_name LIKE 'fn_%client%' OR routine_name LIKE 'fn_%credit%';
*/
