-- Create Accounts Payable and Receivable tables for Phase 1
-- This complements the existing financial_transactions table with specific AP/AR functionality

-- Create suppliers table first (referenced by accounts_payable)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  document_number VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  cep VARCHAR(10),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create accounts_payable table (Contas a Pagar)
CREATE TABLE IF NOT EXISTS public.accounts_payable (
  id BIGSERIAL PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id),
  description TEXT NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  installment_number INT DEFAULT 1,
  total_installments INT DEFAULT 1,
  parent_id BIGINT REFERENCES public.accounts_payable(id),
  reference_number VARCHAR(100),
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  paid_by UUID REFERENCES auth.users(id)
);

-- Create accounts_receivable table (Contas a Receber)
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES public.clients(id),
  sale_id BIGINT REFERENCES public.sales(id),
  origin VARCHAR(50) DEFAULT 'sale' CHECK (origin IN ('sale', 'fiado', 'service_order', 'manual')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  installment_number INT DEFAULT 1,
  total_installments INT DEFAULT 1,
  due_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'cancelled')),
  days_overdue INT DEFAULT 0,
  interest_amount DECIMAL(10,2) DEFAULT 0,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id)
);

-- Create payment_history table for tracking partial payments
CREATE TABLE IF NOT EXISTS public.payment_history (
  id BIGSERIAL PRIMARY KEY,
  receivable_id BIGINT REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  payable_id BIGINT REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON public.accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON public.accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_supplier ON public.accounts_payable(supplier_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON public.accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON public.accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client ON public.accounts_receivable(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_sale ON public.accounts_receivable(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_receivable ON public.payment_history(receivable_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_payable ON public.payment_history(payable_id);

-- Function to update overdue status
CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS void AS $$
BEGIN
  -- Update accounts receivable
  UPDATE public.accounts_receivable
  SET 
    status = 'overdue',
    days_overdue = EXTRACT(DAY FROM (CURRENT_DATE - due_date))::INT
  WHERE status = 'open' 
    AND due_date < CURRENT_DATE;
  
  -- Update accounts payable
  UPDATE public.accounts_payable
  SET status = 'overdue'
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate interest on overdue receivables
CREATE OR REPLACE FUNCTION calculate_interest_on_receivable(receivable_id_param BIGINT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  receivable_record RECORD;
  calculated_interest DECIMAL(10,2);
BEGIN
  SELECT * INTO receivable_record
  FROM public.accounts_receivable
  WHERE id = receivable_id_param;
  
  IF receivable_record.status = 'overdue' AND receivable_record.interest_rate > 0 THEN
    -- Simple interest calculation: amount * rate * days / 30
    calculated_interest := receivable_record.amount * 
                          (receivable_record.interest_rate / 100) * 
                          (receivable_record.days_overdue / 30.0);
    
    UPDATE public.accounts_receivable
    SET interest_amount = calculated_interest
    WHERE id = receivable_id_param;
    
    RETURN calculated_interest;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to create installments for payable
CREATE OR REPLACE FUNCTION create_payable_installments(
  p_supplier_id UUID,
  p_description TEXT,
  p_category VARCHAR(100),
  p_total_amount DECIMAL(10,2),
  p_first_due_date DATE,
  p_installments INT,
  p_payment_method VARCHAR(50),
  p_notes TEXT
)
RETURNS BIGINT AS $$
DECLARE
  parent_id BIGINT;
  installment_amount DECIMAL(10,2);
  current_due_date DATE;
  i INT;
BEGIN
  installment_amount := p_total_amount / p_installments;
  current_due_date := p_first_due_date;
  
  -- Create parent record
  INSERT INTO public.accounts_payable (
    supplier_id, description, category, amount, due_date, 
    payment_method, installment_number, total_installments, notes
  ) VALUES (
    p_supplier_id, p_description, p_category, installment_amount, current_due_date,
    p_payment_method, 1, p_installments, p_notes
  ) RETURNING id INTO parent_id;
  
  -- Create child installments
  FOR i IN 2..p_installments LOOP
    current_due_date := current_due_date + INTERVAL '1 month';
    
    INSERT INTO public.accounts_payable (
      supplier_id, description, category, amount, due_date,
      payment_method, installment_number, total_installments, parent_id, notes
    ) VALUES (
      p_supplier_id, p_description || ' - Parcela ' || i || '/' || p_installments, 
      p_category, installment_amount, current_due_date,
      p_payment_method, i, p_installments, parent_id, p_notes
    );
  END LOOP;
  
  RETURN parent_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accounts_payable_updated_at
  BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

CREATE TRIGGER trigger_accounts_receivable_updated_at
  BEFORE UPDATE ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

-- Enable RLS
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view accounts payable"
  ON public.accounts_payable FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create accounts payable"
  ON public.accounts_payable FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update accounts payable"
  ON public.accounts_payable FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view accounts receivable"
  ON public.accounts_receivable FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create accounts receivable"
  ON public.accounts_receivable FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update accounts receivable"
  ON public.accounts_receivable FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view payment history"
  ON public.payment_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create payment history"
  ON public.payment_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create views for reporting
CREATE OR REPLACE VIEW accounts_payable_summary AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_count,
  SUM(CASE WHEN due_date < CURRENT_DATE THEN amount ELSE 0 END) as overdue_amount
FROM public.accounts_payable
WHERE status != 'cancelled'
GROUP BY status;

CREATE OR REPLACE VIEW accounts_receivable_summary AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount + interest_amount) as total_amount,
  SUM(interest_amount) as total_interest,
  AVG(days_overdue) as avg_days_overdue
FROM public.accounts_receivable
WHERE status != 'cancelled'
GROUP BY status;

-- Grant permissions
GRANT SELECT ON accounts_payable_summary TO authenticated;
GRANT SELECT ON accounts_receivable_summary TO authenticated;

-- Comments
COMMENT ON TABLE public.accounts_payable IS 'Accounts payable (Contas a Pagar) - money owed to suppliers';
COMMENT ON TABLE public.accounts_receivable IS 'Accounts receivable (Contas a Receber) - money owed by clients';
COMMENT ON TABLE public.payment_history IS 'History of payments made for receivables and payables';
