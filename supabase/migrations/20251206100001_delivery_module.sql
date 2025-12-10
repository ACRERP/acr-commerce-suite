-- Migration: Delivery Module Database Schema
-- Creates complete delivery order management system with drivers and status tracking

-- ===============================================
-- 1. DRIVERS TABLE (ENTREGADORES)
-- ===============================================

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  name VARCHAR(200) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  
  -- Contact
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  
  -- Vehicle info
  vehicle_type VARCHAR(50) DEFAULT 'moto', -- moto, carro, bicicleta, a_pe
  vehicle_brand VARCHAR(50),
  vehicle_model VARCHAR(50),
  vehicle_plate VARCHAR(10),
  vehicle_color VARCHAR(30),
  
  -- Contract and payment
  contract_type VARCHAR(20) DEFAULT 'fixo', -- fixo, avulso, terceirizado
  commission_type VARCHAR(20) DEFAULT 'fixed', -- fixed, percentage
  commission_value DECIMAL(10,2) DEFAULT 0, -- valor fixo ou percentual
  salary DECIMAL(10,2) DEFAULT 0, -- salário fixo se aplicável
  
  -- Availability
  status VARCHAR(20) DEFAULT 'disponivel', -- disponivel, em_entrega, indisponivel, inativo
  is_active BOOLEAN DEFAULT true,
  
  -- Stats (auto-updated)
  total_deliveries INTEGER DEFAULT 0,
  total_deliveries_month INTEGER DEFAULT 0,
  total_earnings_month DECIMAL(10,2) DEFAULT 0,
  average_delivery_time INTEGER DEFAULT 0, -- minutes
  rating DECIMAL(3,2) DEFAULT 5.0, -- 0-5 stars
  
  -- Multi-store
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
  -- Address (for assignment optimization)
  cep VARCHAR(10),
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 2. DELIVERY ORDERS TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order number (auto-generated, human readable)
  order_number SERIAL,
  
  -- Links
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
  -- Status workflow (for Kanban)
  status VARCHAR(30) DEFAULT 'aguardando_preparo',
  -- Status values:
  -- aguardando_preparo, em_preparo, aguardando_entregador, em_rota, entregue, cancelado
  
  -- Address (copy from client or custom)
  address_type VARCHAR(20) DEFAULT 'client', -- client, custom
  delivery_cep VARCHAR(10),
  delivery_street VARCHAR(200),
  delivery_number VARCHAR(20),
  delivery_complement VARCHAR(100),
  delivery_neighborhood VARCHAR(100),
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(2),
  delivery_reference TEXT, -- ponto de referência
  
  -- Delivery info
  freight_value DECIMAL(10,2) DEFAULT 0,
  priority VARCHAR(10) DEFAULT 'normal', -- normal, urgente
  estimated_time INTEGER, -- estimated delivery time in minutes
  actual_time INTEGER, -- actual time taken
  distance_km DECIMAL(10,2), -- distance in km
  
  -- Payment at delivery
  payment_method VARCHAR(30), -- dinheiro, pix, cartao_credito, cartao_debito
  payment_received DECIMAL(10,2) DEFAULT 0,
  change_needed DECIMAL(10,2) DEFAULT 0, -- troco
  payment_collected BOOLEAN DEFAULT false,
  
  -- Notes
  preparation_notes TEXT, -- notas para cozinha/preparo
  delivery_notes TEXT, -- notas para entregador
  customer_notes TEXT, -- notas do cliente
  
  -- Timestamps for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE, -- when driver accepted
  dispatched_at TIMESTAMP WITH TIME ZONE, -- when left for delivery
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Driver commission for this delivery
  driver_commission DECIMAL(10,2) DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 3. DELIVERY STATUS HISTORY (FOR TRACKING)
-- ===============================================

CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id UUID REFERENCES delivery_orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 4. INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_store ON drivers(store_id);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_driver ON delivery_orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_client ON delivery_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_sale ON delivery_orders(sale_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_store ON delivery_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_created ON delivery_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_date ON delivery_orders(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_delivery_history_order ON delivery_status_history(delivery_order_id);

-- ===============================================
-- 5. TRIGGER TO LOG STATUS CHANGES
-- ===============================================

CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO delivery_status_history (
      delivery_order_id, previous_status, new_status, changed_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid()
    );
    
    -- Update timestamps based on status
    IF NEW.status = 'em_rota' THEN
      NEW.dispatched_at = NOW();
    ELSIF NEW.status = 'entregue' THEN
      NEW.delivered_at = NOW();
      -- Calculate actual delivery time
      IF NEW.dispatched_at IS NOT NULL THEN
        NEW.actual_time = EXTRACT(EPOCH FROM (NOW() - NEW.dispatched_at)) / 60;
      END IF;
    ELSIF NEW.status = 'cancelado' THEN
      NEW.cancelled_at = NOW();
    END IF;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_delivery_status_change ON delivery_orders;
CREATE TRIGGER on_delivery_status_change
  BEFORE UPDATE ON delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();

-- ===============================================
-- 6. FUNCTION TO UPDATE DRIVER STATS
-- ===============================================

CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    UPDATE drivers 
    SET 
      total_deliveries = total_deliveries + 1,
      total_deliveries_month = total_deliveries_month + 1,
      total_earnings_month = total_earnings_month + COALESCE(NEW.driver_commission, 0),
      average_delivery_time = CASE 
        WHEN total_deliveries = 0 THEN NEW.actual_time
        ELSE ((average_delivery_time * total_deliveries) + COALESCE(NEW.actual_time, 0)) / (total_deliveries + 1)
      END,
      status = 'disponivel'
    WHERE id = NEW.driver_id;
  ELSIF NEW.status = 'em_rota' THEN
    UPDATE drivers SET status = 'em_entrega' WHERE id = NEW.driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_delivery_complete ON delivery_orders;
CREATE TRIGGER on_delivery_complete
  AFTER UPDATE ON delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_stats();

-- ===============================================
-- 7. FUNCTION TO CREATE DELIVERY FROM SALE
-- ===============================================

CREATE OR REPLACE FUNCTION create_delivery_from_sale(
  p_sale_id INTEGER,
  p_client_id BIGINT,
  p_freight_value DECIMAL(10,2) DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_delivery_id UUID;
  v_client RECORD;
BEGIN
  -- Get client address
  SELECT 
    cep, street, street_number, complement, neighborhood, city, state
  INTO v_client
  FROM clients WHERE id = p_client_id;
  
  -- Create delivery order
  INSERT INTO delivery_orders (
    sale_id, client_id, status,
    address_type, delivery_cep, delivery_street, delivery_number,
    delivery_complement, delivery_neighborhood, delivery_city, delivery_state,
    freight_value, delivery_notes
  ) VALUES (
    p_sale_id, p_client_id, 'aguardando_preparo',
    'client', v_client.cep, v_client.street, v_client.street_number,
    v_client.complement, v_client.neighborhood, v_client.city, v_client.state,
    p_freight_value, p_notes
  )
  RETURNING id INTO v_delivery_id;
  
  RETURN v_delivery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 8. ENABLE RLS
-- ===============================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;

-- Drivers policies
CREATE POLICY "Authenticated users can view drivers" ON drivers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'gerente')
    )
  );

-- Delivery orders policies
CREATE POLICY "Authenticated users can view delivery orders" ON delivery_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "PDV users can create delivery orders" ON delivery_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authorized users can update delivery orders" ON delivery_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'gerente', 'vendas', 'entregador')
    )
  );

-- Status history policies
CREATE POLICY "Authenticated users can view delivery history" ON delivery_status_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- ===============================================
-- 9. VIEWS FOR REPORTING
-- ===============================================

CREATE OR REPLACE VIEW vw_delivery_summary_today AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'aguardando_preparo') as aguardando_preparo,
  COUNT(*) FILTER (WHERE status = 'em_preparo') as em_preparo,
  COUNT(*) FILTER (WHERE status = 'aguardando_entregador') as aguardando_entregador,
  COUNT(*) FILTER (WHERE status = 'em_rota') as em_rota,
  COUNT(*) FILTER (WHERE status = 'entregue') as entregue,
  COUNT(*) FILTER (WHERE status = 'cancelado') as cancelado,
  COUNT(*) as total,
  COALESCE(SUM(freight_value) FILTER (WHERE status = 'entregue'), 0) as total_frete,
  COALESCE(AVG(actual_time) FILTER (WHERE status = 'entregue'), 0) as tempo_medio
FROM delivery_orders
WHERE DATE(created_at) = CURRENT_DATE;

CREATE OR REPLACE VIEW vw_drivers_availability AS
SELECT 
  d.id, d.name, d.phone, d.vehicle_type, d.vehicle_plate,
  d.status, d.rating, d.total_deliveries_month,
  (SELECT COUNT(*) FROM delivery_orders WHERE driver_id = d.id AND status = 'em_rota') as entregas_ativas
FROM drivers d
WHERE d.is_active = true
ORDER BY d.status, d.name;

-- ===============================================
-- 10. COMMENTS
-- ===============================================

COMMENT ON TABLE drivers IS 'Cadastro de entregadores/motoboys';
COMMENT ON TABLE delivery_orders IS 'Pedidos de delivery com workflow completo';
COMMENT ON TABLE delivery_status_history IS 'Histórico de mudanças de status para rastreamento';
COMMENT ON COLUMN delivery_orders.status IS 'Kanban workflow: aguardando_preparo -> em_preparo -> aguardando_entregador -> em_rota -> entregue';
