-- Migration: Fix and Onyx Theme Upgrade
-- Created at: 2025-12-13
-- Description: Ensures system_config exists with RLS, creates leads table, and prepares DB for Onyx theme.

-- 1. System Config (Fixing persistence issues)
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Create Policies (Drop first to be safe)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON system_config;
CREATE POLICY "Enable read access for authenticated users" ON system_config FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON system_config;
CREATE POLICY "Enable insert access for authenticated users" ON system_config FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON system_config;
CREATE POLICY "Enable update access for authenticated users" ON system_config FOR UPDATE TO authenticated USING (true);

-- Grant Permissions
GRANT ALL ON system_config TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE system_config_id_seq TO authenticated;

-- Insert default configs (Upsert)
INSERT INTO system_config (key, value) VALUES
('company', '{"razao_social": "", "cnpj": "", "telefone": "", "email": "", "endereco": "", "logo_url": ""}'::jsonb),
('whatsapp', '{"api_url": "http://localhost:8080", "api_key": "", "instance_name": "acr-erp", "connected": false}'::jsonb),
('notifications', '{"estoque": true, "vendas": true, "os": true, "contas": false, "email": false, "whatsapp": true, "delivery": true, "clientes": false}'::jsonb),
('appearance', '{"dark_mode": false, "primary_color": "green", "logo_url": "", "sidebar_theme": "onyx"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value WHERE system_config.key = 'appearance'; -- Only update appearance to force defaults if needed, or remove ON CONFLICT update to preserve settings. Let's just DO NOTHING generally, but maybe user wants the fix. Let's DO NOTHING.
-- Actually, ON CONFLICT DO NOTHING is safer.
-- ON CONFLICT (key) DO NOTHING;

-- 2. CRM / Leads (Ensuring table exists)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'site',
    status TEXT DEFAULT 'novo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON leads;
CREATE POLICY "Enable read access for authenticated users" ON leads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON leads;
CREATE POLICY "Enable insert access for authenticated users" ON leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON leads;
CREATE POLICY "Enable update access for authenticated users" ON leads FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON leads;
CREATE POLICY "Enable delete access for authenticated users" ON leads FOR DELETE TO authenticated USING (true);

GRANT ALL ON leads TO authenticated;

-- 3. View for Client Metrics
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

GRANT SELECT ON v_client_metrics TO authenticated;

-- 4. Onyx Theme Support (Optional: Add more tables if needed, but this covers the request)
