-- ============================================
-- ACR Commerce Suite - Schema Update Script
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This script safely adds new tables and columns
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. STORES TABLE (Multi-loja)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  trade_name VARCHAR(200),
  cnpj VARCHAR(18),
  ie VARCHAR(20),
  im VARCHAR(20),
  cep VARCHAR(10),
  street VARCHAR(200),
  street_number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  fiscal_series_nfce INTEGER DEFAULT 1,
  fiscal_series_nfe INTEGER DEFAULT 1,
  fiscal_environment VARCHAR(20) DEFAULT 'homologacao',
  opening_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default stores
INSERT INTO stores (code, name, is_main, is_active)
VALUES ('LOJA1', 'Loja Principal', true, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO stores (code, name, is_main, is_active)
VALUES ('LOJA2', 'Loja 2', false, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. COMPANY SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj VARCHAR(18) NOT NULL,
  ie VARCHAR(20),
  im VARCHAR(20),
  cep VARCHAR(10),
  street VARCHAR(200),
  street_number VARCHAR(20),
  complement VARCHAR(100),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(2),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  instagram VARCHAR(100),
  facebook VARCHAR(100),
  tiktok VARCHAR(100),
  youtube VARCHAR(100),
  tax_regime VARCHAR(30) DEFAULT 'simples_nacional',
  crt INTEGER DEFAULT 1,
  digital_certificate_password VARCHAR(255),
  digital_certificate_expiry DATE,
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(10) DEFAULT '#3B82F6',
  secondary_color VARCHAR(10) DEFAULT '#1E40AF',
  default_currency VARCHAR(3) DEFAULT 'BRL',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. EXPAND CLIENTS TABLE
-- ============================================
DO $$ 
BEGIN
  -- Person type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'person_type') THEN
    ALTER TABLE clients ADD COLUMN person_type VARCHAR(2) DEFAULT 'PF';
  END IF;
  
  -- Additional identification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'rg') THEN
    ALTER TABLE clients ADD COLUMN rg VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'ie') THEN
    ALTER TABLE clients ADD COLUMN ie VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'im') THEN
    ALTER TABLE clients ADD COLUMN im VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'birth_date') THEN
    ALTER TABLE clients ADD COLUMN birth_date DATE;
  END IF;
  
  -- Contact
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone_secondary') THEN
    ALTER TABLE clients ADD COLUMN phone_secondary VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'whatsapp') THEN
    ALTER TABLE clients ADD COLUMN whatsapp VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
    ALTER TABLE clients ADD COLUMN email VARCHAR(255);
  END IF;
  
  -- Address fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'cep') THEN
    ALTER TABLE clients ADD COLUMN cep VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'street') THEN
    ALTER TABLE clients ADD COLUMN street VARCHAR(200);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'street_number') THEN
    ALTER TABLE clients ADD COLUMN street_number VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'complement') THEN
    ALTER TABLE clients ADD COLUMN complement VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'neighborhood') THEN
    ALTER TABLE clients ADD COLUMN neighborhood VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'city') THEN
    ALTER TABLE clients ADD COLUMN city VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'state') THEN
    ALTER TABLE clients ADD COLUMN state VARCHAR(2);
  END IF;
  
  -- Financial
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'credit_limit') THEN
    ALTER TABLE clients ADD COLUMN credit_limit DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'credit_used') THEN
    ALTER TABLE clients ADD COLUMN credit_used DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'financial_status') THEN
    ALTER TABLE clients ADD COLUMN financial_status VARCHAR(20) DEFAULT 'em_dia';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'allow_fiado') THEN
    ALTER TABLE clients ADD COLUMN allow_fiado BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'days_overdue') THEN
    ALTER TABLE clients ADD COLUMN days_overdue INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'last_purchase_date') THEN
    ALTER TABLE clients ADD COLUMN last_purchase_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'total_purchases') THEN
    ALTER TABLE clients ADD COLUMN total_purchases DECIMAL(12,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'total_purchases_count') THEN
    ALTER TABLE clients ADD COLUMN total_purchases_count INTEGER DEFAULT 0;
  END IF;
  
  -- Status and classification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
    ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'client_since') THEN
    ALTER TABLE clients ADD COLUMN client_since DATE DEFAULT CURRENT_DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'vip') THEN
    ALTER TABLE clients ADD COLUMN vip BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'notes') THEN
    ALTER TABLE clients ADD COLUMN notes TEXT;
  END IF;
  
  -- Marketing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'marketing_consent') THEN
    ALTER TABLE clients ADD COLUMN marketing_consent BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'preferred_contact_method') THEN
    ALTER TABLE clients ADD COLUMN preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tags') THEN
    ALTER TABLE clients ADD COLUMN tags TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'source') THEN
    ALTER TABLE clients ADD COLUMN source VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'store_id') THEN
    ALTER TABLE clients ADD COLUMN store_id UUID;
  END IF;
END $$;

-- ============================================
-- 4. DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  vehicle_type VARCHAR(50) DEFAULT 'moto',
  vehicle_brand VARCHAR(50),
  vehicle_model VARCHAR(50),
  vehicle_plate VARCHAR(10),
  vehicle_color VARCHAR(30),
  contract_type VARCHAR(20) DEFAULT 'fixo',
  commission_type VARCHAR(20) DEFAULT 'fixed',
  commission_value DECIMAL(10,2) DEFAULT 0,
  salary DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'disponivel',
  is_active BOOLEAN DEFAULT true,
  total_deliveries INTEGER DEFAULT 0,
  total_deliveries_month INTEGER DEFAULT 0,
  total_earnings_month DECIMAL(10,2) DEFAULT 0,
  average_delivery_time INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  cep VARCHAR(10),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. DELIVERY ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'aguardando_preparo',
  address_type VARCHAR(20) DEFAULT 'client',
  delivery_cep VARCHAR(10),
  delivery_street VARCHAR(200),
  delivery_number VARCHAR(20),
  delivery_complement VARCHAR(100),
  delivery_neighborhood VARCHAR(100),
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(2),
  delivery_reference TEXT,
  freight_value DECIMAL(10,2) DEFAULT 0,
  priority VARCHAR(10) DEFAULT 'normal',
  estimated_time INTEGER,
  actual_time INTEGER,
  distance_km DECIMAL(10,2),
  payment_method VARCHAR(30),
  payment_received DECIMAL(10,2) DEFAULT 0,
  change_needed DECIMAL(10,2) DEFAULT 0,
  payment_collected BOOLEAN DEFAULT false,
  preparation_notes TEXT,
  delivery_notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  dispatched_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by UUID,
  driver_commission DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. DELIVERY STATUS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_financial_status ON clients(financial_status);
CREATE INDEX IF NOT EXISTS idx_clients_city ON clients(city);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created ON delivery_orders(created_at DESC);

-- ============================================
-- 8. ENABLE RLS
-- ============================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view stores" ON stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can view company settings" ON company_settings;
DROP POLICY IF EXISTS "Admins can manage company settings" ON company_settings;
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can view delivery orders" ON delivery_orders;
DROP POLICY IF EXISTS "PDV users can create delivery orders" ON delivery_orders;
DROP POLICY IF EXISTS "Authorized users can update delivery orders" ON delivery_orders;
DROP POLICY IF EXISTS "Authenticated users can view delivery history" ON delivery_status_history;

-- Create policies
CREATE POLICY "Authenticated users can view stores" ON stores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view company settings" ON company_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view drivers" ON drivers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view delivery orders" ON delivery_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "PDV users can create delivery orders" ON delivery_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can update delivery orders" ON delivery_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view delivery history" ON delivery_status_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow ALL operations for authenticated users on key tables
DROP POLICY IF EXISTS "Full access for authenticated on stores" ON stores;
DROP POLICY IF EXISTS "Full access for authenticated on company_settings" ON company_settings;
DROP POLICY IF EXISTS "Full access for authenticated on drivers" ON drivers;
DROP POLICY IF EXISTS "Full access for authenticated on delivery_orders" ON delivery_orders;

CREATE POLICY "Full access for authenticated on stores" ON stores
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for authenticated on company_settings" ON company_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for authenticated on drivers" ON drivers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Full access for authenticated on delivery_orders" ON delivery_orders
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- DONE! Schema updated successfully.
-- ============================================
SELECT 'Schema update complete!' as result;
