-- Add product type classification to products table

-- Add product_type column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'sale' CHECK (product_type IN ('sale', 'part', 'service'));

-- Add additional pricing fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS os_price DECIMAL(10,2); -- Price when used in service orders

-- Add fiscal data fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ncm VARCHAR(8),
ADD COLUMN IF NOT EXISTS cfop VARCHAR(4),
ADD COLUMN IF NOT EXISTS unit VARCHAR(3) DEFAULT 'UN',
ADD COLUMN IF NOT EXISTS cst VARCHAR(3);

-- Add service/part specific fields
ALTER TABLE products
ADD COLUMN IF NOT EXISTS warranty_days INTEGER,
ADD COLUMN IF NOT EXISTS compatibility TEXT,
ADD COLUMN IF NOT EXISTS avg_replacement_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS technician_commission DECIMAL(5,2);

-- Add delivery flags
ALTER TABLE products
ADD COLUMN IF NOT EXISTS allows_delivery BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_fragile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_special_packaging BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN products.product_type IS 'Type: sale (regular product), part (for service orders), service (non-stock)';
COMMENT ON COLUMN products.cost_price IS 'Cost price for profit margin calculation';
COMMENT ON COLUMN products.promotional_price IS 'Promotional/sale price';
COMMENT ON COLUMN products.profit_margin IS 'Profit margin percentage';
COMMENT ON COLUMN products.os_price IS 'Price when used in service orders (for parts)';
COMMENT ON COLUMN products.ncm IS 'NCM fiscal code';
COMMENT ON COLUMN products.cfop IS 'CFOP fiscal code';
COMMENT ON COLUMN products.unit IS 'Unit of measurement (UN, KG, MT, etc)';
COMMENT ON COLUMN products.warranty_days IS 'Warranty period in days (for parts)';
COMMENT ON COLUMN products.compatibility IS 'Compatible device models (for parts)';
COMMENT ON COLUMN products.avg_replacement_time IS 'Average replacement time in minutes (for parts/services)';
COMMENT ON COLUMN products.technician_commission IS 'Technician commission percentage';

-- Create index for product type filtering
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
