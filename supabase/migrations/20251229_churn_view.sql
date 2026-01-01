-- RPC: Get Churn Risks
-- Returns clients who haven't purchased in the last X days but have purchased before.

CREATE OR REPLACE FUNCTION public.get_churn_risks(days_inactive INT DEFAULT 90)
RETURNS TABLE (
    client_id UUID,
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT,
    last_purchase_date DATE,
    days_since_last_purchase INT,
    total_spent NUMERIC,
    purchase_count INT
) AS $$
BEGIN
    RETURN QUERY
    WITH last_purchases AS (
        SELECT 
            client_id,
            MAX(created_at) as last_purchase,
            COUNT(id) as count_purchases,
            SUM(total_amount) as total_spent
        FROM public.sales
        WHERE status != 'cancelled'
          AND client_id IS NOT NULL
        GROUP BY client_id
    )
    SELECT 
        c.id as client_id,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        lp.last_purchase::DATE as last_purchase_date,
        (CURRENT_DATE - lp.last_purchase::DATE)::INT as days_since_last_purchase,
        lp.total_spent,
        lp.count_purchases::INT
    FROM last_purchases lp
    JOIN public.clients c ON lp.client_id = c.id
    WHERE lp.last_purchase < (CURRENT_DATE - days_inactive);
END;
$$ LANGUAGE plpgsql;
