-- =====================================================
-- MÓDULO DELIVERY - CORRIGIDO COM NOMES REAIS
-- =====================================================

-- Tabela delivery_men já existe como 'drivers'
-- Não precisa criar

-- View: Deliveries por Status (Hoje)
CREATE OR REPLACE VIEW vw_delivery_by_status AS
SELECT 
    d.status,
    COUNT(*) as quantity,
    SUM(s.total_amount) as total_value,
    AVG(d.freight_value) as avg_delivery_fee,
    AVG(CASE 
        WHEN d.delivered_at IS NOT NULL AND d.created_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (d.delivered_at - d.created_at))/60 
    END) as avg_delivery_time_minutes
FROM delivery_orders d
LEFT JOIN sales s ON d.sale_id = s.id
WHERE DATE(d.created_at) = CURRENT_DATE
GROUP BY d.status
ORDER BY 
    CASE d.status
        WHEN 'pending' THEN 1
        WHEN 'preparing' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'in_transit' THEN 4
        WHEN 'delivered' THEN 5
        WHEN 'cancelled' THEN 6
    END;

-- View: Performance de Entregadores (Hoje)
CREATE OR REPLACE VIEW vw_delivery_performance_today AS
SELECT 
    dr.id,
    dr.name,
    dr.vehicle_type as vehicle,
    dr.status,
    COUNT(d.id) as total_deliveries,
    COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed_deliveries,
    COUNT(CASE WHEN d.status IN ('in_transit', 'ready') THEN 1 END) as active_deliveries,
    SUM(CASE WHEN d.status = 'delivered' THEN s.total_amount ELSE 0 END) as total_value,
    SUM(CASE WHEN d.status = 'delivered' THEN d.freight_value ELSE 0 END) as total_fees,
    SUM(CASE WHEN d.status = 'delivered' THEN d.driver_commission ELSE 0 END) as total_commission,
    AVG(CASE 
        WHEN d.status = 'delivered' AND d.delivered_at IS NOT NULL AND d.dispatched_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (d.delivered_at - d.dispatched_at))/60 
    END) as avg_delivery_time_minutes
FROM drivers dr
LEFT JOIN delivery_orders d ON dr.id = d.driver_id AND DATE(d.created_at) = CURRENT_DATE
LEFT JOIN sales s ON d.sale_id = s.id
GROUP BY dr.id, dr.name, dr.vehicle_type, dr.status
ORDER BY completed_deliveries DESC;

-- View: Performance de Entregadores (Mensal)
CREATE OR REPLACE VIEW vw_delivery_performance_monthly AS
SELECT 
    dr.id,
    dr.name,
    DATE_TRUNC('month', d.created_at) as month,
    COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as total_deliveries,
    SUM(CASE WHEN d.status = 'delivered' THEN s.total_amount ELSE 0 END) as total_value,
    SUM(CASE WHEN d.status = 'delivered' THEN d.freight_value ELSE 0 END) as total_fees,
    SUM(CASE WHEN d.status = 'delivered' THEN d.driver_commission ELSE 0 END) as total_commission,
    AVG(CASE 
        WHEN d.status = 'delivered' AND d.delivered_at IS NOT NULL AND d.dispatched_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (d.delivered_at - d.dispatched_at))/60 
    END) as avg_delivery_time_minutes
FROM drivers dr
LEFT JOIN delivery_orders d ON dr.id = d.driver_id
LEFT JOIN sales s ON d.sale_id = s.id
WHERE d.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY dr.id, dr.name, DATE_TRUNC('month', d.created_at)
ORDER BY month DESC, total_deliveries DESC;

-- View: Deliveries Pendentes (Kanban)
CREATE OR REPLACE VIEW vw_delivery_kanban AS
SELECT 
    d.id,
    d.created_at,
    d.status,
    d.priority,
    c.name as customer_name,
    c.phone as customer_phone,
    CONCAT(d.delivery_street, ', ', d.delivery_number, ' - ', d.delivery_neighborhood, ', ', d.delivery_city, '/', d.delivery_state) as address,
    s.total_amount,
    d.freight_value as delivery_fee,
    d.payment_method,
    CASE WHEN d.payment_collected THEN 'paid' ELSE 'pending' END as payment_status,
    d.delivery_notes as observations,
    d.estimated_time,
    dr.name as delivery_man_name,
    dr.vehicle_type as vehicle,
    dr.phone as delivery_man_phone,
    c.name as client_name,
    EXTRACT(EPOCH FROM (NOW() - d.created_at))/60 as minutes_since_created
FROM delivery_orders d
LEFT JOIN drivers dr ON d.driver_id = dr.id
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN sales s ON d.sale_id = s.id
WHERE d.status IN ('pending', 'preparing', 'ready', 'in_transit')
ORDER BY 
    CASE d.priority WHEN 'urgent' THEN 1 ELSE 2 END,
    d.created_at ASC;
