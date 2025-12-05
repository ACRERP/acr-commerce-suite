-- Create financial categories table
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('payable', 'receivable')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  payment_date DATE,
  category_id UUID REFERENCES financial_categories(id),
  client_id UUID REFERENCES clients(id),
  supplier_id UUID REFERENCES suppliers(id),
  reference_number VARCHAR(100),
  notes TEXT,
  installments_total INTEGER DEFAULT 1 CHECK (installments_total > 0),
  current_installment INTEGER DEFAULT 1 CHECK (current_installment > 0 AND current_installment <= installments_total),
  parent_transaction_id UUID REFERENCES financial_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create transaction payments table
CREATE TABLE IF NOT EXISTS transaction_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES financial_transactions(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL,
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
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

-- Indexes for performance
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_due_date ON financial_transactions(due_date);
CREATE INDEX idx_financial_transactions_client_id ON financial_transactions(client_id);
CREATE INDEX idx_financial_transactions_supplier_id ON financial_transactions(supplier_id);
CREATE INDEX idx_financial_transactions_category_id ON financial_transactions(category_id);
CREATE INDEX idx_transaction_payments_transaction_id ON transaction_payments(transaction_id);

-- Enable RLS
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial categories
CREATE POLICY "Financial categories are viewable by authenticated users"
ON financial_categories FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create financial categories"
ON financial_categories FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own financial categories"
ON financial_categories FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

CREATE POLICY "Users can delete their own financial categories"
ON financial_categories FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- RLS Policies for financial transactions
CREATE POLICY "Financial transactions are viewable by authenticated users"
ON financial_transactions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create financial transactions"
ON financial_transactions FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own financial transactions"
ON financial_transactions FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

CREATE POLICY "Users can delete their own financial transactions"
ON financial_transactions FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- RLS Policies for transaction payments
CREATE POLICY "Transaction payments are viewable by authenticated users"
ON transaction_payments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create transaction payments"
ON transaction_payments FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- RLS Policies for suppliers
CREATE POLICY "Suppliers are viewable by authenticated users"
ON suppliers FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create suppliers"
ON suppliers FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own suppliers"
ON suppliers FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

CREATE POLICY "Users can delete their own suppliers"
ON suppliers FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financial_categories_updated_at
    BEFORE UPDATE ON financial_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update transaction status based on payments
CREATE OR REPLACE FUNCTION update_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update transaction status based on total payments
  UPDATE financial_transactions 
  SET status = CASE 
    WHEN (
      SELECT COALESCE(SUM(amount), 0) 
      FROM transaction_payments 
      WHERE transaction_id = NEW.transaction_id
    ) >= (
      SELECT amount 
      FROM financial_transactions 
      WHERE id = NEW.transaction_id
    ) THEN 'paid'
    ELSE 'pending'
  END
  WHERE id = NEW.transaction_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update status when payment is added
CREATE TRIGGER update_transaction_status_on_payment
    AFTER INSERT ON transaction_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_status();

-- Comments
COMMENT ON TABLE financial_categories IS 'Categories for organizing financial transactions';
COMMENT ON TABLE financial_transactions IS 'Accounts payable and receivable transactions';
COMMENT ON TABLE transaction_payments IS 'Payment records for financial transactions';
COMMENT ON TABLE suppliers IS 'Supplier information for accounts payable';

COMMENT ON COLUMN financial_transactions.type IS 'Type: payable (contas a pagar) or receivable (contas a receber)';
COMMENT ON COLUMN financial_transactions.status IS 'Status: pending, paid, overdue, cancelled';
COMMENT ON COLUMN financial_transactions.installments_total IS 'Total number of installments for recurring payments';
COMMENT ON COLUMN financial_transactions.current_installment IS 'Current installment number';
COMMENT ON COLUMN financial_transactions.parent_transaction_id IS 'Reference to parent transaction for installments';
