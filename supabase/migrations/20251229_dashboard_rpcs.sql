-- RPC: Get Dashboard Stats
-- Calculates Revenue, Growth, New Customers, and Avg Ticket for the given period.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(period_days INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    current_revenue NUMERIC;
    previous_revenue NUMERIC;
    revenue_growth NUMERIC;
    new_customers INT;
    avg_ticket NUMERIC;
    sales_count INT;
    start_date DATE;
    previous_start_date DATE;
BEGIN
    start_date := CURRENT_DATE - period_days;
    previous_start_date := CURRENT_DATE - (period_days * 2);

    -- 1. Current Period Revenue
    SELECT COALESCE(SUM(total_amount), 0), COUNT(id)
    INTO current_revenue, sales_count
    FROM public.sales
    WHERE status != 'cancelled'
      AND created_at >= start_date;

    -- 2. Previous Period Revenue (for Growth calc)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO previous_revenue
    FROM public.sales
    WHERE status != 'cancelled'
      AND created_at >= previous_start_date
      AND created_at < start_date;

    -- Calculate Growth %
    IF previous_revenue > 0 THEN
        revenue_growth := ROUND(((current_revenue - previous_revenue) / previous_revenue * 100)::numeric, 2);
    ELSE
        revenue_growth := 0; -- Or 100 if went from 0 to something, but 0 is safer
    END IF;

    -- 3. New Customers
    SELECT COUNT(id)
    INTO new_customers
    FROM public.clients
    WHERE created_at >= start_date;

    -- 4. Avg Ticket
    IF sales_count > 0 THEN
        avg_ticket := ROUND((current_revenue / sales_count)::numeric, 2);
    ELSE
        avg_ticket := 0;
    END IF;

    RETURN json_build_object(
        'revenue', current_revenue,
        'revenue_growth', revenue_growth,
        'new_customers', new_customers,
        'avg_ticket', avg_ticket
    );
END;
$$ LANGUAGE plpgsql;


-- RPC: Get Sales Chart Data
-- Returns daily revenue and canceled amount for the period

DROP FUNCTION IF EXISTS public.get_sales_chart_data(INT);

CREATE OR REPLACE FUNCTION public.get_sales_chart_data(period_days INT DEFAULT 30)
RETURNS TABLE (
    date DATE,
    revenue NUMERIC,
    canceled NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - period_days,
            CURRENT_DATE,
            '1 day'::interval
        )::DATE AS day
    ),
    daily_sales AS (
        SELECT
            DATE(created_at) as sale_day,
            SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN status = 'cancelled' THEN total_amount ELSE 0 END) as total_canceled
        FROM public.sales
        WHERE created_at >= (CURRENT_DATE - period_days)
        GROUP BY 1
    )
    SELECT
        ds.day as date,
        COALESCE(s.total_revenue, 0) as revenue,
        COALESCE(s.total_canceled, 0) as canceled
    FROM date_series ds
    LEFT JOIN daily_sales s ON ds.day = s.sale_day
    ORDER BY ds.day;
END;
$$ LANGUAGE plpgsql;
