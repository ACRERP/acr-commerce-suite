-- =====================================================
-- MÓDULO FINANCEIRO - CORRIGIDO COM NOMES REAIS
-- =====================================================

-- Tabela financial_categories
CREATE TABLE IF NOT EXISTS financial_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
    description TEXT,
    color VARCHAR(7),
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES financial_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO financial_categories (name, type, color, icon) VALUES
('Vendas', 'receita', '#10b981', 'shopping-cart'),
('Delivery', 'receita', '#3b82f6', 'truck'),
('Fiado Recebido', 'receita', '#8b5cf6', 'credit-card'),
('Serviços', 'receita', '#06b6d4', 'wrench'),
('Outras Receitas', 'receita', '#14b8a6', 'plus-circle'),
('Aluguel', 'despesa', '#ef4444', 'home'),
('Energia', 'despesa', '#f59e0b', 'zap'),
('Água', 'despesa', '#06b6d4', 'droplet'),
('Internet', 'despesa', '#8b5cf6', 'wifi'),
('Telefone', 'despesa', '#ec4899', 'phone'),
('Funcionários', 'despesa', '#f97316', 'users')
ON CONFLICT DO NOTHING;

-- Tabela cash_flow
CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida')),
    category_id INTEGER REFERENCES financial_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    user_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON cash_flow(type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_category ON cash_flow(category_id);

-- View: Dashboard Financeiro
CREATE OR REPLACE VIEW vw_financial_dashboard AS
SELECT 
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND date = CURRENT_DATE) as entradas_hoje,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND date = CURRENT_DATE) as saidas_hoje,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND date = CURRENT_DATE) - 
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND date = CURRENT_DATE) as saldo_hoje,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as entradas_mes,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as saidas_mes,
    (SELECT COALESCE(SUM(amount), 0) FROM accounts_receivable WHERE status = 'pending') as total_a_receber,
    (SELECT COALESCE(SUM(amount), 0) FROM accounts_receivable WHERE status = 'pending' AND due_date < CURRENT_DATE) as total_vencido_receber,
    (SELECT COALESCE(SUM(amount), 0) FROM accounts_payable WHERE status = 'pending') as total_a_pagar,
    (SELECT COALESCE(SUM(amount), 0) FROM accounts_payable WHERE status = 'pending' AND due_date < CURRENT_DATE) as total_vencido_pagar;

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

-- View: DRE Mensal
CREATE OR REPLACE VIEW vw_dre_monthly AS
WITH monthly_data AS (
    SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN cf.type = 'entrada' THEN cf.amount ELSE 0 END) as receita_bruta,
        SUM(CASE WHEN cf.type = 'saida' AND fc.name = 'Impostos' THEN cf.amount ELSE 0 END) as impostos,
        SUM(CASE WHEN cf.type = 'saida' AND fc.name = 'Compras de Estoque' THEN cf.amount ELSE 0 END) as custo_vendas,
        SUM(CASE WHEN cf.type = 'saida' AND fc.name NOT IN ('Impostos', 'Compras de Estoque') THEN cf.amount ELSE 0 END) as despesas_operacionais
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

-- View: Contas Vencidas
CREATE OR REPLACE VIEW vw_overdue_accounts AS
SELECT 
    'Receber' as tipo,
    ar.id,
    ar.client_id::text as entity_id,
    c.name as entity_name,
    ar.description,
    ar.amount as amount_total,
    ar.amount as amount_remaining,
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
    ap.supplier_id::text as entity_id,
    s.name as entity_name,
    ap.description,
    ap.amount as amount_total,
    ap.amount as amount_remaining,
    ap.due_date,
    CURRENT_DATE - ap.due_date as days_overdue,
    ap.installment_number,
    ap.total_installments
FROM accounts_payable ap
LEFT JOIN suppliers s ON ap.supplier_id = s.id
WHERE ap.status = 'pending'
AND ap.due_date < CURRENT_DATE

ORDER BY days_overdue DESC;
