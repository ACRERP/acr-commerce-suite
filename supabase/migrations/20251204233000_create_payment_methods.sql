-- Create payment_methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'card', 'digital', 'check', 'other')),
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  max_installments INTEGER DEFAULT 1,
  fee_percentage DECIMAL(5,2) DEFAULT 0,
  fee_fixed_amount DECIMAL(10,2) DEFAULT 0,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#10B981',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_payments table for tracking payments applied to sales
CREATE TABLE sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  installments INTEGER DEFAULT 1 CHECK (installments > 0),
  card_last_digits VARCHAR(4),
  card_brand VARCHAR(20),
  authorization_code VARCHAR(50),
  transaction_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_sort_order ON payment_methods(sort_order);
CREATE INDEX idx_sale_payments_sale_id ON sale_payments(sale_id);
CREATE INDEX idx_sale_payments_payment_method_id ON sale_payments(payment_method_id);
CREATE INDEX idx_sale_payments_status ON sale_payments(status);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Admins can view all payment methods" ON payment_methods
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view active payment methods" ON payment_methods
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        is_active = true
    );

CREATE POLICY "Admins can insert payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update payment methods" ON payment_methods
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete payment methods" ON payment_methods
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for sale_payments
CREATE POLICY "Admins can view all sale payments" ON sale_payments
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view sale payments" ON sale_payments
    FOR SELECT USING (auth.jwt() ->> 'role' = 'vendas');

CREATE POLICY "Financeiro can view sale payments" ON sale_payments
    FOR SELECT USING (auth.jwt() ->> 'role' = 'financeiro');

CREATE POLICY "Admins can insert sale payments" ON sale_payments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can insert sale payments" ON sale_payments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'vendas');

CREATE POLICY "Admins can update sale payments" ON sale_payments
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can update sale payments" ON sale_payments
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'vendas');

-- Add updated_at trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for sale_payments
CREATE TRIGGER update_sale_payments_updated_at 
    BEFORE UPDATE ON sale_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods
INSERT INTO payment_methods (name, description, type, icon, color, sort_order, max_installments) VALUES
('Dinheiro', 'Pagamento em dinheiro', 'cash', 'dollar-sign', '#10B981', 1, 1),
('Cartão de Crédito', 'Pagamento com cartão de crédito', 'card', 'credit-card', '#3B82F6', 2, 12),
('Cartão de Débito', 'Pagamento com cartão de débito', 'card', 'credit-card', '#8B5CF6', 3, 1),
('PIX', 'Pagamento instantâneo via PIX', 'digital', 'smartphone', '#06B6D4', 4, 1),
('Transferência Bancária', 'Transferência direta', 'digital', 'bank', '#F59E0B', 5, 1),
('Boleto', 'Pagamento via boleto bancário', 'other', 'file-text', '#F97316', 6, 1),
('Cheque', 'Pagamento com cheque', 'check', 'check', '#84CC16', 7, 1),
('Vale Alimentação', 'Cartão vale alimentação', 'card', 'utensils', '#EC4899', 8, 1),
('Vale Refeição', 'Cartão vale refeição', 'card', 'coffee', '#14B8A6', 9, 1),
('Criptomoeda', 'Pagamento com criptomoedas', 'digital', 'bitcoin', '#F59E0B', 10, 1);

-- Add comments
COMMENT ON TABLE payment_methods IS 'Payment methods configuration with fees and rules';
COMMENT ON COLUMN payment_methods.type IS 'Type of payment: cash, card, digital, check, or other';
COMMENT ON COLUMN payment_methods.requires_approval IS 'Whether payment requires approval before confirmation';
COMMENT ON COLUMN payment_methods.max_installments IS 'Maximum number of installments allowed';
COMMENT ON COLUMN payment_methods.fee_percentage IS 'Percentage fee charged for this payment method';
COMMENT ON COLUMN payment_methods.fee_fixed_amount IS 'Fixed fee charged for this payment method';
COMMENT ON TABLE sale_payments IS 'Payments applied to sales with tracking information';
COMMENT ON COLUMN sale_payments.installments IS 'Number of installments for credit card payments';
COMMENT ON COLUMN sale_payments.card_last_digits IS 'Last 4 digits of credit card (for card payments)';
COMMENT ON COLUMN sale_payments.card_brand IS 'Card brand (Visa, Mastercard, etc.)';
COMMENT ON COLUMN sale_payments.authorization_code IS 'Authorization code from payment processor';
COMMENT ON COLUMN sale_payments.transaction_id IS 'Transaction ID from payment processor';
COMMENT ON COLUMN sale_payments.status IS 'Payment status: pending, approved, rejected, cancelled, refunded';
