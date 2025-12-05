-- Create discounts table
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  applicable_to VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (applicable_to IN ('all', 'products', 'categories', 'clients')),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discount_applications table for specific targets
CREATE TABLE discount_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('product', 'category', 'client')),
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_discounts table for tracking discounts applied to sales
CREATE TABLE sale_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  discount_id UUID REFERENCES discounts(id),
  discount_name VARCHAR(100) NOT NULL,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_discounts_active ON discounts(is_active);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);
CREATE INDEX idx_discount_applications_discount_id ON discount_applications(discount_id);
CREATE INDEX idx_discount_applications_target ON discount_applications(target_type, target_id);
CREATE INDEX idx_sale_discounts_sale_id ON sale_discounts(sale_id);
CREATE INDEX idx_sale_discounts_discount_id ON sale_discounts(discount_id);

-- Enable RLS
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_discounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discounts
CREATE POLICY "Admins can view all discounts" ON discounts
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view active discounts" ON discounts
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'vendas' AND 
        is_active = true
    );

CREATE POLICY "Admins can insert discounts" ON discounts
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update discounts" ON discounts
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete discounts" ON discounts
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for discount_applications
CREATE POLICY "Admins can manage discount applications" ON discount_applications
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view discount applications" ON discount_applications
    FOR SELECT USING (auth.jwt() ->> 'role' = 'vendas');

-- RLS Policies for sale_discounts
CREATE POLICY "Admins can view all sale discounts" ON sale_discounts
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view sale discounts" ON sale_discounts
    FOR SELECT USING (auth.jwt() ->> 'role' = 'vendas');

CREATE POLICY "Financeiro can view sale discounts" ON sale_discounts
    FOR SELECT USING (auth.jwt() ->> 'role' = 'financeiro');

-- Add updated_at trigger
CREATE TRIGGER update_discounts_updated_at 
    BEFORE UPDATE ON discounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default discounts
INSERT INTO discounts (name, description, type, value, applicable_to, is_active) VALUES
('Desconto de 10%', 'Desconto padrão de 10% para todos os produtos', 'percentage', 10.00, 'all', true),
('Desconto Fixo R$5', 'Desconto fixo de R$5,00', 'fixed_amount', 5.00, 'all', true),
('Desconto de 20%', 'Desconto promocional de 20%', 'percentage', 20.00, 'all', false),
('Desconto Cliente VIP', 'Desconto especial para clientes VIP', 'percentage', 15.00, 'clients', false),
('Desconto Categoria Eletrônicos', 'Desconto para produtos eletrônicos', 'percentage', 5.00, 'categories', false);

-- Add comments
COMMENT ON TABLE discounts IS 'Discount configurations with various types and conditions';
COMMENT ON COLUMN discounts.type IS 'Type of discount: percentage or fixed_amount';
COMMENT ON COLUMN discounts.value IS 'Discount value: percentage (0-100) or fixed amount';
COMMENT ON COLUMN discounts.applicable_to IS 'What the discount applies to: all, products, categories, or clients';
COMMENT ON COLUMN discounts.usage_limit IS 'Maximum number of times this discount can be used';
COMMENT ON COLUMN discounts.usage_count IS 'Current number of times this discount has been used';
COMMENT ON TABLE discount_applications IS 'Specific products, categories, or clients that discounts apply to';
COMMENT ON TABLE sale_discounts IS 'Tracking of discounts applied to specific sales';
