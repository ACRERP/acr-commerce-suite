-- Create product variations table
CREATE TABLE product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sale_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) DEFAULT 0.00,
  stock_quantity INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  barcode VARCHAR(50),
  image_url TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX idx_product_variations_sku ON product_variations(sku);
CREATE INDEX idx_product_variations_active ON product_variations(is_active);
CREATE INDEX idx_product_variations_attributes ON product_variations USING GIN(attributes);

-- Add generated columns for profit calculations
ALTER TABLE product_variations 
ADD COLUMN profit_margin DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN cost_price > 0 THEN ((sale_price - cost_price) / cost_price * 100)
    ELSE 0
  END
) STORED,
ADD COLUMN profit_amount DECIMAL(10,2) GENERATED ALWAYS AS (
  sale_price - cost_price
) STORED;

-- Create variation attributes lookup tables
CREATE TABLE variation_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  hex_code VARCHAR(7) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE variation_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(20) UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common colors
INSERT INTO variation_colors (name, hex_code) VALUES
  ('Preto', '#000000'),
  ('Branco', '#FFFFFF'),
  ('Cinza', '#808080'),
  ('Azul', '#0000FF'),
  ('Vermelho', '#FF0000'),
  ('Verde', '#00FF00'),
  ('Amarelo', '#FFFF00'),
  ('Laranja', '#FFA500'),
  ('Rosa', '#FFC0CB'),
  ('Roxo', '#800080'),
  ('Marrom', '#8B4513'),
  ('Bege', '#F5F5DC');

-- Insert common sizes
INSERT INTO variation_sizes (name, sort_order) VALUES
  ('PP', 1),
  ('P', 2),
  ('M', 3),
  ('G', 4),
  ('GG', 5),
  ('XGG', 6),
  ('XG', 7),
  ('UN', 8),
  ('34', 9),
  ('36', 10),
  ('38', 11),
  ('40', 12),
  ('42', 13),
  ('44', 14),
  ('46', 15),
  ('48', 16);

-- Enable RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation_sizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_variations
CREATE POLICY "Admins can view all variations" ON product_variations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Financeiro can view all variations" ON product_variations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'financeiro');

CREATE POLICY "Vendas can view active variations" ON product_variations
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('vendas', 'estoque') AND 
        is_active = true
    );

CREATE POLICY "Admins can insert variations" ON product_variations
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update variations" ON product_variations
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Estoque can update variation stock" ON product_variations
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'estoque' AND
        (stock_quantity IS NOT NULL OR sale_price IS NOT NULL)
    );

CREATE POLICY "Admins can delete variations" ON product_variations
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for lookup tables
CREATE POLICY "Authenticated users can view colors" ON variation_colors
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view sizes" ON variation_sizes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage colors" ON variation_colors
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage sizes" ON variation_sizes
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_variations_updated_at 
    BEFORE UPDATE ON product_variations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE product_variations IS 'Product variations with different attributes like color, size, etc.';
COMMENT ON COLUMN product_variations.attributes IS 'JSON object containing variation attributes (color, size, etc.)';
COMMENT ON TABLE variation_colors IS 'Available colors for product variations';
COMMENT ON TABLE variation_sizes IS 'Available sizes for product variations';
