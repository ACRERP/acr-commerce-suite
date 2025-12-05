-- Create inventory reports tables
-- Migration: 20251205160000_create_inventory_reports.sql

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return')),
  quantity DECIMAL(15,4) NOT NULL,
  unit_cost DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  reference_type VARCHAR(50),
  reference_id UUID,
  reason TEXT,
  location VARCHAR(100),
  batch_number VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create inventory_balance table
CREATE TABLE IF NOT EXISTS inventory_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location VARCHAR(100),
  quantity_on_hand DECIMAL(15,4) NOT NULL DEFAULT 0,
  quantity_reserved DECIMAL(15,4) NOT NULL DEFAULT 0,
  quantity_available DECIMAL(15,4) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15,2),
  total_value DECIMAL(15,2),
  last_movement_date TIMESTAMP WITH TIME ZONE,
  last_count_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(product_id, location)
);

-- Create inventory_counts table
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_name VARCHAR(100) NOT NULL,
  count_type VARCHAR(20) NOT NULL CHECK (count_type IN ('full', 'partial', 'cycle')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_products INTEGER DEFAULT 0,
  counted_products INTEGER DEFAULT 0,
  variance_amount DECIMAL(15,2) DEFAULT 0,
  variance_percentage DECIMAL(5,4) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create inventory_count_items table
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location VARCHAR(100),
  system_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
  counted_quantity DECIMAL(15,4),
  variance DECIMAL(15,4),
  variance_value DECIMAL(15,2),
  unit_cost DECIMAL(15,2),
  counted_by UUID REFERENCES auth.users(id),
  counted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(count_id, product_id, location)
);

-- Create inventory_reports table
CREATE TABLE IF NOT EXISTS inventory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('balance', 'movement', 'valuation', 'turnover', 'variance', 'aging')),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE,
  period_end DATE,
  filters JSONB DEFAULT '{}',
  data JSONB NOT NULL,
  file_url TEXT,
  file_format VARCHAR(10) CHECK (file_format IN ('pdf', 'excel', 'csv')),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_product_id ON inventory_balance(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_location ON inventory_balance(location);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_tenant_id ON inventory_balance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_date ON inventory_counts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_tenant_id ON inventory_counts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_count_id ON inventory_count_items(count_id);
CREATE INDEX IF NOT EXISTS idx_inventory_count_items_product_id ON inventory_count_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_type ON inventory_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_date ON inventory_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_tenant_id ON inventory_reports(tenant_id);

-- Enable RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view inventory movements for their tenant" ON inventory_movements
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert inventory movements for their tenant" ON inventory_movements
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update inventory movements for their tenant" ON inventory_movements
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete inventory movements for their tenant" ON inventory_movements
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view inventory balance for their tenant" ON inventory_balance
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert inventory balance for their tenant" ON inventory_balance
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update inventory balance for their tenant" ON inventory_balance
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete inventory balance for their tenant" ON inventory_balance
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view inventory counts for their tenant" ON inventory_counts
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert inventory counts for their tenant" ON inventory_counts
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update inventory counts for their tenant" ON inventory_counts
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete inventory counts for their tenant" ON inventory_counts
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view inventory count items for their tenant" ON inventory_count_items
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert inventory count items for their tenant" ON inventory_count_items
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update inventory count items for their tenant" ON inventory_count_items
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete inventory count items for their tenant" ON inventory_count_items
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view inventory reports for their tenant" ON inventory_reports
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert inventory reports for their tenant" ON inventory_reports
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update inventory reports for their tenant" ON inventory_reports
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete inventory reports for their tenant" ON inventory_reports
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Triggers for updated_at
CREATE TRIGGER update_inventory_balance_updated_at 
  BEFORE UPDATE ON inventory_balance 
  FOR EACH ROW足 EXECUTE FUNCTION update_updated_at_column();

-- Function to update inventory balance
CREATE OR REPLACE FUNCTION update_inventory_balance(
  p_product_id UUID,
  p_location VARCHAR DEFAULT 'Principal',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_balance RECORD;
  total_in DECIMAL;
  total_out DECIMAL;
  total_reserved DECIMAL;
BEGIN
  -- Get current totals
  SELECT 
    COALESCE(SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END), 0)
  INTO total_in, total_out
  FROM inventory_movements
  WHERE product_id = p_product_id
    AND location = p_location
    AND tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Calculate reserved (simplified - would include orders, reservations, etc.)
  SELECT COALESCE(SUM(quantity), 0)
  INTO total_reserved
  FROM inventory_movements
  WHERE product_id = p_product_id
    AND location = p_location
    AND movement_type = 'out'
    AND reference_type = 'order'
    AND tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Upsert balance
  INSERT INTO inventory_balance (
    product_id,
    location,
    quantity_on_hand,
    quantity_reserved,
    quantity_available,
    last_movement_date,
    tenant_id
  ) VALUES (
    p_product_id,
    p_location,
    total_in - total_out,
    total_reserved,
    (total_in - total_out) - total_reserved,
    NOW(),
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  )
  ON CONFLICT (product_id, location)
  DO UPDATE SET
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    quantity_reserved = EXCLUDED.quantity_reserved,
    quantity_available = EXCLUDED.quantity_available,
    last_movement_date = EXCLUDED.last_movement_date,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate inventory report
CREATE OR REPLACE FUNCTION generate_inventory_report(
  p_report_type VARCHAR,
  p_report_name VARCHAR,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL,
  p_filters JSONB DEFAULT '{}',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  report_data JSONB;
  total_value DECIMAL;
  total_products INTEGER;
BEGIN
  -- Generate report data based on type
  CASE p_report_type
    WHEN 'balance' THEN
      SELECT json_agg(
        json_build_object(
          'product_id', ib.product_id,
          'product_name', p.name,
          'sku', p.sku,
          'location', ib.location,
          'quantity_on_hand', ib.quantity_on_hand,
          'quantity_reserved', ib.quantity_reserved,
          'quantity_available', ib.quantity_available,
          'unit_cost', ib.unit_cost,
          'total_value', ib.quantity_on_hand * COALESCE(ib.unit_cost, 0)
        )
      )
      INTO report_data
      FROM inventory_balance ib
      JOIN products p ON ib.product_id = p.id
      WHERE ib.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
      
    WHEN 'movement' THEN
      SELECT json_agg(
        json_build_object(
          'product_id', im.product_id,
          'product_name', p.name,
          'movement_type', im.movement_type,
          'quantity', im.quantity,
          'unit_cost', im.unit_cost,
          'total_cost', im.total_cost,
          'reason', im.reason,
          'location', im.location,
          'created_at', im.created_at
        )
      )
      INTO report_data
      FROM inventory_movements im
      JOIN products p ON im.product_id = p.id
      WHERE im.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
        AND (p_period_start IS NULL OR im.created_at::date >= p_period_start)
        AND (p_period_end IS NULL OR im.created_at::date <= p_period_end);
      
    WHEN 'valuation' THEN
      SELECT json_agg(
        json_build_object(
          'product_id', ib.product_id,
          'product_name', p.name,
          'sku', p.sku,
          'quantity', ib.quantity_on_hand,
          'unit_cost', ib.unit_cost,
          'total_value', ib.quantity_on_hand * COALESCE(ib.unit_cost, 0),
          'value_percentage', (ib.quantity_on_hand * COALESCE(ib.unit_cost, 0) / 
            (SELECT SUM(quantity_on_hand * COALESCE(unit_cost, 0)) FROM inventory_balance WHERE tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')) * 100
        )
      )
      INTO report_data
      FROM inventory_balance ib
      JOIN products p ON ib.product_id = p.id
      WHERE ib.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  END CASE;
  
  -- Calculate totals
  SELECT 
    COUNT(*),
    COALESCE(SUM(quantity_on_hand * COALESCE(unit_cost, 0)), 0)
  INTO total_products, total_value
  FROM inventory_balance
  WHERE tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Create report record
  INSERT INTO inventory_reports (
    report_name,
    report_type,
    period_start,
    period_end,
    filters,
    data,
    tenant_id
  ) VALUES (
    p_report_name,
    p_report_type,
    p_period_start,
    p_period_end,
    p_filters,
    json_build_object(
      'data', report_data,
      'summary', json_build_object(
        'total_products', total_products,
        'total_value', total_value,
        'generated_at', NOW()
      )
    ),
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate inventory turnover
CREATE OR REPLACE FUNCTION calculate_inventory_turnover(
  p_period_start DATE,
  p_period_end DATE,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE(
  product_id UUID,
  product_name VARCHAR,
  sku VARCHAR,
  average_inventory DECIMAL,
  cost_of_goods_sold DECIMAL,
  turnover_ratio DECIMAL,
  days_supply INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH inventory_data AS (
    SELECT 
      p.id,
      p.name,
      p.sku,
      COALESCE(ib.quantity_on_hand, 0) as current_inventory,
      COALESCE(p.cost, 0) as unit_cost
    FROM products p
    LEFT JOIN inventory_balance ib ON p.id = ib.product_id
    WHERE p.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ),
  sales_data AS (
    SELECT 
      si.product_id,
      COALESCE(SUM(si.quantity), 0) as total_quantity,
      COALESCE(SUM(si.quantity * COALESCE(p.cost, 0)), 0) as total_cost
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    LEFT JOIN products p ON si.product_id = p.id
    WHERE s.sale_date BETWEEN p_period_start AND p_period_end
      AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
    GROUP BY si.product_id
  )
  SELECT 
    id.product_id,
    id.product_name,
    id.sku,
    id.current_inventory * id.unit_cost as average_inventory,
    COALESCE(sd.total_cost, 0) as cost_of_goods_sold,
    CASE 
      WHEN id.current_inventory * id.unit_cost > 0 
      THEN COALESCE(sd.total_cost, 0) / (id.current_inventory * id.unit_cost)
      ELSE 0 
    END as turnover_ratio,
    CASE 
      WHEN id.current_inventory * id.unit_cost > 0 AND COALESCE(sd.total_cost, 0) > 0
      THEN ROUND((id.current_inventory * id.unit_cost / COALESCE(sd.total_cost, 1)) * (p_period_end - p_period_start))
      ELSE NULL
    END as days_supply
  FROM inventory_data id
  LEFT JOIN sales_data sd ON id.product_id = sd.product_id
  WHERE id.current_inventory > 0 OR COALESCE(sd.total_cost, 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data
INSERT INTO inventory_balance (
  product_id,
  location,
  quantity_on_hand,
  quantity_reserved,
  quantity_available,
  unit_cost,
  total_value,
  tenant_id
) SELECT 
  p.id,
  'Principal',
  CASE WHEN RANDOM() > 0.3 THEN (RANDOM() * 100)::integer ELSE 0 END,
  CASE WHEN RANDOM() > 0.7 THEN (RANDOM() * 20)::integer ELSE 0 END,
  CASE WHEN RANDOM() > 0.3 THEN (RANDOM() * 100)::integer ELSE 0 END - CASE WHEN RANDOM() > 0.7 THEN (RANDOM() * 20)::integer ELSE 0 END,
  p.cost,
  CASE WHEN RANDOM() > 0.3 THEN (RANDOM() * 100)::integer * p.cost ELSE 0 END,
  '00000000-0000-0000-0000-000000000001'
FROM products p
WHERE p.tenant_id = '00000000-0000-0000-0000-000000000001'
LIMIT 20;
