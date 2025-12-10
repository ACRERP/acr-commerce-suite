-- =====================================================
-- MÓDULO DASHBOARD - Views e Funções
-- Criado em: 06/12/2025
-- Objetivo: Fornecer indicadores gerenciais em tempo real
-- =====================================================

-- =====================================================
-- 1. VIEW: Vendas de Hoje
-- =====================================================

CREATE OR REPLACE VIEW vw_dashboard_sales_today AS
SELECT 
    COUNT(*) as total_vendas,
    COALESCE(SUM(total), 0) as valor_total,
    COALESCE(AVG(total), 0) as ticket_medio,
    COUNT(DISTINCT client_id) as clientes_atendidos,
    COALESCE(SUM(CASE WHEN type = 'delivery' THEN 1 ELSE 0 END), 0) as vendas_delivery,
    COALESCE(SUM(CASE WHEN type = 'counter' THEN 1 ELSE 0 END), 0) as vendas_balcao
FROM sales
WHERE DATE(created_at) = CURRENT_DATE
AND status IN ('completed', 'paid');

COMMENT ON VIEW vw_dashboard_sales_today IS 'Resumo das vendas do dia atual';

-- =====================================================
-- 2. VIEW: Vendas do Mês
-- =====================================================

CREATE OR REPLACE VIEW vw_dashboard_sales_month AS
SELECT 
    COUNT(*) as total_vendas,
    COALESCE(SUM(total), 0) as valor_total,
    COALESCE(AVG(total), 0) as ticket_medio,
    COUNT(DISTINCT client_id) as clientes_atendidos,
    COALESCE(SUM(discount), 0) as total_descontos,
    COALESCE(SUM(delivery_fee), 0) as total_frete
FROM sales
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
AND status IN ('completed', 'paid');

COMMENT ON VIEW vw_dashboard_sales_month IS 'Resumo das vendas do mês atual';

-- =====================================================
-- 3. VIEW: Alertas de Estoque
-- =====================================================

CREATE OR REPLACE VIEW vw_dashboard_stock_alerts AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.barcode,
    p.stock_quantity,
    p.min_stock,
    p.sale_price,
    pc.name as category_name,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'out_of_stock'
        WHEN p.stock_quantity <= p.min_stock THEN 'low_stock'
        ELSE 'ok'
    END as alert_level
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.stock_quantity <= p.min_stock OR p.stock_quantity = 0
ORDER BY 
    CASE 
        WHEN p.stock_quantity = 0 THEN 1
        WHEN p.stock_quantity <= p.min_stock THEN 2
        ELSE 3
    END,
    p.stock_quantity ASC;

COMMENT ON VIEW vw_dashboard_stock_alerts IS 'Produtos com estoque baixo ou zerado';

-- =====================================================
-- 4. VIEW: Status de Deliveries
-- =====================================================

CREATE OR REPLACE VIEW vw_dashboard_delivery_status AS
SELECT 
    status,
    COUNT(*) as quantidade,
    COALESCE(SUM(total_amount), 0) as valor_total
FROM delivery_orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pending' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'in_transit' THEN 3
        WHEN 'delivered' THEN 4
        WHEN 'cancelled' THEN 5
    END;

COMMENT ON VIEW vw_dashboard_delivery_status IS 'Status dos deliveries do dia';

-- =====================================================
-- 5. FUNÇÃO: Vendas por Dia (Últimos 30 dias)
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_sales_by_day(
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    data DATE,
    total_vendas BIGINT,
    valor_total DECIMAL(10,2),
    ticket_medio DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(s.created_at) as data,
        COUNT(*)::BIGINT as total_vendas,
        COALESCE(SUM(s.total), 0)::DECIMAL(10,2) as valor_total,
        COALESCE(AVG(s.total), 0)::DECIMAL(10,2) as ticket_medio
    FROM sales s
    WHERE s.created_at >= CURRENT_DATE - p_days
    AND s.status IN ('completed', 'paid')
    GROUP BY DATE(s.created_at)
    ORDER BY DATE(s.created_at) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_sales_by_day IS 'Retorna vendas agrupadas por dia nos últimos N dias';

-- =====================================================
-- 6. FUNÇÃO: Vendas por Forma de Pagamento
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_sales_by_payment_method(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    payment_method VARCHAR(50),
    quantidade BIGINT,
    valor_total DECIMAL(10,2),
    percentual DECIMAL(5,2)
) AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    -- Calcular total geral
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM sale_payments sp
    JOIN sales s ON sp.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN p_start_date AND p_end_date
    AND s.status IN ('completed', 'paid');
    
    -- Retornar agrupado por forma de pagamento
    RETURN QUERY
    SELECT 
        sp.payment_method::VARCHAR(50),
        COUNT(DISTINCT sp.sale_id)::BIGINT as quantidade,
        COALESCE(SUM(sp.amount), 0)::DECIMAL(10,2) as valor_total,
        CASE 
            WHEN v_total > 0 THEN (SUM(sp.amount) / v_total * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as percentual
    FROM sale_payments sp
    JOIN sales s ON sp.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN p_start_date AND p_end_date
    AND s.status IN ('completed', 'paid')
    GROUP BY sp.payment_method
    ORDER BY valor_total DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_sales_by_payment_method IS 'Vendas agrupadas por forma de pagamento em um período';

-- =====================================================
-- 7. FUNÇÃO: Vendas por Hora (Hoje)
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_sales_by_hour() 
RETURNS TABLE (
    hora INTEGER,
    total_vendas BIGINT,
    valor_total DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM created_at)::INTEGER as hora,
        COUNT(*)::BIGINT as total_vendas,
        COALESCE(SUM(total), 0)::DECIMAL(10,2) as valor_total
    FROM sales
    WHERE DATE(created_at) = CURRENT_DATE
    AND status IN ('completed', 'paid')
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hora;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_sales_by_hour IS 'Vendas agrupadas por hora do dia atual';

-- =====================================================
-- 8. FUNÇÃO: Produtos Mais Vendidos
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_top_products(
    p_limit INTEGER DEFAULT 10,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR(255),
    product_code VARCHAR(50),
    quantidade_vendida DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    numero_vendas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.product_id,
        si.product_name::VARCHAR(255),
        si.product_code::VARCHAR(50),
        SUM(si.quantity)::DECIMAL(10,2) as quantidade_vendida,
        SUM(si.subtotal)::DECIMAL(10,2) as valor_total,
        COUNT(DISTINCT si.sale_id)::BIGINT as numero_vendas
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN p_start_date AND p_end_date
    AND s.status IN ('completed', 'paid')
    GROUP BY si.product_id, si.product_name, si.product_code
    ORDER BY quantidade_vendida DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_top_products IS 'Produtos mais vendidos em um período';

-- =====================================================
-- 9. FUNÇÃO: Ticket Médio por Período
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_average_ticket(
    p_period VARCHAR(20) DEFAULT 'today'
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_avg DECIMAL(10,2);
BEGIN
    CASE p_period
        WHEN 'today' THEN
            SELECT COALESCE(AVG(total), 0) INTO v_avg
            FROM sales
            WHERE DATE(created_at) = CURRENT_DATE
            AND status IN ('completed', 'paid');
            
        WHEN 'week' THEN
            SELECT COALESCE(AVG(total), 0) INTO v_avg
            FROM sales
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND status IN ('completed', 'paid');
            
        WHEN 'month' THEN
            SELECT COALESCE(AVG(total), 0) INTO v_avg
            FROM sales
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            AND status IN ('completed', 'paid');
            
        ELSE
            v_avg := 0;
    END CASE;
    
    RETURN v_avg;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_average_ticket IS 'Calcula ticket médio por período (today, week, month)';

-- =====================================================
-- 10. FUNÇÃO: Comparação com Período Anterior
-- =====================================================

CREATE OR REPLACE FUNCTION fn_get_period_comparison(
    p_period VARCHAR(20) DEFAULT 'today'
) RETURNS TABLE (
    periodo_atual DECIMAL(10,2),
    periodo_anterior DECIMAL(10,2),
    diferenca DECIMAL(10,2),
    percentual_crescimento DECIMAL(5,2)
) AS $$
DECLARE
    v_atual DECIMAL(10,2);
    v_anterior DECIMAL(10,2);
BEGIN
    CASE p_period
        WHEN 'today' THEN
            -- Hoje vs Ontem
            SELECT COALESCE(SUM(total), 0) INTO v_atual
            FROM sales
            WHERE DATE(created_at) = CURRENT_DATE
            AND status IN ('completed', 'paid');
            
            SELECT COALESCE(SUM(total), 0) INTO v_anterior
            FROM sales
            WHERE DATE(created_at) = CURRENT_DATE - 1
            AND status IN ('completed', 'paid');
            
        WHEN 'week' THEN
            -- Esta semana vs Semana passada
            SELECT COALESCE(SUM(total), 0) INTO v_atual
            FROM sales
            WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
            AND status IN ('completed', 'paid');
            
            SELECT COALESCE(SUM(total), 0) INTO v_anterior
            FROM sales
            WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
            AND created_at < DATE_TRUNC('week', CURRENT_DATE)
            AND status IN ('completed', 'paid');
            
        WHEN 'month' THEN
            -- Este mês vs Mês passado
            SELECT COALESCE(SUM(total), 0) INTO v_atual
            FROM sales
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            AND status IN ('completed', 'paid');
            
            SELECT COALESCE(SUM(total), 0) INTO v_anterior
            FROM sales
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            AND status IN ('completed', 'paid');
    END CASE;
    
    RETURN QUERY
    SELECT 
        v_atual as periodo_atual,
        v_anterior as periodo_anterior,
        (v_atual - v_anterior) as diferenca,
        CASE 
            WHEN v_anterior > 0 THEN ((v_atual - v_anterior) / v_anterior * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as percentual_crescimento;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_period_comparison IS 'Compara vendas do período atual com anterior';

-- =====================================================
-- 11. VIEW: Resumo Financeiro
-- =====================================================

CREATE OR REPLACE VIEW vw_dashboard_financial_summary AS
SELECT 
    -- Contas a Receber
    (SELECT COALESCE(SUM(amount_remaining), 0) 
     FROM accounts_receivable 
     WHERE status = 'pending') as contas_receber_pendente,
    
    (SELECT COALESCE(SUM(amount_remaining), 0) 
     FROM accounts_receivable 
     WHERE status = 'pending' AND due_date < CURRENT_DATE) as contas_receber_vencidas,
    
    -- Contas a Pagar
    (SELECT COALESCE(SUM(amount_remaining), 0) 
     FROM accounts_payable 
     WHERE status = 'pending') as contas_pagar_pendente,
    
    (SELECT COALESCE(SUM(amount_remaining), 0) 
     FROM accounts_payable 
     WHERE status = 'pending' AND due_date < CURRENT_DATE) as contas_pagar_vencidas,
    
    -- Caixa
    (SELECT COALESCE(SUM(current_balance), 0) 
     FROM cash_registers 
     WHERE status = 'open') as saldo_caixas_abertos,
    
    -- Estoque
    (SELECT COALESCE(SUM(stock_quantity * cost_price), 0) 
     FROM products 
     WHERE stock_quantity > 0) as valor_estoque;

COMMENT ON VIEW vw_dashboard_financial_summary IS 'Resumo financeiro para dashboard';

-- =====================================================
-- FIM DAS VIEWS E FUNÇÕES
-- =====================================================

