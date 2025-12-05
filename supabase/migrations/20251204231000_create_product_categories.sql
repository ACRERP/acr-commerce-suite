-- Create product categories table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  code VARCHAR(20) UNIQUE NOT NULL,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#6366F1',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);
CREATE INDEX idx_product_categories_sort_order ON product_categories(sort_order);

-- Add category to products table
ALTER TABLE products 
ADD COLUMN category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;

-- Create index for product category
CREATE INDEX idx_products_category_id ON products(category_id);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Admins can view all categories" ON product_categories
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view active categories" ON product_categories
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        is_active = true
    );

CREATE POLICY "Admins can insert categories" ON product_categories
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update categories" ON product_categories
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete categories" ON product_categories
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_categories_updated_at 
    BEFORE UPDATE ON product_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO product_categories (name, description, code, icon, color, sort_order) VALUES
('Eletrônicos', 'Produtos eletrônicos e gadgets', 'ELEC', 'laptop', '#3B82F6', 1),
('Vestuário', 'Roupas e acessórios', 'VEST', 'shirt', '#8B5CF6', 2),
('Alimentos', 'Produtos alimentícios e bebidas', 'ALIM', 'utensils', '#10B981', 3),
('Bebidas', 'Bebidas em geral', 'BEBE', 'coffee', '#06B6D4', 4),
('Limpeza', 'Produtos de limpeza e higiene', 'LIMP', 'spray-can', '#84CC16', 5),
('Móveis', 'Móveis e decoração', 'MOBI', 'home', '#F59E0B', 6),
('Esportes', 'Artigos esportivos e fitness', 'ESP', 'dumbbell', '#EF4444', 7),
('Livros', 'Livros e material escolar', 'LIVR', 'book', '#6366F1', 8),
('Brinquedos', 'Brinquedos e jogos', 'BRIN', 'gamepad', '#EC4899', 9),
('Saúde', 'Produtos de saúde e bem-estar', 'SAUD', 'heart', '#14B8A6', 10),
('Automotivo', 'Peças e acessórios automotivos', 'AUTO', 'car', '#F97316', 11),
('Outros', 'Produtos não categorizados', 'OUTR', 'package', '#6B7280', 12);

-- Add comments
COMMENT ON TABLE product_categories IS 'Product categories with hierarchical structure';
COMMENT ON COLUMN product_categories.parent_id IS 'Parent category for hierarchical structure';
COMMENT ON COLUMN product_categories.code IS 'Unique category code for internal use';
COMMENT ON COLUMN product_categories.icon IS 'Icon name for UI display';
COMMENT ON COLUMN product_categories.color IS 'Color hex code for UI display';
