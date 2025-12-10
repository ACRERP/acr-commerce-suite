-- =====================================================
-- FASE 1.1: SISTEMA DE ESTOQUE E MOVIMENTAÇÕES
-- =====================================================

-- 1. Tabela de Fornecedores
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

-- Sequência para código do fornecedor
CREATE SEQUENCE IF NOT EXISTS supplier_code_seq START 1000;

-- 2. Tabela de Movimentações de Estoque
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
  user_id BIGINT, -- ID do usuário que fez a movimentação (sem constraint)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- 3. Expandir tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id BIGINT REFERENCES suppliers(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'UN'; -- UN, KG, CX, PC, LT, MT
ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(100); -- Localização física no estoque
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_additional DECIMAL(10,2) DEFAULT 0; -- Frete, impostos, etc
ALTER TABLE products ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2); -- Margem de lucro em %
ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_enabled BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS multiple_barcodes TEXT[]; -- Array de códigos de barras adicionais
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[]; -- Array de URLs de imagens

-- 4. Função para atualizar custo médio
CREATE OR REPLACE FUNCTION update_average_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza custo médio apenas em entradas com preço de custo
  IF NEW.movement_type = 'entrada' AND NEW.cost_price IS NOT NULL THEN
    UPDATE products 
    SET cost_price = (
      SELECT CASE 
        WHEN (stock_quantity + NEW.quantity) = 0 THEN cost_price
        ELSE (cost_price * stock_quantity + NEW.cost_price * NEW.quantity) / (stock_quantity + NEW.quantity)
      END
    ),
    updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para custo médio
DROP TRIGGER IF EXISTS trigger_update_cost ON stock_movements;
CREATE TRIGGER trigger_update_cost
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_average_cost();

-- 5. Função para atualizar estoque
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Entrada: aumenta estoque
  IF NEW.movement_type IN ('entrada', 'devolucao') THEN
    UPDATE products 
    SET stock_quantity = stock_quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  
  -- Saída: diminui estoque
  ELSIF NEW.movement_type IN ('saida', 'perda') THEN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  
  -- Ajuste: define estoque
  ELSIF NEW.movement_type = 'ajuste' THEN
    UPDATE products 
    SET stock_quantity = NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque
DROP TRIGGER IF EXISTS trigger_update_stock ON stock_movements;
CREATE TRIGGER trigger_update_stock
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION update_stock_quantity();

-- 6. View para produtos com estoque baixo
CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
  p.id,
  p.code,
  p.name,
  p.category,
  p.stock_quantity as stock,
  p.minimum_stock_level as min_stock,
  COALESCE(p.cost_price, 0) as cost,
  COALESCE(p.sale_price, 0) as price,
  s.name as supplier_name,
  (p.minimum_stock_level - p.stock_quantity) as quantity_to_order
FROM products p
LEFT JOIN suppliers s ON s.id = p.supplier_id
WHERE COALESCE(p.alert_enabled, true) = true 
  AND p.stock_quantity <= p.minimum_stock_level
  AND COALESCE(p.active, true) = true
ORDER BY (p.minimum_stock_level - p.stock_quantity) DESC;

-- 7. View para histórico de movimentações
CREATE OR REPLACE VIEW stock_movement_history AS
SELECT 
  sm.id,
  sm.created_at,
  sm.movement_type,
  sm.quantity,
  sm.cost_price,
  sm.reference_type,
  sm.reference_id,
  sm.reason,
  sm.notes,
  p.code as product_code,
  p.name as product_name,
  p.unit,
  sm.user_id,
  NULL::TEXT as user_name,
  s.name as supplier_name
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
LEFT JOIN suppliers s ON s.id = p.supplier_id
ORDER BY sm.created_at DESC;

-- 8. Função para gerar código de fornecedor
CREATE OR REPLACE FUNCTION generate_supplier_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := 'FORN' || LPAD(nextval('supplier_code_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para código de fornecedor
DROP TRIGGER IF EXISTS trigger_supplier_code ON suppliers;
CREATE TRIGGER trigger_supplier_code
BEFORE INSERT ON suppliers
FOR EACH ROW EXECUTE FUNCTION generate_supplier_code();

-- 9. Políticas RLS para suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers full access" ON suppliers;
CREATE POLICY "Suppliers full access" ON suppliers
  FOR ALL USING (true) WITH CHECK (true);

-- 10. Políticas RLS para stock_movements
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stock movements full access" ON stock_movements;
CREATE POLICY "Stock movements full access" ON stock_movements
  FOR ALL USING (true) WITH CHECK (true);

-- 11. Função para validar estoque antes de saída
CREATE OR REPLACE FUNCTION validate_stock_before_movement()
RETURNS TRIGGER AS $$
DECLARE
  current_stock DECIMAL(10,3);
BEGIN
  -- Valida apenas em saídas e perdas
  IF NEW.movement_type IN ('saida', 'perda') THEN
    SELECT stock_quantity INTO current_stock FROM products WHERE id = NEW.product_id;
    
    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', current_stock, NEW.quantity;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar estoque
DROP TRIGGER IF EXISTS trigger_validate_stock ON stock_movements;
CREATE TRIGGER trigger_validate_stock
BEFORE INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION validate_stock_before_movement();

-- 12. Atualizar updated_at em suppliers
CREATE OR REPLACE FUNCTION update_supplier_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_supplier_updated ON suppliers;
CREATE TRIGGER trigger_supplier_updated
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_supplier_timestamp();

-- 13. Inserir categorias financeiras padrão para estoque
INSERT INTO financial_categories (name, type) VALUES
  ('Compra de Estoque', 'despesa'),
  ('Venda de Produtos', 'receita')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE suppliers IS 'Cadastro de fornecedores de produtos';
COMMENT ON TABLE stock_movements IS 'Histórico de todas as movimentações de estoque';
COMMENT ON COLUMN products.supplier_id IS 'Fornecedor preferencial do produto';
COMMENT ON COLUMN products.profit_margin IS 'Margem de lucro em porcentagem';
COMMENT ON COLUMN products.cost_additional IS 'Custos adicionais (frete, impostos)';
