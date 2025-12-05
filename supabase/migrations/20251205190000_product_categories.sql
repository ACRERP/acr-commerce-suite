-- Product Categories Migration
-- Adds product categories and bulk operations support
-- This migration only ADDS new features, preserves all existing data

-- Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Package',
  color VARCHAR(20) DEFAULT 'blue',
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Add category_id to products table (safe addition)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- Bulk Operations Log
CREATE TABLE IF NOT EXISTS bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL, -- 'price_update', 'category_change', 'stock_update', 'import', 'export'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_message TEXT,
  file_path VARCHAR(500),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL
);

-- Bulk Operation Details
CREATE TABLE IF NOT EXISTS bulk_operation_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_operation_id UUID REFERENCES bulk_operations(id) ON DELETE CASCADE,
  record_id INTEGER, -- product_id, client_id, etc.
  record_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Product Price History
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  change_reason VARCHAR(100),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_operation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tenant categories" ON product_categories
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant categories" ON product_categories
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own bulk operations" ON bulk_operations
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own bulk operations" ON bulk_operations
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own bulk operation details" ON bulk_operation_details
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own price history" ON product_price_history
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user ON bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_tenant ON bulk_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_details_operation ON bulk_operation_details(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_product_price_history_product ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_history_tenant ON product_price_history(tenant_id);

-- Insert default categories
INSERT INTO product_categories (name, description, icon, color, sort_order, tenant_id) VALUES
('Eletrônicos', 'Produtos eletrônicos e acessórios', 'Smartphone', 'blue', 1, current_setting('app.current_tenant')::uuid),
('Alimentos', 'Produtos alimentícios e bebidas', 'Coffee', 'green', 2, current_setting('app.current_tenant')::uuid),
('Roupas', 'Vestuário e acessórios', 'ShoppingBag', 'purple', 3, current_setting('app.current_tenant')::uuid),
('Limpeza', 'Produtos de limpeza e higiene', 'Sparkles', 'cyan', 4, current_setting('app.current_tenant')::uuid),
('Móveis', 'Móveis e decoração', 'Home', 'orange', 5, current_setting('app.current_tenant')::uuid),
('Livros', 'Livros e material escolar', 'Book', 'indigo', 6, current_setting('app.current_tenant')::uuid),
('Esportes', 'Artigos esportivos e fitness', 'Dumbbell', 'red', 7, current_setting('app.current_tenant')::uuid),
('Brinquedos', 'Brinquedos e jogos', 'Gamepad', 'pink', 8, current_setting('app.current_tenant')::uuid)
ON CONFLICT DO NOTHING;

-- Function to track price changes
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if price actually changed
  IF OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
    INSERT INTO product_price_history (product_id, old_price, new_price, changed_by, tenant_id)
    VALUES (NEW.id, OLD.sale_price, NEW.sale_price, auth.uid(), current_setting('app.current_tenant')::uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price tracking
DROP TRIGGER IF EXISTS on_product_price_change ON products;
CREATE TRIGGER on_product_price_change
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION track_price_change();

-- Function to start bulk operation
CREATE OR REPLACE FUNCTION start_bulk_operation(
  operation_type_param VARCHAR,
  total_records_param INTEGER DEFAULT 0,
  file_path_param VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  operation_id UUID;
BEGIN
  INSERT INTO bulk_operations (
    operation_type, total_records, file_path, user_id, tenant_id
  ) VALUES (
    operation_type_param, total_records_param, file_path_param,
    auth.uid(), current_setting('app.current_tenant')::uuid
  )
  RETURNING id INTO operation_id;
  
  RETURN operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bulk operation progress
CREATE OR REPLACE FUNCTION update_bulk_operation_progress(
  operation_id_param UUID,
  processed_param INTEGER DEFAULT NULL,
  failed_param INTEGER DEFAULT NULL,
  status_param VARCHAR DEFAULT NULL,
  error_message_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE bulk_operations SET
    processed_records = COALESCE(processed_param, processed_records),
    failed_records = COALESCE(failed_param, failed_records),
    status = COALESCE(status_param, status),
    error_message = COALESCE(error_message_param, error_message),
    updated_at = NOW(),
    completed_at = CASE WHEN status_param = 'completed' THEN NOW() ELSE completed_at END
  WHERE id = operation_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE product_categories IS 'Product categorization system with hierarchical support';
COMMENT ON TABLE bulk_operations IS 'Bulk operations tracking for imports, exports, and mass updates';
COMMENT ON TABLE bulk_operation_details IS 'Detailed records for bulk operations';
COMMENT ON TABLE product_price_history IS 'Historical tracking of product price changes';
