-- Enhanced Analytics Migration
-- Adds tables for advanced dashboard metrics and analytics
-- This migration only ADDS new features, doesn't modify existing data

-- Daily Analytics Summary
CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  new_clients INTEGER NOT NULL DEFAULT 0,
  average_ticket DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_products_sold INTEGER NOT NULL DEFAULT 0,
  unique_customers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Product Performance Analytics
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  views_count INTEGER NOT NULL DEFAULT 0,
  add_to_cart_count INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(product_id, date)
);

-- Client Analytics
CREATE TABLE IF NOT EXISTS client_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  average_ticket DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_purchase_at TIMESTAMP WITH TIME ZONE,
  visit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(client_id, date)
);

-- Quick Actions Log (for tracking dashboard usage)
CREATE TABLE IF NOT EXISTS quick_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'new_sale', 'add_product', 'add_client', 'view_reports'
  action_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tenant analytics" ON daily_analytics
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant product analytics" ON product_analytics
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant client analytics" ON client_analytics
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can insert their own quick actions" ON quick_actions_log
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_tenant ON daily_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_date ON product_analytics(product_id, date);
CREATE INDEX IF NOT EXISTS idx_product_analytics_tenant ON product_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_analytics_client_date ON client_analytics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_client_analytics_tenant ON client_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_user ON quick_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_tenant ON quick_actions_log(tenant_id);

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  daily_sales_count INTEGER;
  daily_revenue DECIMAL;
  daily_customers INTEGER;
  daily_products INTEGER;
  avg_ticket DECIMAL;
BEGIN
  -- Get today's sales data
  SELECT 
    COUNT(*) as sales_count,
    COALESCE(SUM(total_amount), 0) as revenue,
    COUNT(DISTINCT client_id) as customers,
    COALESCE(SUM(
      (SELECT COALESCE(SUM(quantity), 0) 
       FROM sale_items si 
       WHERE si.sale_id = s.id)
    ), 0) as products_sold
  INTO daily_sales_count, daily_revenue, daily_customers, daily_products
  FROM sales s 
  WHERE DATE(s.created_at) = target_date;
  
  -- Calculate average ticket
  avg_ticket := CASE 
    WHEN daily_sales_count > 0 THEN daily_revenue / daily_sales_count 
    ELSE 0 
  END;
  
  -- Insert or update daily analytics
  INSERT INTO daily_analytics (
    date, total_sales, total_revenue, unique_customers, 
    average_ticket, total_products_sold, tenant_id
  ) VALUES (
    target_date, daily_sales_count, daily_revenue, daily_customers,
    avg_ticket, daily_products, current_setting('app.current_tenant')::uuid
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    total_revenue = EXCLUDED.total_revenue,
    unique_customers = EXCLUDED.unique_customers,
    average_ticket = EXCLUDED.average_ticket,
    total_products_sold = EXCLUDED.total_products_sold,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log quick actions
CREATE OR REPLACE FUNCTION log_quick_action(action_type_param VARCHAR, action_path_param VARCHAR)
RETURNS UUID AS $$
DECLARE
  action_id UUID;
BEGIN
  INSERT INTO quick_actions_log (user_id, action_type, action_path, tenant_id)
  VALUES (
    auth.uid(), 
    action_type_param, 
    action_path_param,
    current_setting('app.current_tenant')::uuid
  )
  RETURNING id INTO action_id;
  
  RETURN action_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update analytics when sales are made
CREATE OR REPLACE FUNCTION trigger_update_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update today's analytics when a sale is inserted
  PERFORM update_daily_analytics(DATE(NEW.created_at));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_sale_insert_update_analytics ON sales;
CREATE TRIGGER on_sale_insert_update_analytics
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_analytics();

-- Initialize today's analytics if they don't exist
SELECT update_daily_analytics(CURRENT_DATE);

COMMENT ON TABLE daily_analytics IS 'Daily summary metrics for dashboard analytics';
COMMENT ON TABLE product_analytics IS 'Product performance tracking over time';
COMMENT ON TABLE client_analytics IS 'Customer behavior and purchase analytics';
COMMENT ON TABLE quick_actions_log IS 'Dashboard quick actions usage tracking';
