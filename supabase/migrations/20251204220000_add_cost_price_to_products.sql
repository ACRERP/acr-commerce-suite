-- Add cost_price column to products table
ALTER TABLE products 
ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN profit_margin DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN cost_price > 0 THEN ((sale_price - cost_price) / cost_price * 100)
    ELSE 0
  END
) STORED,
ADD COLUMN profit_amount DECIMAL(10,2) GENERATED ALWAYS AS (
  sale_price - cost_price
) STORED;

-- Add comments for documentation
COMMENT ON COLUMN products.cost_price IS 'Custo de aquisição do produto';
COMMENT ON COLUMN products.profit_margin IS 'Margem de lucro percentual calculada automaticamente';
COMMENT ON COLUMN products.profit_amount IS 'Valor do lucro calculado automaticamente';

-- Create index for cost-based queries
CREATE INDEX idx_products_cost_price ON products(cost_price);
CREATE INDEX idx_products_profit_margin ON products(profit_margin);

-- Add RLS policy for cost_price (only admin and financeiro can see cost prices)
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

-- Recreate policies with cost price restrictions
CREATE POLICY "Admins can view all products with costs" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Financeiro can view products with costs" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' = 'financeiro');

CREATE POLICY "Vendas can view products without costs" ON products
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'vendas' AND 
        cost_price IS NULL
    );

CREATE POLICY "Estoque can view products with costs" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' = 'estoque');

CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all products" ON products
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Estoque can update product costs" ON products
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'estoque' AND
        (cost_price IS NOT NULL OR sale_price IS NOT NULL)
    );

CREATE POLICY "Admins can delete all products" ON products
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
