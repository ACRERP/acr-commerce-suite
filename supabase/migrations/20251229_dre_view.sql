-- Migration: Create View for DRE (Demonstrativo de Resultado do Exercício)
-- Aggregates monthly financial data: Revenue, COGS (CMV), Expenses, Net Profit

CREATE OR REPLACE VIEW public.vw_dre_report AS
WITH 
-- 1. Gross Revenue (Receita Bruta) from Sales
monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', created_at)::DATE as month,
        SUM(total_amount) as revenue,
        COUNT(id) as sales_count
    FROM public.sales
    WHERE status != 'cancelled'
    GROUP BY 1
),

-- 2. Cost of Goods Sold (CMV) 
-- Calculated by: Sales Quantity * Product Current Cost (Approximation)
-- Ideally we would track historical cost, but for now we join with products.cost_price
monthly_cogs AS (
    SELECT 
        DATE_TRUNC('month', im.created_at)::DATE as month,
        SUM(im.quantity * COALESCE(p.cost_price, 0)) as cogs
    FROM public.inventory_movements im
    JOIN public.products p ON im.product_id = p.id
    WHERE im.type = 'out' 
      AND im.document_ref LIKE 'SALE-%'
    GROUP BY 1
),

-- 3. Operational Expenses (Despesas)
-- From financial_transactions where type = 'expense' and status is paid/completed
monthly_expenses AS (
    SELECT 
        DATE_TRUNC('month', due_date)::DATE as month,
        SUM(amount) as expenses
    FROM public.financial_transactions
    WHERE type = 'expense' 
      AND status IN ('paid', 'completed')
    GROUP BY 1
)

-- 4. Combine All
SELECT 
    COALESCE(s.month, c.month, e.month) as month,
    COALESCE(s.revenue, 0) as gross_revenue,
    COALESCE(c.cogs, 0) as cogs, -- Custo Mercadoria Vendida
    (COALESCE(s.revenue, 0) - COALESCE(c.cogs, 0)) as gross_profit, -- Lucro Bruto
    COALESCE(e.expenses, 0) as operational_expenses,
    (COALESCE(s.revenue, 0) - COALESCE(c.cogs, 0) - COALESCE(e.expenses, 0)) as net_profit, -- Lucro Líquido
    
    -- Metrics
    CASE WHEN COALESCE(s.revenue, 0) > 0 
        THEN ROUND(((COALESCE(s.revenue, 0) - COALESCE(c.cogs, 0)) / s.revenue * 100)::numeric, 2)
        ELSE 0 
    END as gross_margin_percent,
    
    CASE WHEN COALESCE(s.revenue, 0) > 0 
        THEN ROUND(((COALESCE(s.revenue, 0) - COALESCE(c.cogs, 0) - COALESCE(e.expenses, 0)) / s.revenue * 100)::numeric, 2)
        ELSE 0 
    END as net_margin_percent

FROM monthly_sales s
FULL OUTER JOIN monthly_cogs c ON s.month = c.month
FULL OUTER JOIN monthly_expenses e ON s.month = e.month
ORDER BY month DESC;
