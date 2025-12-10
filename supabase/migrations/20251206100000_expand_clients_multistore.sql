-- Migration: Expand Clients Table for Complete ERP
-- Adds all required fields from the client module specification
-- This migration preserves existing data while adding new columns

-- ===============================================
-- 1. ADD NEW COLUMNS TO CLIENTS TABLE
-- ===============================================

-- Person type (PF = Pessoa Física, PJ = Pessoa Jurídica)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS person_type VARCHAR(2) DEFAULT 'PF';

-- Additional identification
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ie VARCHAR(20); -- Inscrição Estadual for PJ
ALTER TABLE clients ADD COLUMN IF NOT EXISTS im VARCHAR(20); -- Inscrição Municipal for PJ
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Contact information
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Expanded address fields (for delivery integration)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS street_number VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complement VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- Financial control
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_used DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_available DECIMAL(12,2) GENERATED ALWAYS AS (credit_limit - credit_used) STORED;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS financial_status VARCHAR(20) DEFAULT 'em_dia'; -- em_dia, em_atraso, bloqueado
ALTER TABLE clients ADD COLUMN IF NOT EXISTS allow_fiado BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS days_overdue INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_purchase_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS total_purchases_count INTEGER DEFAULT 0;

-- Client status and classification
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo'; -- ativo, inativo, bloqueado
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_since DATE DEFAULT CURRENT_DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vip BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Marketing and CRM fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp'; -- whatsapp, email, phone, sms
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags TEXT[]; -- Array of tags for segmentation
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(50); -- How they found us: indicacao, google, instagram, etc.

-- Multi-store support
ALTER TABLE clients ADD COLUMN IF NOT EXISTS store_id UUID; -- Links to stores table

-- ===============================================
-- 2. CREATE STORES TABLE (MULTI-LOJA SUPPORT)
-- ===============================================

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE, -- LOJA1, LOJA2
  name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200), -- Nome fantasia
  cnpj VARCHAR(18),
  ie VARCHAR(20),
  im VARCHAR(20),
  
  -- Address
  cep VARCHAR(10),
  street VARCHAR(200),
  street_number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  
  -- Contact
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  
  -- Fiscal settings
  fiscal_series_nfce INTEGER DEFAULT 1,
  fiscal_series_nfe INTEGER DEFAULT 1,
  fiscal_environment VARCHAR(20) DEFAULT 'homologacao', -- homologacao, producao
  
  -- Business hours
  opening_hours JSONB, -- {"monday": {"open": "08:00", "close": "18:00"}, ...}
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false, -- Main store/headquarters
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 3. CREATE COMPANY SETTINGS TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company identification
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  ie VARCHAR(20),
  im VARCHAR(20),
  
  -- Address
  cep VARCHAR(10),
  street VARCHAR(200),
  street_number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  
  -- Contact
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Social media (for marketing/CRM)
  instagram VARCHAR(100),
  facebook VARCHAR(100),
  tiktok VARCHAR(100),
  youtube VARCHAR(100),
  
  -- Fiscal settings
  tax_regime VARCHAR(30) DEFAULT 'simples_nacional', -- simples_nacional, lucro_presumido, lucro_real
  crt INTEGER DEFAULT 1, -- Código de Regime Tributário
  digital_certificate_password VARCHAR(255),
  digital_certificate_expiry DATE,
  
  -- Logo and branding
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(10) DEFAULT '#3B82F6',
  secondary_color VARCHAR(10) DEFAULT '#1E40AF',
  
  -- System settings
  default_currency VARCHAR(3) DEFAULT 'BRL',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON clients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_financial_status ON clients(financial_status);
CREATE INDEX IF NOT EXISTS idx_clients_store_id ON clients(store_id);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);

-- ===============================================
-- 5. FUNCTION TO AUTO-UPDATE CLIENT FINANCIAL STATUS
-- ===============================================

CREATE OR REPLACE FUNCTION update_client_financial_status()
RETURNS TRIGGER AS $$
DECLARE
  overdue_count INTEGER;
  overdue_days INTEGER;
BEGIN
  -- Count overdue installments for this client
  SELECT 
    COUNT(*),
    COALESCE(MAX(CURRENT_DATE - due_date), 0)
  INTO overdue_count, overdue_days
  FROM payment_installments
  WHERE client_id = NEW.client_id 
    AND status = 'pending'
    AND due_date < CURRENT_DATE;
  
  -- Update client status based on overdue count
  IF overdue_count > 0 THEN
    UPDATE clients 
    SET 
      financial_status = CASE 
        WHEN overdue_days > 60 THEN 'bloqueado'
        ELSE 'em_atraso'
      END,
      days_overdue = overdue_days,
      status = CASE 
        WHEN overdue_days > 90 THEN 'bloqueado'
        ELSE status
      END
    WHERE id = NEW.client_id;
  ELSE
    UPDATE clients 
    SET 
      financial_status = 'em_dia',
      days_overdue = 0
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 6. FUNCTION TO UPDATE CLIENT STATS AFTER SALE
-- ===============================================

CREATE OR REPLACE FUNCTION update_client_purchase_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    UPDATE clients 
    SET 
      last_purchase_date = CURRENT_DATE,
      total_purchases = COALESCE(total_purchases, 0) + NEW.total_amount,
      total_purchases_count = COALESCE(total_purchases_count, 0) + 1
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase stats
DROP TRIGGER IF EXISTS on_sale_update_client_stats ON sales;
CREATE TRIGGER on_sale_update_client_stats
  AFTER INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.client_id IS NOT NULL)
  EXECUTE FUNCTION update_client_purchase_stats();

-- ===============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ===============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view stores
CREATE POLICY "Authenticated users can view stores" ON stores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage stores
CREATE POLICY "Admins can manage stores" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow authenticated users to view company settings
CREATE POLICY "Authenticated users can view company settings" ON company_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage company settings
CREATE POLICY "Admins can manage company settings" ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ===============================================
-- 8. INSERT DEFAULT DATA
-- ===============================================

-- Insert default store (can be updated later)
INSERT INTO stores (code, name, is_main, is_active)
VALUES ('LOJA1', 'Loja Principal', true, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO stores (code, name, is_main, is_active)
VALUES ('LOJA2', 'Loja 2', false, true)
ON CONFLICT (code) DO NOTHING;

-- ===============================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON TABLE stores IS 'Multi-store support - cada loja física do negócio';
COMMENT ON TABLE company_settings IS 'Configurações gerais da empresa, dados fiscais e branding';
COMMENT ON COLUMN clients.person_type IS 'PF = Pessoa Física, PJ = Pessoa Jurídica';
COMMENT ON COLUMN clients.financial_status IS 'em_dia = normal, em_atraso = has overdue, bloqueado = blocked';
COMMENT ON COLUMN clients.credit_available IS 'Auto-calculated: credit_limit - credit_used';
COMMENT ON COLUMN clients.tags IS 'Array de tags para segmentação: VIP, PROBLEMA, etc';
