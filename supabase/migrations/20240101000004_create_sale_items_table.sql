-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  addition DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(10) DEFAULT 'UN',
  real_cost DECIMAL(10,2),
  profit DECIMAL(10,2),
  commission DECIMAL(10,2),
  icms_rate DECIMAL(5,2) DEFAULT 0,
  ipi_rate DECIMAL(5,2) DEFAULT 0,
  pis_rate DECIMAL(5,2) DEFAULT 0,
  cofins_rate DECIMAL(5,2) DEFAULT 0,
  cfop VARCHAR(4),
  cst_icms VARCHAR(3),
  cst_ipi VARCHAR(3),
  cst_pis VARCHAR(3),
  cst_cofins VARCHAR(3),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_sale_items_created_at ON sale_items(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_sale_items_updated_at 
    BEFORE UPDATE ON sale_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add check constraint for quantity
ALTER TABLE sale_items ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);

-- Add check constraint for unit_price
ALTER TABLE sale_items ADD CONSTRAINT check_unit_price_positive CHECK (unit_price >= 0);
