-- =====================================================
-- Migration: CORREÇÃO GERAL DE ESTOQUE E DELIVERY
-- Título: 20251211000000_fix_and_create_all.sql
-- Objetivo: Criar tabelas FALTANTES (suppliers, stock_movements), 
--           adicionar colunas em products, e criar views/tabelas novas.
-- =====================================================

-- =====================================================
-- 0. TABELAS BASE (Se não existirem)
-- =====================================================

-- 0.1 Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE,
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  cnpj VARCHAR(18),
  cpf VARCHAR(14),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  contact_person VARCHAR(100),
  notes TEXT,
  payment_terms VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 0.2 Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste', 'perda', 'devolucao', 'transferencia')),
  quantity DECIMAL(10,3) NOT NULL,
  cost_price DECIMAL(10,2),
  reference_type VARCHAR(20), -- 'sale', 'purchase', 'adjustment', 'manual', 'service_order'
  reference_id BIGINT,
  reason TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id), -- Corrigido para UUID para bater com auth.users/profiles
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- 0.3 Adicionar colunas em PRODUCTS (se não existirem)
DO $$
BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'UN';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2); 
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_additional DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- =====================================================
-- 1. VIEW: stock_movement_history
-- =====================================================
DROP VIEW IF EXISTS stock_movement_history;

CREATE OR REPLACE VIEW stock_movement_history AS
SELECT 
  sm.id,
  sm.product_id,
  p.name as product_name,
  p.code as product_code,
  sm.movement_type,
  sm.quantity,
  sm.reason,
  sm.created_at,
  sm.user_id,
  prof.full_name as user_name,
  prof.email as user_email
FROM stock_movements sm
LEFT JOIN products p ON p.id = sm.product_id
LEFT JOIN profiles prof ON prof.id = sm.user_id
ORDER BY sm.created_at DESC;

-- =====================================================
-- 2. VIEW: products_low_stock
-- =====================================================
DROP VIEW IF EXISTS products_low_stock;

CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
  id,
  name,
  code,
  stock_quantity,
  minimum_stock_level,
  (minimum_stock_level - stock_quantity) as deficit,
  price,
  cost_price,
  CASE 
    WHEN stock_quantity = 0 THEN 'ZERADO'
    WHEN stock_quantity < (minimum_stock_level * 0.3) THEN 'CRÍTICO'
    WHEN stock_quantity < (minimum_stock_level * 0.6) THEN 'BAIXO'
    ELSE 'ATENÇÃO'
  END as severity_level,
  updated_at
FROM products
WHERE stock_quantity <= minimum_stock_level
  AND active = true
ORDER BY deficit DESC, stock_quantity ASC;

-- =====================================================
-- 3. TABELA: delivery_orders
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_orders (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'on_route', 'delivered', 'cancelled')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT NOT NULL,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT DEFAULT 'Sua Cidade',
  zip_code TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  delivery_date TIMESTAMP,
  driver_id UUID REFERENCES profiles(id),
  driver_name TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

-- Índices delivery
CREATE INDEX IF NOT EXISTS idx_delivery_orders_sale_id ON delivery_orders(sale_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);

-- =====================================================
-- 4. RLS POLICIES (Consolidated)
-- =====================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;

-- Suppliers Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON suppliers;
CREATE POLICY "Enable read access for authenticated users" ON suppliers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable write access for authorized roles" ON suppliers;
CREATE POLICY "Enable write access for authorized roles" ON suppliers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vendas', 'financeiro'))
);

-- Stock Movements Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stock_movements;
CREATE POLICY "Enable read access for authenticated users" ON stock_movements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable insert access for authorized roles" ON stock_movements;
CREATE POLICY "Enable insert access for authorized roles" ON stock_movements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vendas'))
);

-- Delivery Orders Policies
DROP POLICY IF EXISTS "authenticated_read_delivery_orders" ON delivery_orders;
CREATE POLICY "authenticated_read_delivery_orders" ON delivery_orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_vendas_insert_delivery_orders" ON delivery_orders;
CREATE POLICY "admin_vendas_insert_delivery_orders" ON delivery_orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'vendas'))
);
DROP POLICY IF EXISTS "admin_vendas_driver_update_delivery_orders" ON delivery_orders;
CREATE POLICY "admin_vendas_driver_update_delivery_orders" ON delivery_orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role IN ('admin', 'vendas') OR id = delivery_orders.driver_id))
);

-- =====================================================
-- 5. FUNCTION: update_product_stock_on_insert
-- Trigger simples para manter o estoque atualizado
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_stock_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type IN ('entrada', 'devolucao') THEN
     UPDATE products SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.product_id;
  ELSIF NEW.movement_type IN ('saida', 'perda', 'transferencia') THEN
     UPDATE products SET stock_quantity = stock_quantity - NEW.quantity WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'ajuste' THEN
     UPDATE products SET stock_quantity = NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_insert ON stock_movements;
CREATE TRIGGER trigger_update_stock_on_insert
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_insert();
