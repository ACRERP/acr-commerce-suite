-- =====================================================
-- MÓDULO FINANCEIRO - COMPLETAR (55% → 100%)
-- Data: 07/12/2025
-- Objetivo: Fluxo de caixa, DRE, categorias, juros e parcelas
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR TABELA DE CATEGORIAS FINANCEIRAS
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
    description TEXT,
    color VARCHAR(7), -- hex color
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES financial_categories(id), -- para subcategorias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type);
CREATE INDEX IF NOT EXISTS idx_financial_categories_parent ON financial_categories(parent_id);

-- Inserir categorias padrão
INSERT INTO financial_categories (name, type, color, icon) VALUES
-- Receitas
('Vendas', 'receita', '#10b981', 'shopping-cart'),
('Delivery', 'receita', '#3b82f6', 'truck'),
('Fiado Recebido', 'receita', '#8b5cf6', 'credit-card'),
('Serviços', 'receita', '#06b6d4', 'wrench'),
('Outras Receitas', 'receita', '#14b8a6', 'plus-circle'),

-- Despesas
('Aluguel', 'despesa', '#ef4444', 'home'),
('Energia', 'despesa', '#f59e0b', 'zap'),
('Água', 'despesa', '#06b6d4', 'droplet'),
('Internet', 'despesa', '#8b5cf6', 'wifi'),
('Telefone', 'despesa', '#ec4899', 'phone'),
('Funcionários', 'despesa', '#f97316', 'users'),
('Marketing', 'despesa', '#14b8a6', 'megaphone'),
('Impostos', 'despesa', '#dc2626', 'file-text'),
('Compras de Estoque', 'despesa', '#6366f1', 'package'),
('Manutenção', 'despesa', '#84cc16', 'tool'),
('Outras Despesas', 'despesa', '#64748b', 'minus-circle')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 2: EXPANDIR CONTAS A RECEBER
-- =====================================================

ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2) DEFAULT 0; -- % ao mês
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50); -- 'sale', 'service', 'other'
ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS reference_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_installment ON accounts_receivable(installment_number, total_installments);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_reference ON accounts_receivable(reference_type, reference_id);

-- =====================================================
-- PARTE 3: EXPANDIR CONTAS A PAGAR
-- =====================================================

ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES financial_categories(id);
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255);
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS reference_id INTEGER;
ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_category ON accounts_payable(category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_installment ON accounts_payable(installment_number, total_installments);

-- =====================================================
-- PARTE 4: CRIAR TABELA DE FLUXO DE CAIXA
-- =====================================================

CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida')),
    category_id INTEGER REFERENCES financial_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50), -- 'sale', 'receivable', 'payable', 'cash_register', etc
    reference_id INTEGER,
    user_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_category ON cash_flow(category_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_reference ON cash_flow(reference_type, reference_id);

-- =====================================================
-- PARTE 5: VIEWS DE DASHBOARD FINANCEIRO
-- =====================================================

-- View: Dashboard Financeiro
CREATE OR REPLACE VIEW vw_financial_dashboard AS
SELECT 
    -- Entradas e Saídas Hoje
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND date = CURRENT_DATE) as entradas_hoje,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND date = CURRENT_DATE) as saidas_hoje,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND date = CURRENT_DATE) - 
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND date = CURRENT_DATE) as saldo_hoje,
    
    -- Entradas e Saídas Mês
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as entradas_mes,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as saidas_mes,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) - 
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as saldo_mes,
    
    -- Contas a Receber
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_receivable WHERE status = 'pending') as total_a_receber,
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_receivable WHERE status = 'pending' AND due_date < CURRENT_DATE) as total_vencido_receber,
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_receivable WHERE status = 'pending' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) as vence_7_dias_receber,
    
    -- Contas a Pagar
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_payable WHERE status = 'pending') as total_a_pagar,
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_payable WHERE status = 'pending' AND due_date < CURRENT_DATE) as total_vencido_pagar,
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_payable WHERE status = 'pending' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) as vence_7_dias_pagar;

-- View: Fluxo de Caixa Diário
CREATE OR REPLACE VIEW vw_cash_flow_daily AS
SELECT 
    date,
    SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as entradas,
    SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END) as saidas,
    SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END) as saldo_dia,
    SUM(SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END)) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as saldo_acumulado
FROM cash_flow
GROUP BY date
ORDER BY date DESC;

-- View: Fluxo de Caixa por Categoria
CREATE OR REPLACE VIEW vw_cash_flow_by_category AS
SELECT 
    fc.id as category_id,
    fc.name as category_name,
    fc.type,
    fc.color,
    DATE_TRUNC('month', cf.date) as month,
    COUNT(cf.id) as transactions_count,
    SUM(cf.amount) as total_amount,
    AVG(cf.amount) as avg_amount
FROM cash_flow cf
JOIN financial_categories fc ON cf.category_id = fc.id
WHERE cf.date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY fc.id, fc.name, fc.type, fc.color, DATE_TRUNC('month', cf.date)
ORDER BY month DESC, total_amount DESC;

-- View: DRE Mensal (Demonstrativo de Resultado)
CREATE OR REPLACE VIEW vw_dre_monthly AS
WITH monthly_data AS (
    SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) as receita_bruta,
        SUM(CASE WHEN type = 'saida' AND fc.name = 'Impostos' THEN amount ELSE 0 END) as impostos,
        SUM(CASE WHEN type = 'saida' AND fc.name = 'Compras de Estoque' THEN amount ELSE 0 END) as custo_vendas,
        SUM(CASE WHEN type = 'saida' AND fc.name NOT IN ('Impostos', 'Compras de Estoque') THEN amount ELSE 0 END) as despesas_operacionais
    FROM cash_flow cf
    LEFT JOIN financial_categories fc ON cf.category_id = fc.id
    WHERE cf.date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', date)
)
SELECT 
    month,
    receita_bruta,
    impostos,
    (receita_bruta - impostos) as receita_liquida,
    custo_vendas,
    (receita_bruta - impostos - custo_vendas) as lucro_bruto,
    despesas_operacionais,
    (receita_bruta - impostos - custo_vendas - despesas_operacionais) as lucro_liquido,
    CASE 
        WHEN receita_bruta > 0 
        THEN ((receita_bruta - impostos - custo_vendas - despesas_operacionais) / receita_bruta * 100)
        ELSE 0 
    END as margem_liquida_percentual
FROM monthly_data
ORDER BY month DESC;

-- View: Contas Vencidas (A Receber e A Pagar)
CREATE OR REPLACE VIEW vw_overdue_accounts AS
SELECT 
    'Receber' as tipo,
    ar.id,
    ar.client_id as entity_id,
    c.name as entity_name,
    ar.description,
    ar.amount_total,
    ar.amount_remaining,
    ar.due_date,
    CURRENT_DATE - ar.due_date as days_overdue,
    ar.installment_number,
    ar.total_installments
FROM accounts_receivable ar
LEFT JOIN clients c ON ar.client_id = c.id
WHERE ar.status = 'pending'
AND ar.due_date < CURRENT_DATE

UNION ALL

SELECT 
    'Pagar' as tipo,
    ap.id,
    ap.supplier_id as entity_id,
    s.name as entity_name,
    ap.description,
    ap.amount_total,
    ap.amount_remaining,
    ap.due_date,
    CURRENT_DATE - ap.due_date as days_overdue,
    ap.installment_number,
    ap.total_installments
FROM accounts_payable ap
LEFT JOIN suppliers s ON ap.supplier_id = s.id
WHERE ap.status = 'pending'
AND ap.due_date < CURRENT_DATE

ORDER BY days_overdue DESC;

-- =====================================================
-- PARTE 6: FUNÇÕES FINANCEIRAS
-- =====================================================

-- Função: Calcular Juros de Atraso
CREATE OR REPLACE FUNCTION fn_calculate_late_fees(
    p_receivable_id INTEGER
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_due_date DATE;
    v_amount DECIMAL(10,2);
    v_interest_rate DECIMAL(5,2);
    v_days_late INTEGER;
    v_late_fee DECIMAL(10,2);
BEGIN
    SELECT due_date, amount_remaining, interest_rate
    INTO v_due_date, v_amount, v_interest_rate
    FROM accounts_receivable
    WHERE id = p_receivable_id;
    
    v_days_late := CURRENT_DATE - v_due_date;
    
    IF v_days_late > 0 AND v_interest_rate > 0 THEN
        -- Juros simples: valor * (taxa/100) * (dias/30)
        v_late_fee := v_amount * (v_interest_rate / 100) * (v_days_late / 30.0);
        
        UPDATE accounts_receivable
        SET late_fee = v_late_fee,
            updated_at = NOW()
        WHERE id = p_receivable_id;
        
        RETURN v_late_fee;
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Função: Gerar Parcelas (A Receber)
CREATE OR REPLACE FUNCTION fn_generate_installments_receivable(
    p_client_id INTEGER,
    p_total_amount DECIMAL(10,2),
    p_installments INTEGER,
    p_first_due_date DATE,
    p_description TEXT,
    p_interest_rate DECIMAL(5,2) DEFAULT 0,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_installment_value DECIMAL(10,2);
    v_due_date DATE;
    i INTEGER;
BEGIN
    v_installment_value := ROUND(p_total_amount / p_installments, 2);
    
    FOR i IN 1..p_installments LOOP
        v_due_date := p_first_due_date + ((i - 1) * INTERVAL '1 month');
        
        INSERT INTO accounts_receivable (
            client_id,
            description,
            amount_total,
            amount_remaining,
            original_amount,
            due_date,
            installment_number,
            total_installments,
            interest_rate,
            status,
            reference_type,
            reference_id
        ) VALUES (
            p_client_id,
            p_description || ' - Parcela ' || i || '/' || p_installments,
            v_installment_value,
            v_installment_value,
            v_installment_value,
            v_due_date,
            i,
            p_installments,
            p_interest_rate,
            'pending',
            p_reference_type,
            p_reference_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função: Gerar Parcelas (A Pagar)
CREATE OR REPLACE FUNCTION fn_generate_installments_payable(
    p_supplier_id INTEGER,
    p_total_amount DECIMAL(10,2),
    p_installments INTEGER,
    p_first_due_date DATE,
    p_description TEXT,
    p_category_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_installment_value DECIMAL(10,2);
    v_due_date DATE;
    i INTEGER;
BEGIN
    v_installment_value := ROUND(p_total_amount / p_installments, 2);
    
    FOR i IN 1..p_installments LOOP
        v_due_date := p_first_due_date + ((i - 1) * INTERVAL '1 month');
        
        INSERT INTO accounts_payable (
            supplier_id,
            description,
            amount_total,
            amount_remaining,
            original_amount,
            due_date,
            installment_number,
            total_installments,
            category_id,
            status
        ) VALUES (
            p_supplier_id,
            p_description || ' - Parcela ' || i || '/' || p_installments,
            v_installment_value,
            v_installment_value,
            v_installment_value,
            v_due_date,
            i,
            p_installments,
            p_category_id,
            'pending'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função: Baixar Conta a Receber
CREATE OR REPLACE FUNCTION fn_pay_receivable(
    p_receivable_id INTEGER,
    p_amount_paid DECIMAL(10,2),
    p_payment_date DATE DEFAULT CURRENT_DATE,
    p_payment_method VARCHAR(30) DEFAULT 'dinheiro',
    p_discount DECIMAL(10,2) DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    v_client_id INTEGER;
    v_amount_remaining DECIMAL(10,2);
    v_category_id INTEGER;
BEGIN
    -- Buscar dados
    SELECT client_id, amount_remaining
    INTO v_client_id, v_amount_remaining
    FROM accounts_receivable
    WHERE id = p_receivable_id;
    
    -- Buscar categoria de receita
    SELECT id INTO v_category_id
    FROM financial_categories
    WHERE name = 'Fiado Recebido'
    LIMIT 1;
    
    -- Atualizar conta
    UPDATE accounts_receivable
    SET amount_paid = amount_paid + p_amount_paid,
        amount_remaining = amount_remaining - p_amount_paid + p_discount,
        discount = discount + p_discount,
        payment_date = p_payment_date,
        payment_method = p_payment_method,
        status = CASE 
            WHEN (amount_remaining - p_amount_paid + p_discount) <= 0 THEN 'paid'
            ELSE 'partial'
        END,
        updated_at = NOW()
    WHERE id = p_receivable_id;
    
    -- Registrar no fluxo de caixa
    INSERT INTO cash_flow (date, type, category_id, description, amount, reference_type, reference_id)
    VALUES (
        p_payment_date,
        'entrada',
        v_category_id,
        'Recebimento - Conta #' || p_receivable_id,
        p_amount_paid,
        'receivable',
        p_receivable_id
    );
    
    -- Atualizar crédito do cliente
    IF v_client_id IS NOT NULL THEN
        PERFORM fn_update_client_credit(v_client_id, p_amount_paid, 'subtract');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 7: TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger: Criar entrada no fluxo de caixa ao vender
CREATE OR REPLACE FUNCTION trg_create_cash_flow_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id INTEGER;
BEGIN
    IF NEW.status = 'concluida' AND NEW.payment_method != 'fiado' THEN
        -- Buscar categoria
        SELECT id INTO v_category_id
        FROM financial_categories
        WHERE name = 'Vendas'
        LIMIT 1;
        
        -- Inserir no fluxo
        INSERT INTO cash_flow (date, type, category_id, description, amount, reference_type, reference_id)
        VALUES (
            CURRENT_DATE,
            'entrada',
            v_category_id,
            'Venda #' || NEW.id,
            NEW.total_amount,
            'sale',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_cash_flow_on_sale ON sales;
CREATE TRIGGER trg_create_cash_flow_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION trg_create_cash_flow_on_sale();

-- =====================================================
-- FIM DA MIGRATION - MÓDULO FINANCEIRO COMPLETO
-- =====================================================

-- VERIFICAÇÃO
/*
SELECT 'Categorias' as tipo, COUNT(*) FROM financial_categories
UNION ALL
SELECT 'Fluxo de Caixa' as tipo, COUNT(*) FROM cash_flow
UNION ALL
SELECT 'Views' as tipo, COUNT(*) FROM information_schema.views WHERE table_name LIKE 'vw_%financial%' OR table_name LIKE 'vw_%cash_flow%' OR table_name LIKE 'vw_dre%';
*/
