-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'site', -- site, whatsapp, indicacao, instagram, facebook, google, outro
    status TEXT DEFAULT 'novo', -- novo, contato, proposta, negociacao, convertido, perdido
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- Optional: link to a specific user/owner
);

-- Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON leads
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON leads
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON leads
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON leads
    FOR DELETE
    TO authenticated
    USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create View for Client Metrics (RFM)
CREATE OR REPLACE VIEW v_client_metrics AS
SELECT 
    c.id AS client_id,
    c.name,
    c.email,
    c.phone,
    COUNT(s.id) AS purchase_count,
    COALESCE(SUM(s.total_amount), 0) AS total_spent,
    MAX(s.created_at) AS last_purchase_date,
    EXTRACT(DAY FROM (NOW() - MAX(s.created_at))) AS days_since_last_purchase,
    CASE 
        WHEN COALESCE(SUM(s.total_amount), 0) >= 5000 THEN 'vip'
        WHEN COUNT(s.id) >= 3 AND EXTRACT(DAY FROM (NOW() - MAX(s.created_at))) < 60 THEN 'recorrente'
        WHEN EXTRACT(DAY FROM (NOW() - MAX(s.created_at))) > 90 THEN 'inativo'
        ELSE 'novo'
    END AS segment
FROM 
    clients c
LEFT JOIN 
    sales s ON c.id = s.client_id
GROUP BY 
    c.id, c.name, c.email, c.phone;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT ON v_client_metrics TO authenticated;
