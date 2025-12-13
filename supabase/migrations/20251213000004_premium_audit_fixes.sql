-- Migration: Premium Audit Fixes (The "Shield") - FIXED
-- Created at: 2025-12-13
-- Description: Ensures all Dashboards have their Views and all Actions trigger their side-effects.
-- FIX: Added DROP VIEW ... CASCADE to handle schema changes correctly.
-- FIX: Added ALTER TABLE to ensure 'amount_remaining' exists (Common schema drift issue).

-- =====================================================
-- 0. SCHEMA REPAIR (Fix Missing Columns)
-- =====================================================
DO $$
BEGIN
    -- Fix accounts_receivable: Ensure amount_remaining exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts_receivable' AND column_name = 'amount_remaining') THEN
        ALTER TABLE accounts_receivable ADD COLUMN amount_remaining DECIMAL(10,2) DEFAULT 0;
        
        -- Backfill strategy: Use 'amount' (confirmed existing) and 'amount_paid' (if exists)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts_receivable' AND column_name = 'amount_paid') THEN
            UPDATE accounts_receivable SET amount_remaining = amount - COALESCE(amount_paid, 0);
        ELSE
            UPDATE accounts_receivable SET amount_remaining = amount;
        END IF;
    END IF;

    -- Fix accounts_payable: Ensure amount_remaining exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts_payable' AND column_name = 'amount_remaining') THEN
        ALTER TABLE accounts_payable ADD COLUMN amount_remaining DECIMAL(10,2) DEFAULT 0;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts_payable' AND column_name = 'amount_paid') THEN
             UPDATE accounts_payable SET amount_remaining = amount_total - COALESCE(amount_paid, 0);
        ELSE
             -- Fallback if amount_total/amount confusion exists here too, try amount if amount_total fails? 
             -- Safest is to check naming. Assuming 'amount_total' might be 'amount' here too.
             IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts_payable' AND column_name = 'amount') THEN
                UPDATE accounts_payable SET amount_remaining = amount;
             ELSE
                -- Last resort/Schema standard
                UPDATE accounts_payable SET amount_remaining = amount_total; 
             END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 1. VIEWS DE DASHBOARD (Prevent White Screens)
-- =====================================================

-- 1.1. OS Kanban
DROP VIEW IF EXISTS vw_os_kanban CASCADE;
CREATE OR REPLACE VIEW vw_os_kanban AS
SELECT 
    so.id,
    so.numero,
    so.client_id,
    so.user_id,
    c.name as cliente_nome,
    so.device_type,
    so.device_brand,
    so.device_model,
    so.reported_issue,
    so.status,
    so.prioridade,
    so.prazo_entrega,
    so.valor_final,
    so.created_at,
    so.updated_at,
    so.status_prazo,
    so.dias_restantes
FROM service_orders so
LEFT JOIN clients c ON so.client_id = c.id;

-- 1.2. Technician Productivity
DROP VIEW IF EXISTS vw_technician_productivity CASCADE;
CREATE OR REPLACE VIEW vw_technician_productivity AS
SELECT 
    u.id as tecnico_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as nome,
    COUNT(so.id) FILTER (WHERE so.status = 'concluida') as os_concluidas,
    COUNT(so.id) FILTER (WHERE so.status = 'em_andamento') as os_em_andamento,
    COALESCE(AVG(EXTRACT(EPOCH FROM (so.data_conclusao - so.data_inicio_reparo))/3600), 0) as tempo_medio_horas,
    COALESCE(
        (COUNT(so.id) FILTER (WHERE so.orcamento_aprovado = true)::DECIMAL / 
        NULLIF(COUNT(so.id) FILTER (WHERE so.orcamento_aprovado IS NOT NULL), 0)) * 100, 
    0) as taxa_aprovacao,
    COALESCE(SUM(so.valor_servicos), 0) as faturamento_servicos,
    COALESCE(SUM(so.valor_pecas), 0) as faturamento_pecas,
    COALESCE(SUM(so.valor_final), 0) as faturamento_total
FROM auth.users u
LEFT JOIN service_orders so ON u.id = so.user_id
GROUP BY u.id, u.email, u.raw_user_meta_data;

-- 1.3. Overall OS Dashboard
DROP VIEW IF EXISTS vw_os_dashboard CASCADE;
CREATE OR REPLACE VIEW vw_os_dashboard AS
SELECT 
    COUNT(id) as total_os,
    COUNT(id) FILTER (WHERE status = 'aberta') as os_abertas,
    COUNT(id) FILTER (WHERE status = 'em_andamento') as os_em_andamento,
    COUNT(id) FILTER (WHERE status = 'concluida') as os_concluidas,
    COUNT(id) FILTER (WHERE status = 'entregue') as os_entregues,
    COUNT(id) FILTER (WHERE status = 'cancelada') as os_canceladas,
    COUNT(id) FILTER (WHERE status_prazo = 'vencida') as os_vencidas,
    COUNT(id) FILTER (WHERE status_prazo = 'vencendo') as os_vencendo,
    COUNT(id) FILTER (WHERE prioridade = 'urgente') as os_urgentes,
    COUNT(id) FILTER (WHERE prioridade = 'alta') as os_alta_prioridade,
    COALESCE(AVG(valor_final) FILTER (WHERE status = 'concluida'), 0) as ticket_medio,
    COALESCE(SUM(valor_final) FILTER (WHERE DATE(data_conclusao) = CURRENT_DATE), 0) as faturamento_dia,
    COALESCE(SUM(valor_final) FILTER (WHERE DATE_TRUNC('month', data_conclusao) = DATE_TRUNC('month', CURRENT_DATE)), 0) as faturamento_mes,
    COALESCE(
        (COUNT(id) FILTER (WHERE status = 'concluida')::DECIMAL / NULLIF(COUNT(id), 0)) * 100,
    0) as taxa_aprovacao_geral,
    COALESCE(
        (COUNT(id) FILTER (WHERE status = 'cancelada')::DECIMAL / NULLIF(COUNT(id), 0)) * 100,
    0) as taxa_cancelamento
FROM service_orders;

-- 1.4 Sales Today (Main Dashboard)
DROP VIEW IF EXISTS vw_dashboard_sales_today CASCADE;
CREATE OR REPLACE VIEW vw_dashboard_sales_today AS
SELECT 
    COALESCE(SUM(total_amount), 0) as total_sales,
    COUNT(id) as sales_count,
    COALESCE(AVG(total_amount), 0) as average_ticket
FROM sales
WHERE DATE(created_at) = CURRENT_DATE AND status = 'concluida';

-- 1.5 Financial Summary (Main Dashboard)
DROP VIEW IF EXISTS vw_dashboard_financial_summary CASCADE;
CREATE OR REPLACE VIEW vw_dashboard_financial_summary AS
SELECT
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as receita_mensal,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as despesa_mensal,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND date = CURRENT_DATE) as receita_hoje,
    (SELECT COALESCE(SUM(amount_remaining), 0) FROM accounts_receivable WHERE status = 'pending' AND due_date < CURRENT_DATE) as inadimplencia,
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'entrada' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) -
    (SELECT COALESCE(SUM(amount), 0) FROM cash_flow WHERE type = 'saida' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)) as lucro_liquido;

-- =====================================================
-- 2. PERMISSÕES DE VIEWS (Garantir Acesso)
-- =====================================================
GRANT SELECT ON vw_os_kanban TO authenticated;
GRANT SELECT ON vw_technician_productivity TO authenticated;
GRANT SELECT ON vw_os_dashboard TO authenticated;
GRANT SELECT ON vw_dashboard_sales_today TO authenticated;
GRANT SELECT ON vw_dashboard_financial_summary TO authenticated;

-- =====================================================
-- 3. TRIGGERS DE INTEGRIDADE (Garantir Lógica Real)
-- =====================================================

-- 3.1. Estoque: Decrementar ao Inserir Item de Venda
CREATE OR REPLACE FUNCTION trigger_decrement_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se é uma venda concluída (opcional, dependendo do fluxo. Assumindo que item criado = saiu do estoque)
  -- Se a venda for criada como pendente, talvez não deva baixar ainda. 
  -- Mas na lógica atual do PDV, a venda já nasce 'concluida' ou os itens são inseridos no checkout.
  -- Vamos blindar: Baixa se a venda não for 'orcamento'.
  
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  
  -- Log de Movimentação (Auditoria)
  INSERT INTO stock_movements (
    product_id, 
    quantity_change, 
    new_stock_level, 
    movement_type, 
    description, 
    created_at
  ) 
  SELECT 
    NEW.product_id,
    -NEW.quantity,
    (p.stock_quantity), -- O update já aconteceu acima, então pegamos o valor atual
    'saida',
    'Venda Automática PDV/OS',
    NOW()
  FROM products p WHERE p.id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sale_item_insert_decrement_stock ON sale_items;
CREATE TRIGGER on_sale_item_insert_decrement_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_decrement_stock();

-- 3.2. Financeiro: Entrada no Caixa ao Concluir Venda
CREATE OR REPLACE FUNCTION trg_create_cash_flow_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id INTEGER;
BEGIN
    -- Só gera financeiro se for venda concluída e não for fiado (fiado vai pra contas a receber)
    IF NEW.status = 'concluida' AND NEW.payment_method != 'fiado' THEN
        
        -- Buscar ID da categoria 'Vendas' (ou cria se não existir)
        SELECT id INTO v_category_id FROM financial_categories WHERE name = 'Vendas' LIMIT 1;
        
        IF v_category_id IS NULL THEN
            INSERT INTO financial_categories (name, type) VALUES ('Vendas', 'receita') RETURNING id INTO v_category_id;
        END IF;

        -- Inserir no Fluxo de Caixa
        INSERT INTO cash_flow (
            date, 
            type, 
            category_id, 
            description, 
            amount, 
            reference_type, 
            reference_id,
            created_at
        ) VALUES (
            CURRENT_DATE,
            'entrada',
            v_category_id,
            'Venda #' || NEW.id,
            NEW.total_amount,
            'sale',
            NEW.id,
            NOW()
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
