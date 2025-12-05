-- Create sales reports tables
-- Migration: 20251205140000_create_sales_reports.sql

-- Create seller_performance table
CREATE TABLE IF NOT EXISTS seller_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  average_ticket DECIMAL(15,2) NOT NULL DEFAULT 0,
  commission_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  target_amount DECIMAL(15,2) DEFAULT 0,
  target_achievement DECIMAL(5,4) DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(seller_id, period_start, period_end)
);

-- Create sales_commission_rules table
CREATE TABLE IF NOT EXISTS sales_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  commission_type VARCHAR(20) NOT NULL CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_value DECIMAL(10,4) NOT NULL,
  tier_config JSONB,
  min_sales_amount DECIMAL(15,2) DEFAULT 0,
  max_sales_amount DECIMAL(15,2),
  product_categories TEXT[],
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create sales_leaderboard table
CREATE TABLE IF NOT EXISTS sales_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_sales DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER NOT NULL,
  previous_rank INTEGER,
  rank_change INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(period_type, period_start, period_end, seller_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seller_performance_seller_id ON seller_performance(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_performance_period ON seller_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_seller_performance_tenant_id ON seller_performance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_commission_rules_active ON sales_commission_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_commission_rules_tenant_id ON sales_commission_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_leaderboard_period ON sales_leaderboard(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_leaderboard_seller_id ON sales_leaderboard(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_leaderboard_tenant_id ON sales_leaderboard(tenant_id);

-- Enable RLS
ALTER TABLE seller_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view seller performance for their tenant" ON seller_performance
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert seller performance for their tenant" ON seller_performance
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update seller performance for their tenant" ON seller_performance
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete seller performance for their tenant" ON seller_performance
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view commission rules for their tenant" ON sales_commission_rules
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert commission rules for their tenant" ON sales_commission_rules
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update commission rules for their tenant" ON sales_commission_rules
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete commission rules for their tenant" ON sales_commission_rules
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view leaderboard for their tenant" ON sales_leaderboard
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert leaderboard for their tenant" ON sales_leaderboard
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update leaderboard for their tenant" ON sales_leaderboard
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete leaderboard for their tenant" ON sales_leaderboard
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Triggers for updated_at
CREATE TRIGGER update_seller_performance_updated_at 
  BEFORE UPDATE ON seller_performance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_commission_rules_updated_at 
  BEFORE UPDATE ON sales_commission_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate seller performance
CREATE OR REPLACE FUNCTION calculate_seller_performance(
  p_seller_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  total_sales DECIMAL;
  total_orders INTEGER;
  total_items INTEGER;
  average_ticket DECIMAL;
  commission_total DECIMAL;
  commission_rate DECIMAL;
  target_amount DECIMAL;
  target_achievement DECIMAL;
BEGIN
  -- Calculate sales metrics
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COUNT(s.id),
    COALESCE(SUM(s.total_items), 0),
    CASE WHEN COUNT(s.id) > 0 THEN COALESCE(SUM(s.total_amount), 0) / COUNT(s.id) ELSE 0 END
  INTO total_sales, total_orders, total_items, average_ticket
  FROM sales s
  WHERE s.seller_id = p_seller_id
    AND s.sale_date BETWEEN p_period_start AND p_period_end
    AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Get commission rate from rules
  SELECT COALESCE(MAX(cr.commission_value), 0)
  INTO commission_rate
  FROM sales_commission_rules cr
  WHERE cr.is_active = true
    AND cr.commission_type = 'percentage'
    AND (cr.min_sales_amount IS NULL OR total_sales >= cr.min_sales_amount)
    AND (cr.max_sales_amount IS NULL OR total_sales <= cr.max_sales_amount)
    AND cr.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Calculate commission
  commission_total := total_sales * (commission_rate / 100);
  
  -- Get target (simplified - in real implementation would come from goals table)
  target_amount := total_sales * 1.2; -- Example: 20% above current sales
  target_achievement := CASE WHEN target_amount > 0 THEN (total_sales / target_amount) * 100 ELSE 0 END;
  
  -- Upsert performance data
  INSERT INTO seller_performance (
    seller_id,
    period_start,
    period_end,
    total_sales,
    total_orders,
    total_items,
    average_ticket,
    commission_total,
    commission_rate,
    target_amount,
    target_achievement,
    tenant_id
  ) VALUES (
    p_seller_id,
    p_period_start,
    p_period_end,
    total_sales,
    total_orders,
    total_items,
    average_ticket,
    commission_total,
    commission_rate,
    target_amount,
    target_achievement,
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  )
  ON CONFLICT (seller_id, period_start, period_end)
  DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    total_orders = EXCLUDED.total_orders,
    total_items = EXCLUDED.total_items,
    average_ticket = EXCLUDED.average_ticket,
    commission_total = EXCLUDED.commission_total,
    commission_rate = EXCLUDED.commission_rate,
    target_amount = EXCLUDED.target_amount,
    target_achievement = EXCLUDED.target_achievement,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_sales_leaderboard(
  p_period_type VARCHAR,
  p_period_start DATE,
  p_period_end DATE,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  seller_record RECORD;
  rank_position INTEGER := 0;
  previous_period_start DATE;
  previous_period_end DATE;
BEGIN
  -- Calculate previous period for comparison
  CASE p_period_type
    WHEN 'daily' THEN
      previous_period_start := p_period_start - INTERVAL '1 day';
      previous_period_end := p_period_end - INTERVAL '1 day';
    WHEN 'weekly' THEN
      previous_period_start := p_period_start - INTERVAL '1 week';
      previous_period_end := p_period_end - INTERVAL '1 week';
    WHEN 'monthly' THEN
      previous_period_start := p_period_start - INTERVAL '1 month';
      previous_period_end := p_period_end - INTERVAL '1 month';
    WHEN 'quarterly' THEN
      previous_period_start := p_period_start - INTERVAL '3 months';
      previous_period_end := p_period_end - INTERVAL '3 months';
    WHEN 'yearly' THEN
      previous_period_start := p_period_start - INTERVAL '1 year';
      previous_period_end := p_period_end - INTERVAL '1 year';
  END CASE;
  
  -- Clear existing leaderboard for period
  DELETE FROM sales_leaderboard
  WHERE period_type = p_period_type
    AND period_start = p_period_start
    AND period_end = p_period_end
    AND tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Insert new rankings
  FOR seller_record IN
    SELECT 
      s.seller_id,
      COALESCE(SUM(s.total_amount), 0) as total_sales,
      COUNT(s.id) as total_orders
    FROM sales s
    WHERE s.sale_date BETWEEN p_period_start AND p_period_end
      AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
      AND s.seller_id IS NOT NULL
    GROUP BY s.seller_id
    ORDER BY total_sales DESC
  LOOP
    rank_position := rank_position + 1;
    
    INSERT INTO sales_leaderboard (
      period_type,
      period_start,
      period_end,
      seller_id,
      total_sales,
      total_orders,
      rank_position,
      previous_rank,
      rank_change,
      tenant_id
    ) VALUES (
      p_period_type,
      p_period_start,
      p_period_end,
      seller_record.seller_id,
      seller_record.total_sales,
      seller_record.total_orders,
      rank_position,
      (
        SELECT sl.rank_position 
        FROM sales_leaderboard sl
        WHERE sl.period_type = p_period_type
          AND sl.period_start = previous_period_start
          AND sl.period_end = previous_period_end
          AND sl.seller_id = seller_record.seller_id
      ),
      0, -- Will be calculated below
      COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
    );
  END LOOP;
  
  -- Update rank changes
  UPDATE sales_leaderboard sl1
  SET rank_change = sl1.rank_position - COALESCE(sl2.rank_position, sl1.rank_position)
  FROM sales_leaderboard sl2
  WHERE sl1.period_type = p_period_type
    AND sl1.period_start = p_period_start
    AND sl1.period_end = p_period_end
    AND sl2.period_type = p_period_type
    AND sl2.period_start = previous_period_start
    AND sl2.period_end = previous_period_end
    AND sl1.seller_id = sl2.seller_id
    AND sl1.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample commission rules
INSERT INTO sales_commission_rules (
  id,
  name,
  description,
  commission_type,
  commission_value,
  min_sales_amount,
  max_sales_amount,
  is_active,
  priority,
  created_by,
  tenant_id
) VALUES
(
  gen_random_uuid(),
  'Comissão Padrão',
  'Comissão básica de 5% sobre vendas',
  'percentage',
  5.0,
  0,
  10000,
  true,
  1,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Comissão Premium',
  'Comissão de 10% para vendas acima de R$ 10.000',
  'percentage',
  10.0,
  10000.01,
  NULL,
  true,
  2,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Comissão Elite',
  'Comissão de 15% para vendas acima de R$ 50.000',
  'percentage',
  15.0,
  50000.01,
  NULL,
  true,
  3,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
);
