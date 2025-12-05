-- Create cash_registers table
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  initial_balance DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cash_register_operations table for tracking open/close operations
CREATE TABLE cash_register_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('open', 'close', 'adjustment')),
  opening_balance DECIMAL(10,2) NOT NULL,
  closing_balance DECIMAL(10,2),
  expected_balance DECIMAL(10,2),
  difference DECIMAL(10,2),
  notes TEXT,
  operator_id UUID REFERENCES auth.users(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cash_movements table for tracking individual cash movements
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_operation_id UUID REFERENCES cash_register_operations(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('sale', 'refund', 'cash_in', 'cash_out', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference sales, refunds, etc.
  reference_type VARCHAR(50), -- 'sale', 'refund', 'manual_adjustment', etc.
  operator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_cash_registers_active ON cash_registers(is_active);
CREATE INDEX idx_cash_register_operations_register_id ON cash_register_operations(cash_register_id);
CREATE INDEX idx_cash_register_operations_status ON cash_register_operations(status);
CREATE INDEX idx_cash_register_operations_dates ON cash_register_operations(opened_at, closed_at);
CREATE INDEX idx_cash_movements_operation_id ON cash_movements(cash_register_operation_id);
CREATE INDEX idx_cash_movements_type ON cash_movements(movement_type);
CREATE INDEX idx_cash_movements_reference ON cash_movements(reference_type, reference_id);

-- Enable RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cash_registers
CREATE POLICY "Admins can view all cash registers" ON cash_registers
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view active cash registers" ON cash_registers
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        is_active = true
    );

CREATE POLICY "Admins can insert cash registers" ON cash_registers
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update cash registers" ON cash_registers
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete cash registers" ON cash_registers
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for cash_register_operations
CREATE POLICY "Admins can view all cash register operations" ON cash_register_operations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view cash register operations" ON cash_register_operations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'vendas');

CREATE POLICY "Financeiro can view cash register operations" ON cash_register_operations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'financeiro');

CREATE POLICY "Admins can insert cash register operations" ON cash_register_operations
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can insert cash register operations" ON cash_register_operations
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'vendas');

CREATE POLICY "Admins can update cash register operations" ON cash_register_operations
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can update cash register operations" ON cash_register_operations
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'vendas');

-- RLS Policies for cash_movements
CREATE POLICY "Admins can view all cash movements" ON cash_movements
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view cash movements" ON cash_movements
    FOR SELECT USING (auth.jwt() ->> 'role' = 'vendas');

CREATE POLICY "Financeiro can view cash movements" ON cash_movements
    FOR SELECT USING (auth.jwt() ->> 'role' = 'financeiro');

CREATE POLICY "Admins can insert cash movements" ON cash_movements
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can insert cash movements" ON cash_movements
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'vendas');

-- Add updated_at triggers
CREATE TRIGGER update_cash_registers_updated_at 
    BEFORE UPDATE ON cash_registers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_register_operations_updated_at 
    BEFORE UPDATE ON cash_register_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update cash register balance
CREATE OR REPLACE FUNCTION update_cash_register_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cash register current balance when operations are closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        UPDATE cash_registers 
        SET current_balance = NEW.closing_balance
        WHERE id = NEW.cash_register_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for balance updates
CREATE TRIGGER update_balance_on_operation_close
    AFTER UPDATE ON cash_register_operations
    FOR EACH ROW EXECUTE FUNCTION update_cash_register_balance();

-- Function to get current open operation
CREATE OR REPLACE FUNCTION get_current_cash_register_operation(p_cash_register_id UUID)
RETURNS UUID AS $$
DECLARE
    operation_id UUID;
BEGIN
    SELECT id INTO operation_id
    FROM cash_register_operations
    WHERE cash_register_id = p_cash_register_id
    AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1;
    
    RETURN operation_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default cash registers
INSERT INTO cash_registers (name, description, location, initial_balance) VALUES
('Caixa Principal', 'Caixa principal da loja', 'Loja', 100.00),
('Caixa Drive-Thru', 'Caixa para atendimento drive-thru', 'Drive-Thru', 50.00),
('Caixa Delivers', 'Caixa para entregas', 'Cozinha', 0.00);

-- Add comments
COMMENT ON TABLE cash_registers IS 'Physical cash registers with balance tracking';
COMMENT ON COLUMN cash_registers.initial_balance IS 'Initial balance when register is first created';
COMMENT ON COLUMN cash_registers.current_balance IS 'Current balance of the cash register';
COMMENT ON TABLE cash_register_operations IS 'Open/close operations for cash registers';
COMMENT ON COLUMN cash_register_operations.operation_type IS 'Type: open, close, or adjustment';
COMMENT ON COLUMN cash_register_operations.opening_balance IS 'Balance when operation started';
COMMENT ON COLUMN cash_register_operations.closing_balance IS 'Balance when operation ended';
COMMENT ON COLUMN cash_register_operations.expected_balance IS 'Expected balance based on calculations';
COMMENT ON COLUMN cash_register_operations.difference IS 'Difference between expected and actual closing balance';
COMMENT ON TABLE cash_movements IS 'Individual cash movements within operations';
COMMENT ON COLUMN cash_movements.movement_type IS 'Type: sale, refund, cash_in, cash_out, adjustment';
COMMENT ON COLUMN cash_movements.reference_id IS 'Reference to related record (sale, refund, etc.)';
COMMENT ON COLUMN cash_movements.reference_type IS 'Type of reference record';
