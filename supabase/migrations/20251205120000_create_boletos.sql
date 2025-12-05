-- Create boletos tables
-- Migration: 20251205120000_create_boletos.sql

-- Create boletos table
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  our_number VARCHAR(20) NOT NULL UNIQUE,
  document_number VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired', 'overdue')),
  payer_name VARCHAR(100) NOT NULL,
  payer_cpf_cnpj VARCHAR(20) NOT NULL,
  payer_address TEXT,
  payer_city VARCHAR(50),
  payer_state VARCHAR(2),
  payer_zip_code VARCHAR(10),
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_date DATE,
  interest_amount DECIMAL(15,2) DEFAULT 0,
  fine_amount DECIMAL(15,2) DEFAULT 0,
  instructions TEXT,
  bank_code VARCHAR(3) NOT NULL,
  bank_agency VARCHAR(10),
  bank_account VARCHAR(20),
  wallet VARCHAR(5),
  barcode VARCHAR(44),
  digitable_line VARCHAR(47),
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create boleto_events table for tracking
CREATE TABLE IF NOT EXISTS boleto_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id UUID NOT NULL REFERENCES boletos(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('created', 'paid', 'cancelled', 'expired', 'reminded', 'email_sent', 'sms_sent')),
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boletos_invoice_id ON boletos(invoice_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_boletos_due_date ON boletos(due_date);
CREATE INDEX IF NOT EXISTS idx_boletos_our_number ON boletos(our_number);
CREATE INDEX IF NOT EXISTS idx_boletos_tenant_id ON boletos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boleto_events_boleto_id ON boleto_events(boleto_id);
CREATE INDEX IF NOT EXISTS idx_boleto_events_date ON boleto_events(event_date);

-- Enable RLS
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boleto_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boletos
CREATE POLICY "Users can view boletos for their tenant" ON boletos
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert boletos for their tenant" ON boletos
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update boletos for their tenant" ON boletos
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete boletos for their tenant" ON boletos
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- RLS Policies for boleto_events
CREATE POLICY "Users can view events for their tenant" ON boleto_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boletos 
      WHERE boletos.id = boleto_events.boleto_id 
      AND boletos.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

CREATE POLICY "Users can insert events for their tenant" ON boleto_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM boletos 
      WHERE boletos.id = boleto_events.boleto_id 
      AND boletos.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_boletos_updated_at 
  BEFORE UPDATE ON boletos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate our number
CREATE OR REPLACE FUNCTION generate_our_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  LOOP
    new_number := LPAD((random() * 1000000000)::int::text, 9, '0');
    IF NOT EXISTS (SELECT 1 FROM boletos WHERE our_number = new_number) THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate barcode (simplified version for demonstration)
CREATE OR REPLACE FUNCTION calculate_boleto_barcode(
  bank_code TEXT,
  due_date DATE,
  amount DECIMAL,
  our_number TEXT
)
RETURNS TEXT AS $$
DECLARE
  barcode TEXT;
  amount_formatted TEXT;
  due_date_formatted TEXT;
BEGIN
  -- Format amount (remove decimal point and pad to 10 digits)
  amount_formatted := LPAD(REPLACE((amount * 100)::text, '.', ''), 10, '0');
  
  -- Format due date (DDMMAA)
  due_date_formatted := TO_CHAR(due_date, 'DDMMYY');
  
  -- Simplified barcode generation (real implementation would use bank-specific rules)
  barcode := bank_code || '9' || due_date_formatted || amount_formatted || our_number || '0';
  
  -- Calculate check digit (simplified)
  barcode := barcode || MOD(
    (
      SELECT SUM(
        (SUBSTRING(barcode, i, 1)::int * 
        CASE WHEN MOD(i, 2) = 0 THEN 1 ELSE 2 END
      )
      FROM generate_series(1, 43) i
    ), 10
  )::text;
  
  RETURN barcode;
END;
$$ LANGUAGE plpgsql;

-- Function to create boleto
CREATE OR REPLACE FUNCTION create_boleto(
  p_invoice_id UUID,
  p_amount DECIMAL,
  p_due_date DATE,
  p_payer_name VARCHAR,
  p_payer_cpf_cnpj VARCHAR,
  p_payer_address TEXT DEFAULT NULL,
  p_payer_city VARCHAR DEFAULT NULL,
  p_payer_state VARCHAR DEFAULT NULL,
  p_payer_zip_code VARCHAR DEFAULT NULL,
  p_instructions TEXT DEFAULT NULL,
  p_bank_code VARCHAR DEFAULT '001',
  p_discount_amount DECIMAL DEFAULT 0,
  p_discount_date DATE DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  boleto_id UUID;
  our_number TEXT;
  document_number TEXT;
  barcode TEXT;
  digitable_line TEXT;
BEGIN
  -- Generate our number
  our_number := generate_our_number();
  
  -- Generate document number
  document_number := 'BOL' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || our_number;
  
  -- Calculate barcode
  barcode := calculate_boleto_barcode(p_bank_code, p_due_date, p_amount, our_number);
  
  -- Generate digitable line (simplified)
  digitable_line := SUBSTRING(barcode, 1, 5) || '.' || SUBSTRING(barcode, 6, 10) || ' ' ||
                   SUBSTRING(barcode, 11, 5) || '.' || SUBSTRING(barcode, 16, 10) || ' ' ||
                   SUBSTRING(barcode, 21, 5) || '.' || SUBSTRING(barcode, 26, 10) || ' ' ||
                   SUBSTRING(barcode, 32, 15) || ' ' || SUBSTRING(barcode, 44, 1);
  
  -- Create boleto
  INSERT INTO boletos (
    invoice_id,
    our_number,
    document_number,
    amount,
    due_date,
    payer_name,
    payer_cpf_cnpj,
    payer_address,
    payer_city,
    payer_state,
    payer_zip_code,
    discount_amount,
    discount_date,
    instructions,
    bank_code,
    barcode,
    digitable_line,
    tenant_id
  ) VALUES (
    p_invoice_id,
    our_number,
    document_number,
    p_amount,
    p_due_date,
    p_payer_name,
    p_payer_cpf_cnpj,
    p_payer_address,
    p_payer_city,
    p_payer_state,
    p_payer_zip_code,
    p_discount_amount,
    p_discount_date,
    p_instructions,
    p_bank_code,
    barcode,
    digitable_line,
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO boleto_id;
  
  -- Create event
  INSERT INTO boleto_events (boleto_id, event_type, description, created_by)
  VALUES (boleto_id, 'created', 'Boleto criado', auth.uid());
  
  RETURN boleto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update boleto status
CREATE OR REPLACE FUNCTION update_boleto_status(
  p_boleto_id UUID,
  p_status VARCHAR,
  p_payment_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update boleto
  UPDATE boletos 
  SET 
    status = p_status,
    payment_date = p_payment_date,
    updated_at = NOW()
  WHERE id = p_boleto_id;
  
  -- Create event
  INSERT INTO boleto_events (boleto_id, event_type, description, created_by)
  VALUES (p_boleto_id, p_status, COALESCE(p_description, 'Status atualizado para ' || p_status), auth.uid());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data
INSERT INTO boletos (
  id,
  invoice_id,
  our_number,
  document_number,
  amount,
  due_date,
  payer_name,
  payer_cpf_cnpj,
  payer_address,
  payer_city,
  payer_state,
  payer_zip_code,
  instructions,
  bank_code,
  barcode,
  digitable_line,
  created_by,
  tenant_id
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM invoices LIMIT 1),
  '123456789',
  'BOL20251205123456789',
  1500.00,
  CURRENT_DATE + INTERVAL '15 days',
  'João Silva',
  '123.456.789-00',
  'Rua das Flores, 123',
  'São Paulo',
  'SP',
  '01234-567',
  'Pagável até o vencimento. Após vencimento cobrar multa de 2%.',
  '001',
  '0019123456789012345678901234567890123456789012345678901',
  '00191.23456 78901.234567 89012.345678 90123.456789 0',
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
);
