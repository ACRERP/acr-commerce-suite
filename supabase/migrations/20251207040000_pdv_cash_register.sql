-- =====================================================
-- PDV & CASH REGISTER SYSTEM - Database Migration
-- Date: 2025-12-07
-- Description: Complete PDV and Cash Register tables
-- =====================================================

-- 1. CASH REGISTERS (Caixas)
CREATE TABLE IF NOT EXISTS cash_registers (
  id SERIAL PRIMARY KEY,
  operator_id UUID REFERENCES auth.users(id),
  operator_name VARCHAR(100),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(10,2),
  expected_balance DECIMAL(10,2),
  difference DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_operator ON cash_registers(operator_id);

-- 2. ADD cash_register_id TO EXISTING SALES TABLE (if sales table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'cash_register_id') THEN
      ALTER TABLE sales ADD COLUMN cash_register_id INTEGER REFERENCES cash_registers(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_value') THEN
      ALTER TABLE sales ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_percent') THEN
      ALTER TABLE sales ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'delivery_fee') THEN
      ALTER TABLE sales ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'sale_type') THEN
      ALTER TABLE sales ADD COLUMN sale_type VARCHAR(20) DEFAULT 'counter';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'payment_status') THEN
      ALTER TABLE sales ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'cancelled_reason') THEN
      ALTER TABLE sales ADD COLUMN cancelled_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'cancelled_at') THEN
      ALTER TABLE sales ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'cancelled_by') THEN
      ALTER TABLE sales ADD COLUMN cancelled_by UUID REFERENCES auth.users(id);
    END IF;
  ELSE
    -- Create sales table if not exists
    CREATE TABLE sales (
      id SERIAL PRIMARY KEY,
      cash_register_id INTEGER REFERENCES cash_registers(id),
      client_id INTEGER REFERENCES clients(id),
      operator_id UUID REFERENCES auth.users(id),
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount_value DECIMAL(10,2) DEFAULT 0,
      discount_percent DECIMAL(5,2) DEFAULT 0,
      delivery_fee DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      sale_type VARCHAR(20) DEFAULT 'counter',
      payment_status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      cancelled_reason TEXT,
      cancelled_at TIMESTAMP WITH TIME ZONE,
      cancelled_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_cash_register ON sales(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);

-- 3. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255),
  product_code VARCHAR(50),
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- 4. SALE PAYMENTS
CREATE TABLE IF NOT EXISTS sale_payments (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  payment_method VARCHAR(30) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  received_amount DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  card_brand VARCHAR(30),
  card_last_digits VARCHAR(4),
  authorization_code VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_method ON sale_payments(payment_method);

-- 5. CASH MOVEMENTS
CREATE TABLE IF NOT EXISTS cash_movements (
  id SERIAL PRIMARY KEY,
  cash_register_id INTEGER REFERENCES cash_registers(id),
  sale_id INTEGER REFERENCES sales(id),
  movement_type VARCHAR(10) NOT NULL,
  category VARCHAR(30) NOT NULL,
  payment_method VARCHAR(30),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  operator_id UUID REFERENCES auth.users(id),
  requires_password BOOLEAN DEFAULT FALSE,
  authorized_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON cash_movements(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_type ON cash_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_cash_movements_category ON cash_movements(category);

-- 6. DELIVERY INFO
CREATE TABLE IF NOT EXISTS sale_delivery_info (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE UNIQUE,
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_zipcode VARCHAR(10),
  address_reference TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  driver_id INTEGER,
  driver_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  dispatched_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SUSPENDED SALES
CREATE TABLE IF NOT EXISTS suspended_sales (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE UNIQUE,
  suspended_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update sale totals
CREATE OR REPLACE FUNCTION update_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sales
  SET 
    subtotal = (SELECT COALASCE(SUM(subtotal), 0) FROM sale_items WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)),
    total = (SELECT COALESCE(SUM(subtotal), 0) FROM sale_items WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)) 
            - COALESCE(discount_value, 0) 
            + COALESCE(delivery_fee, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sale_totals ON sale_items;
CREATE TRIGGER trigger_update_sale_totals
AFTER INSERT OR UPDATE OR DELETE ON sale_items
FOR EACH ROW EXECUTE FUNCTION update_sale_totals();

-- Function to update stock when sale is completed
CREATE OR REPLACE FUNCTION update_stock_on_sale_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE products
    SET stock_quantity = stock_quantity - si.quantity
    FROM sale_items si
    WHERE si.sale_id = NEW.id AND products.id = si.product_id;
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    UPDATE products
    SET stock_quantity = stock_quantity + si.quantity
    FROM sale_items si
    WHERE si.sale_id = NEW.id AND products.id = si.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stock_on_sale_complete ON sales;
CREATE TRIGGER trigger_stock_on_sale_complete
AFTER UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale_complete();

-- Function to auto-create cash movement on sale completion
CREATE OR REPLACE FUNCTION create_cash_movement_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' AND NEW.cash_register_id IS NOT NULL THEN
    INSERT INTO cash_movements (
      cash_register_id, sale_id, movement_type, category, payment_method, amount, description, operator_id
    )
    SELECT 
      NEW.cash_register_id,
      NEW.id,
      'entrada',
      'venda',
      sp.payment_method,
      sp.amount,
      'Venda #' || NEW.id,
      NEW.operator_id
    FROM sale_payments sp
    WHERE sp.sale_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cash_movement_on_sale ON sales;
CREATE TRIGGER trigger_cash_movement_on_sale
AFTER UPDATE ON sales
FOR EACH ROW EXECUTE FUNCTION create_cash_movement_on_sale();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE cash_registers IS 'Controle de caixas - abertura e fechamento diário';
COMMENT ON TABLE sales IS 'Vendas do PDV - balcão e delivery';
COMMENT ON TABLE sale_items IS 'Itens de cada venda';
COMMENT ON TABLE sale_payments IS 'Formas de pagamento da venda (suporta misto)';
COMMENT ON TABLE cash_movements IS 'Todas as movimentações do caixa (entradas e saídas)';
COMMENT ON TABLE sale_delivery_info IS 'Informações de entrega para vendas delivery';
