-- =====================================================
-- MÓDULO CLIENTE - CORRIGIDO COM NOMES REAIS
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
    c.financial_status,
    COALESCE(SUM(CASE WHEN ar.status = 'pending' THEN ar.amount ELSE 0 END), 0) as total_debt,
    COALESCE(SUM(CASE WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN ar.amount ELSE 0 END), 0) as overdue_debt,
    COUNT(CASE WHEN ar.status = 'pending' AND ar.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
    MIN(CASE WHEN ar.status = 'pending' AND ar.due_date >= CURRENT_DATE THEN ar.due_date END) as next_due_date
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
    SUM(si.quantity) as total_items
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
    s.total_amount,
    d.freight_value as delivery_fee,
    d.status,
    CONCAT(d.delivery_street, ', ', d.delivery_number, ' - ', d.delivery_neighborhood, ', ', d.delivery_city, '/', d.delivery_state) as address,
    d.delivery_notes as notes,
    d.payment_method
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
    COUNT(ar.id) as overdue_installments,
    SUM(ar.amount) as total_overdue,
    MIN(ar.due_date) as oldest_due_date,
    MAX(ar.due_date) as latest_due_date,
    CURRENT_DATE - MIN(ar.due_date) as days_overdue
FROM clients c
INNER JOIN accounts_receivable ar ON c.id = ar.client_id
WHERE ar.status = 'pending'
AND ar.due_date < CURRENT_DATE
GROUP BY c.id
ORDER BY days_overdue DESC;

-- Funções já existem no sistema, não precisa recriar
-- Triggers já existem no sistema, não precisa recriar
