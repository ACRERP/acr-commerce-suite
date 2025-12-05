-- Create payment installments tables
-- Migration: 20251205110000_create_payment_installments.sql

-- Create payment_plans table
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  total_amount DECIMAL(15,2) NOT NULL,
  number_of_installments INTEGER NOT NULL CHECK (number_of_installments > 0),
  installment_amount DECIMAL(15,2) NOT NULL,
  first_installment_date DATE NOT NULL,
  payment_frequency VARCHAR(20) NOT NULL CHECK (payment_frequency IN ('monthly', 'biweekly', 'weekly')),
  interest_rate DECIMAL(5,4) DEFAULT 0,
  total_interest DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create payment_installments table
CREATE TABLE IF NOT EXISTS payment_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_id UUID REFERENCES financial_transactions(id),
  late_fee DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payment_plan_id, installment_number)
);

-- Add payment_plan_id to invoices table if not exists
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_plan_id UUID REFERENCES payment_plans(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice_id ON payment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_tenant_id ON payment_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan_id ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_due_date ON payment_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_installments_status ON payment_installments(status);

-- Enable RLS
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_plans
CREATE POLICY "Users can view payment plans for their tenant" ON payment_plans
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert payment plans for their tenant" ON payment_plans
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update payment plans for their tenant" ON payment_plans
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete payment plans for their tenant" ON payment_plans
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- RLS Policies for payment_installments
CREATE POLICY "Users can view installments for their tenant" ON payment_installments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payment_plans 
      WHERE payment_plans.id = payment_installments.payment_plan_id 
      AND payment_plans.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

CREATE POLICY "Users can insert installments for their tenant" ON payment_installments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM payment_plans 
      WHERE payment_plans.id = payment_installments.payment_plan_id 
      AND payment_plans.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

CREATE POLICY "Users can update installments for their tenant" ON payment_installments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM payment_plans 
      WHERE payment_plans.id = payment_installments.payment_plan_id 
      AND payment_plans.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

CREATE POLICY "Users can delete installments for their tenant" ON payment_installments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM payment_plans 
      WHERE payment_plans.id = payment_installments.payment_plan_id 
      AND payment_plans.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_plans_updated_at 
  BEFORE UPDATE ON payment_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_installments_updated_at 
  BEFORE UPDATE ON payment_installments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate installment dates
CREATE OR REPLACE FUNCTION calculate_installment_dates(
  start_date DATE,
  num_installments INTEGER,
  frequency VARCHAR
)
RETURNS DATE[] AS $$
DECLARE
  dates DATE[];
  i INTEGER;
BEGIN
  dates := ARRAY[start_date];
  
  FOR i IN 2..num_installments LOOP
    CASE frequency
      WHEN 'weekly' THEN
        dates := array_append(dates, start_date + ((i - 1) * INTERVAL '1 week'));
      WHEN 'biweekly' THEN
        dates := array_append(dates, start_date + ((i - 1) * INTERVAL '2 weeks'));
      WHEN 'monthly' THEN
        dates := array_append(dates, start_date + ((i - 1) * INTERVAL '1 month'));
      ELSE
        RAISE EXCEPTION 'Invalid frequency: %', frequency;
    END CASE;
  END LOOP;
  
  RETURN dates;
END;
$$ LANGUAGE plpgsql;

-- Function to create payment plan with installments
CREATE OR REPLACE FUNCTION create_payment_plan_with_installments(
  p_invoice_id UUID,
  p_total_amount DECIMAL,
  p_num_installments INTEGER,
  p_first_date DATE,
  p_frequency VARCHAR DEFAULT 'monthly',
  p_interest_rate DECIMAL DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  plan_id UUID;
  installment_dates DATE[];
  monthly_interest DECIMAL;
  installment_amount DECIMAL;
  total_interest DECIMAL;
  i INTEGER;
BEGIN
  -- Calculate monthly interest
  monthly_interest := p_interest_rate / 100 / 12;
  
  -- Calculate installment amount using compound interest formula
  IF p_interest_rate > 0 THEN
    installment_amount := p_total_amount * (monthly_interest * POWER(1 + monthly_interest, p_num_installments)) / 
                        (POWER(1 + monthly_interest, p_num_installments) - 1);
    total_interest := (installment_amount * p_num_installments) - p_total_amount;
  ELSE
    installment_amount := p_total_amount / p_num_installments;
    total_interest := 0;
  END IF;
  
  -- Create payment plan
  INSERT INTO payment_plans (
    invoice_id,
    total_amount,
    number_of_installments,
    installment_amount,
    first_installment_date,
    payment_frequency,
    interest_rate,
    total_interest,
    notes,
    tenant_id
  ) VALUES (
    p_invoice_id,
    p_total_amount,
    p_num_installments,
    installment_amount,
    p_first_date,
    p_frequency,
    p_interest_rate,
    total_interest,
    p_notes,
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO plan_id;
  
  -- Calculate installment dates
  installment_dates := calculate_installment_dates(p_first_date, p_num_installments, p_frequency);
  
  -- Create installments
  FOR i IN 1..p_num_installments LOOP
    INSERT INTO payment_installments (
      payment_plan_id,
      installment_number,
      due_date,
      amount,
      interest_amount,
      total_amount,
      status
    ) VALUES (
      plan_id,
      i,
      installment_dates[i],
      installment_amount - (total_interest / p_num_installments),
      total_interest / p_num_installments,
      installment_amount,
      'pending'
    );
  END LOOP;
  
  -- Update invoice to reference payment plan
  UPDATE invoices 
  SET payment_plan_id = plan_id 
  WHERE id = p_invoice_id;
  
  RETURN plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data
INSERT INTO payment_plans (
  id,
  invoice_id,
  total_amount,
  number_of_installments,
  installment_amount,
  first_installment_date,
  payment_frequency,
  interest_rate,
  total_interest,
  status,
  notes,
  created_by,
  tenant_id
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM invoices LIMIT 1),
  1200.00,
  12,
  100.00,
  CURRENT_DATE,
  'monthly',
  0,
  0,
  'active',
  'Plano de pagamento mensal',
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
);
