-- Advanced Sales Features Migration
-- Adds split payments, customer credit, commissions tracking
-- This migration only ADDS new features, preserves all existing data

-- Split Payments Table
CREATE TABLE IF NOT EXISTS sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  payment_method VARCHAR(50) NOT NULL, -- 'pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'fiado'
  amount DECIMAL(10,2) NOT NULL,
  installment_count INTEGER DEFAULT 1, -- for credit card installments
  card_brand VARCHAR(50), -- visa, mastercard, elo, etc.
  card_last_four VARCHAR(4),
  authorization_code VARCHAR(100),
  nsu VARCHAR(50),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'declined', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Customer Credit Limits
CREATE TABLE IF NOT EXISTS customer_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  credit_limit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  used_credit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  available_credit DECIMAL(10,2) GENERATED ALWAYS AS (credit_limit - used_credit) STORED,
  due_date DATE, -- payment due date for credit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(client_id)
);

-- Sales Commissions
CREATE TABLE IF NOT EXISTS sales_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  commission_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed'
  commission_value DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Commission Rules
CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  commission_type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed'
  commission_value DECIMAL(10,2) NOT NULL,
  min_sale_amount DECIMAL(10,2) DEFAULT 0.00,
  max_sale_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Enhanced Receipt Templates
CREATE TABLE IF NOT EXISTS receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'sale', 'service', 'quote'
  header_content TEXT,
  footer_content TEXT,
  css_styles TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Sales Notes/Comments
CREATE TABLE IF NOT EXISTS sale_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'payment', 'delivery', 'return'
  is_internal BOOLEAN DEFAULT false, -- visible to customer or not
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Add payment_status to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - total_paid) STORED;

-- Enable RLS
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tenant sale payments" ON sale_payments
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant sale payments" ON sale_payments
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant customer credit" ON customer_credit
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant customer credit" ON customer_credit
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant commissions" ON sales_commissions
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant commissions" ON sales_commissions
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant commission rules" ON commission_rules
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant commission rules" ON commission_rules
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant receipt templates" ON receipt_templates
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant receipt templates" ON receipt_templates
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant sale notes" ON sale_notes
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant sale notes" ON sale_notes
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_tenant ON sale_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_client ON customer_credit(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_credit_tenant ON customer_credit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_sale ON sales_commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_user ON sales_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_tenant ON sales_commissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_user ON commission_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipt_templates_tenant ON receipt_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_notes_sale ON sale_notes(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_notes_tenant ON sale_notes(tenant_id);

-- Function to calculate and create commissions
CREATE OR REPLACE FUNCTION calculate_sale_commission(sale_id_param INTEGER, user_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
  commission_amount DECIMAL(10,2) := 0;
  sale_total DECIMAL(10,2);
  commission_rule RECORD;
BEGIN
  -- Get sale total
  SELECT total_amount INTO sale_total
  FROM sales
  WHERE id = sale_id_param;
  
  -- Find applicable commission rule
  SELECT * INTO commission_rule
  FROM commission_rules
  WHERE user_id = user_id_param
    AND is_active = true
    AND (min_sale_amount IS NULL OR sale_total >= min_sale_amount)
    AND (max_sale_amount IS NULL OR sale_total <= max_sale_amount)
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate commission
  IF FOUND THEN
    IF commission_rule.commission_type = 'percentage' THEN
      commission_amount := sale_total * (commission_rule.commission_value / 100);
    ELSE
      commission_amount := commission_rule.commission_value;
    END IF;
    
    -- Create commission record
    INSERT INTO sales_commissions (
      sale_id, user_id, commission_type, commission_value, 
      commission_amount, tenant_id
    ) VALUES (
      sale_id_param, user_id_param, commission_rule.commission_type,
      commission_rule.commission_value, commission_amount,
      current_setting('app.current_tenant')::uuid
    );
  END IF;
  
  RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer credit
CREATE OR REPLACE FUNCTION update_customer_credit(client_id_param INTEGER, amount_param DECIMAL, operation_param VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Insert or update customer credit
  INSERT INTO customer_credit (client_id, credit_limit, used_credit, tenant_id)
  VALUES (client_id_param, 1000.00, 0.00, current_setting('app.current_tenant')::uuid)
  ON CONFLICT (client_id) DO NOTHING;
  
  -- Update used credit based on operation
  IF operation_param = 'add' THEN
    UPDATE customer_credit
    SET used_credit = used_credit + amount_param,
        updated_at = NOW()
    WHERE client_id = client_id_param;
  ELSIF operation_param = 'subtract' THEN
    UPDATE customer_credit
    SET used_credit = GREATEST(0, used_credit - amount_param),
        updated_at = NOW()
    WHERE client_id = client_id_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to process split payment
CREATE OR REPLACE FUNCTION process_split_payment(
  sale_id_param INTEGER,
  payments_param JSONB -- array of payment objects
)
RETURNS BOOLEAN AS $$
DECLARE
  payment_record JSONB;
  total_paid_amount DECIMAL(10,2) := 0;
  payment_status VARCHAR(20) := 'pending';
BEGIN
  -- Process each payment
  FOR payment_record IN SELECT * FROM jsonb_array_elements(payments_param)
  LOOP
    INSERT INTO sale_payments (
      sale_id, payment_method, amount, installment_count,
      card_brand, card_last_four, authorization_code, tenant_id
    ) VALUES (
      sale_id_param,
      payment_record->>'payment_method',
      (payment_record->>'amount')::DECIMAL,
      COALESCE((payment_record->>'installment_count')::INTEGER, 1),
      payment_record->>'card_brand',
      payment_record->>'card_last_four',
      payment_record->>'authorization_code',
      current_setting('app.current_tenant')::uuid
    );
    
    total_paid_amount := total_paid_amount + (payment_record->>'amount')::DECIMAL;
  END LOOP;
  
  -- Update sale payment status
  UPDATE sales
  SET total_paid = total_paid_amount,
      payment_status = CASE 
        WHEN total_paid_amount >= total_amount THEN 'paid'
        WHEN total_paid_amount > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = NOW()
  WHERE id = sale_id_param;
  
  -- Update customer credit if fiado payment
  IF EXISTS(
    SELECT 1 FROM jsonb_array_elements(payments_param) 
    WHERE value->>'payment_method' = 'fiado'
  ) THEN
    DECLARE
      fiado_amount DECIMAL(10,2);
      client_id INTEGER;
    BEGIN
      SELECT 
        (value->>'amount')::DECIMAL,
        (SELECT client_id FROM sales WHERE id = sale_id_param)
      INTO fiado_amount, client_id
      FROM jsonb_array_elements(payments_param)
      WHERE value->>'payment_method' = 'fiado'
      LIMIT 1;
      
      PERFORM update_customer_credit(client_id, fiado_amount, 'add');
    END;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert default receipt template
INSERT INTO receipt_templates (
  name, template_type, header_content, footer_content, is_default, tenant_id
) VALUES (
  'Padrão Venda',
  'sale',
  '<div style="text-align: center; margin-bottom: 20px;">
    <h2>ACR COMMERCE</h2>
    <p>Rua Principal, 123 - Centro</p>
    <p>CNPJ: 12.345.678/0001-90</p>
  </div>',
  '<div style="margin-top: 20px; text-align: center;">
    <p>Obrigado pela preferência!</p>
    <p>Volte sempre</p>
  </div>',
  true,
  current_setting('app.current_tenant')::uuid
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE sale_payments IS 'Split payment details for sales';
COMMENT ON TABLE customer_credit IS 'Customer credit limits and usage tracking';
COMMENT ON TABLE sales_commissions IS 'Sales commissions tracking';
COMMENT ON TABLE commission_rules IS 'Commission calculation rules';
COMMENT ON TABLE receipt_templates IS 'Customizable receipt templates';
COMMENT ON TABLE sale_notes IS 'Notes and comments for sales';
