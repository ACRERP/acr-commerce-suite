-- =====================================================
-- MÓDULO RELATÓRIOS - Views e Funções (CORRIGIDO)
-- Criado em: 06/12/2025
-- Objetivo: Fornecer relatórios detalhados para análise
-- NOTA: Versão corrigida com nomes de colunas corretos
-- =====================================================

-- =====================================================
-- 1. VIEW: Relatório de Vendas Detalhado
-- =====================================================

CREATE OR REPLACE VIEW vw_report_sales_detailed AS
SELECT 
    s.id as sale_id,
    s.created_at,
    DATE(s.created_at) as data_venda,
    COALESCE(s.total_amount, 0) as total_amount,
    COALESCE(s.total_amount - COALESCE(discount, 0) + COALESCE(addition, 0), 0) as total_amount - COALESCE(discount, 0) + COALESCE(addition, 0),
    COALESCE(s.discount, 0) as discount,
    COALESCE(s.delivery_fee, 0) as delivery_fee,
    s.status,
    COALESCE(s.type, 'counter') as type,
    c.name as client_name,
    c.cpf_cnpj as client_cpf_cnpj,
    c.phone as client_phone,
    s.cash_register_id,
    -- Formas de pagamento (agregadas)
    STRING_AGG(DISTINCT sp.payment_method::TEXT, ', ') as payment_methods,
    -- Itens (contagem)
    COUNT(DISTINCT si.id) as total_items,
    COALESCE(SUM(si.quantity), 0) as total_quantity
FROM sales s
LEFT JOIN clients c ON s.client_id = c.id
LEFT JOIN sale_payments sp ON s.id = sp.sale_id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY 
    s.id, s.created_at, s.total_amount, s.total_amount - COALESCE(discount, 0) + COALESCE(addition, 0), s.discount,
    s.delivery_fee, s.status, s.type,
    c.name, c.cpf_cnpj, c.phone, s.cash_register_id;

COMMENT ON VIEW vw_report_sales_detailed IS 'Relatório detalhado de vendas com cliente e pagamentos';

-- =====================================================
-- 2. VIEW: Relatório de Produtos Vendidos
-- =====================================================

CREATE OR REPLACE VIEW vw_report_products_sold AS
SELECT 
    si.product_id,
    si.product_name,
    si.product_code,
    p.barcode,
    pc.name as category_name,
    DATE(s.created_at) as data_venda,
    SUM(si.quantity) as quantidade_vendida,
    SUM(si.total_amount - COALESCE(discount, 0) + COALESCE(addition, 0)) as valor_total,
    AVG(si.unit_price) as preco_medio,
    COUNT(DISTINCT s.id) as numero_vendas,
    COUNT(DISTINCT s.client_id) as clientes_unicos
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
LEFT JOIN products p ON si.product_id = p.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE s.status IN ('completed', 'paid')
GROUP BY 
    si.product_id, si.product_name, si.product_code,
    p.barcode, pc.name, DATE(s.created_at);

COMMENT ON VIEW vw_report_products_sold IS 'Relatório de produtos vendidos por dia';

-- =====================================================
-- 3. VIEW: Relatório de Estoque
-- =====================================================

CREATE OR REPLACE VIEW vw_report_inventory AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.barcode,
    pc.name as category_name,
    p.stock_quantity,
    p.min_stock,
    p.cost_price,
    p.sale_price,
    (p.sale_price - p.cost_price) as margem_lucro,
    ((p.sale_price - p.cost_price) / NULLIF(p.cost_price, 0) * 100) as margem_percentual,
    (p.stock_quantity * p.cost_price) as valor_estoque_custo,
    (p.stock_quantity * p.sale_price) as valor_estoque_venda,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'Sem estoque'
        WHEN p.stock_quantity <= p.min_stock THEN 'Estoque baixo'
        ELSE 'Normal'
    END as status_estoque,
    p.updated_at as ultima_atualizacao
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
ORDER BY p.name;

COMMENT ON VIEW vw_report_inventory IS 'Relatório completo de estoque com valores e margens';

-- =====================================================
-- 4. VIEW: Relatório Financeiro
-- =====================================================

CREATE OR REPLACE VIEW vw_report_financial AS
SELECT 
    'Receber' as tipo,
    ar.id,
    ar.description,
    ar.amount_total,
    ar.amount_paid,
    ar.amount_remaining,
    ar.due_date,
    ar.status,
    c.name as cliente_fornecedor,
    ar.created_at,
    CASE 
        WHEN ar.status = 'paid' THEN 'Pago'
        WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN 'Vencido'
        WHEN ar.status = 'pending' THEN 'Pendente'
        ELSE ar.status
    END as status_descricao
FROM accounts_receivable ar
LEFT JOIN clients c ON ar.client_id = c.id

UNION ALL

SELECT 
    'Pagar' as tipo,
    ap.id,
    ap.description,
    ap.amount_total,
    ap.amount_paid,
    ap.amount_remaining,
    ap.due_date,
    ap.status,
    s.name as cliente_fornecedor,
    ap.created_at,
    CASE 
        WHEN ap.status = 'paid' THEN 'Pago'
        WHEN ap.status = 'pending' AND ap.due_date < CURRENT_DATE THEN 'Vencido'
        WHEN ap.status = 'pending' THEN 'Pendente'
        ELSE ap.status
    END as status_descricao
FROM accounts_payable ap
LEFT JOIN suppliers s ON ap.supplier_id = s.id

ORDER BY due_date DESC;

COMMENT ON VIEW vw_report_financial IS 'Relatório financeiro unificado de contas a receber e pagar';

-- =====================================================
-- 5. FUNÇÃO: Relatório de Vendas por Período
-- =====================================================

CREATE OR REPLACE FUNCTION fn_report_sales_period(
    p_start_date DATE,
    p_end_date DATE,
    p_group_by VARCHAR(20) DEFAULT 'day' -- day, week, month
) RETURNS TABLE (
    periodo TEXT,
    total_vendas BIGINT,
    valor_total DECIMAL(10,2),
    ticket_medio DECIMAL(10,2),
    total_descontos DECIMAL(10,2),
    total_frete DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            CASE 
                WHEN %L = ''day'' THEN TO_CHAR(DATE(created_at), ''DD/MM/YYYY'')
                WHEN %L = ''week'' THEN ''Semana '' || TO_CHAR(DATE_TRUNC(''week'', created_at), ''WW/YYYY'')
                WHEN %L = ''month'' THEN TO_CHAR(DATE_TRUNC(''month'', created_at), ''MM/YYYY'')
            END as periodo,
            COUNT(*)::BIGINT as total_vendas,
            COALESCE(SUM(total_amount), 0)::DECIMAL(10,2) as valor_total,
            COALESCE(AVG(total_amount), 0)::DECIMAL(10,2) as ticket_medio,
            COALESCE(SUM(discount), 0)::DECIMAL(10,2) as total_descontos,
            COALESCE(SUM(delivery_fee), 0)::DECIMAL(10,2) as total_frete
        FROM sales
        WHERE DATE(created_at) BETWEEN %L AND %L
        AND status IN (''completed'', ''paid'')
        GROUP BY 
            CASE 
                WHEN %L = ''day'' THEN DATE(created_at)
                WHEN %L = ''week'' THEN DATE_TRUNC(''week'', created_at)
                WHEN %L = ''month'' THEN DATE_TRUNC(''month'', created_at)
            END
        ORDER BY 
            CASE 
                WHEN %L = ''day'' THEN DATE(created_at)
                WHEN %L = ''week'' THEN DATE_TRUNC(''week'', created_at)
                WHEN %L = ''month'' THEN DATE_TRUNC(''month'', created_at)
            END DESC
    ', p_group_by, p_group_by, p_group_by, p_start_date, p_end_date, p_group_by, p_group_by, p_group_by, p_group_by, p_group_by, p_group_by);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_report_sales_period IS 'Relatório de vendas agrupado por dia, semana ou mês';

-- =====================================================
-- 6. FUNÇÃO: Relatório de Clientes
-- =====================================================

CREATE OR REPLACE FUNCTION fn_report_clients(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
) RETURNS TABLE (
    client_id UUID,
    client_name VARCHAR(255),
    client_cpf_cnpj VARCHAR(18),
    client_phone VARCHAR(20),
    total_compras BIGINT,
    valor_total DECIMAL(10,2),
    ticket_medio DECIMAL(10,2),
    ultima_compra TIMESTAMP,
    dias_desde_ultima_compra INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as client_id,
        c.name::VARCHAR(255) as client_name,
        c.cpf_cnpj::VARCHAR(18),
        c.phone::VARCHAR(20),
        COUNT(s.id)::BIGINT as total_compras,
        COALESCE(SUM(s.total_amount), 0)::DECIMAL(10,2) as valor_total,
        COALESCE(AVG(s.total_amount), 0)::DECIMAL(10,2) as ticket_medio,
        MAX(s.created_at) as ultima_compra,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - MAX(s.created_at)))::INTEGER as dias_desde_ultima_compra
    FROM clients c
    LEFT JOIN sales s ON c.id = s.client_id 
        AND s.status IN ('completed', 'paid')
        AND (p_start_date IS NULL OR DATE(s.created_at) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(s.created_at) <= p_end_date)
    GROUP BY c.id, c.name, c.cpf_cnpj, c.phone
    HAVING COUNT(s.id) > 0
    ORDER BY valor_total DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_report_clients IS 'Relatório de clientes com histórico de compras';

-- =====================================================
-- 7. FUNÇÃO: Relatório de Fluxo de Caixa
-- =====================================================

CREATE OR REPLACE FUNCTION fn_report_cash_flow(
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    data DATE,
    tipo VARCHAR(20),
    descricao TEXT,
    entrada DECIMAL(10,2),
    saida DECIMAL(10,2),
    saldo_dia DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH movimentos AS (
        -- Vendas (entradas)
        SELECT 
            DATE(created_at) as data,
            'Venda' as tipo,
            'Venda #' || id::TEXT as descricao,
            COALESCE(total_amount, 0) as valor,
            'entrada' as direcao
        FROM sales
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        AND status IN ('completed', 'paid')
        
        UNION ALL
        
        -- Contas a pagar (saídas)
        SELECT 
            DATE(payment_date) as data,
            'Pagamento' as tipo,
            description as descricao,
            amount_paid as valor,
            'saida' as direcao
        FROM accounts_payable
        WHERE DATE(payment_date) BETWEEN p_start_date AND p_end_date
        AND status = 'paid'
        
        UNION ALL
        
        -- Contas a receber (entradas)
        SELECT 
            DATE(payment_date) as data,
            'Recebimento' as tipo,
            description as descricao,
            amount_paid as valor,
            'entrada' as direcao
        FROM accounts_receivable
        WHERE DATE(payment_date) BETWEEN p_start_date AND p_end_date
        AND status = 'paid'
    )
    SELECT 
        m.data,
        m.tipo::VARCHAR(20),
        m.descricao,
        CASE WHEN m.direcao = 'entrada' THEN m.valor ELSE 0 END::DECIMAL(10,2) as entrada,
        CASE WHEN m.direcao = 'saida' THEN m.valor ELSE 0 END::DECIMAL(10,2) as saida,
        SUM(CASE WHEN m.direcao = 'entrada' THEN m.valor ELSE -m.valor END) 
            OVER (ORDER BY m.data, m.tipo)::DECIMAL(10,2) as saldo_dia
    FROM movimentos m
    ORDER BY m.data, m.tipo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_report_cash_flow IS 'Relatório de fluxo de caixa com entradas e saídas';

-- =====================================================
-- FIM DAS VIEWS E FUNÇÕES DE RELATÓRIOS
-- =====================================================
