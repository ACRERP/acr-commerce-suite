-- Create ABC analysis tables
-- Migration: 20251205150000_create_abc_analysis.sql

-- Create abc_analysis table
CREATE TABLE IF NOT EXISTS abc_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(100),
  product_category VARCHAR(100),
  total_quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  profit_margin DECIMAL(5,4) NOT NULL DEFAULT 0,
  cumulative_revenue_percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
  cumulative_quantity_percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
  abc_class VARCHAR(1) NOT NULL CHECK (abc_class IN ('A', 'B', 'C')),
  rank_position INTEGER NOT NULL,
  total_products INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(product_id, analysis_date)
);

-- Create abc_analysis_summary table
CREATE TABLE IF NOT EXISTS abc_analysis_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_products INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
  class_a_products INTEGER NOT NULL DEFAULT 0,
  class_a_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  class_a_percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
  class_b_products INTEGER NOT NULL DEFAULT 0,
  class_b_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  class_b_percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
  class_c_products INTEGER NOT NULL DEFAULT 0,
  class_c_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
  class_c_percentage DECIMAL(5,4) NOT NULL DEFAULT 0,
  analysis_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(analysis_date)
);

-- Create abc_analysis_config table
CREATE TABLE IF NOT EXISTS abc_analysis_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  class_a_threshold DECIMAL(5,4) NOT NULL DEFAULT 80.0,
  class_b_threshold DECIMAL(5,4) NOT NULL DEFAULT 95.0,
  analysis_type VARCHAR(20) NOT NULL CHECK (analysis_type IN ('revenue', 'quantity', 'profit')),
  min_period_days INTEGER DEFAULT 30,
  exclude_inactive BOOLEAN DEFAULT true,
  category_filters TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_abc_analysis_date ON abc_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_period ON abc_analysis(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_product_id ON abc_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_class ON abc_analysis(abc_class);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_rank ON abc_analysis(rank_position);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_tenant_id ON abc_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_summary_date ON abc_analysis_summary(analysis_date);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_summary_tenant_id ON abc_analysis_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_config_tenant_id ON abc_analysis_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_config_active ON abc_analysis_config(is_active);

-- Enable RLS
ALTER TABLE abc_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE abc_analysis_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE abc_analysis_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ABC analysis for their tenant" ON abc_analysis
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert ABC analysis for their tenant" ON abc_analysis
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update ABC analysis for their tenant" ON abc_analysis
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete ABC analysis for their tenant" ON abc_analysis
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view ABC summary for their tenant" ON abc_analysis_summary
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert ABC summary for their tenant" ON abc_analysis_summary
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update ABC summary for their tenant" ON abc_analysis_summary
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete ABC summary for their tenant" ON abc_analysis_summary
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can view ABC config for their tenant" ON abc_analysis_config
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert ABC config for their tenant" ON abc_analysis_config
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update ABC config for their tenant" ON abc_analysis_config
  FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete ABC config for their tenant" ON abc_analysis_config
  FOR DELETE USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Triggers for updated_at
CREATE TRIGGER update_abc_analysis_updated_at 
  BEFORE UPDATE ON abc_analysis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abc_analysis_summary_updated_at 
  BEFORE UPDATE ON abc_analysis_summary 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abc_analysis_config_updated_at 
  BEFORE UPDATE ON abc_analysis_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to perform ABC analysis
CREATE OR REPLACE FUNCTION perform_abc_analysis(
  p_period_start DATE,
  p_period_end DATE,
  p_analysis_type VARCHAR DEFAULT 'revenue',
  p_class_a_threshold DECIMAL DEFAULT 80.0,
  p_class_b_threshold DECIMAL DEFAULT 95.0,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  analysis_id UUID;
  total_revenue DECIMAL;
  total_quantity DECIMAL;
  current_analysis_date DATE := CURRENT_DATE;
  rank_counter INTEGER := 0;
  cumulative_revenue DECIMAL := 0;
  cumulative_quantity DECIMAL := 0;
  product_record RECORD;
  summary_id UUID;
BEGIN
  -- Delete existing analysis for the same date
  DELETE FROM abc_analysis 
  WHERE analysis_date = current_analysis_date
    AND tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  DELETE FROM abc_analysis_summary 
  WHERE analysis_date = current_analysis_date
    AND tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  -- Get total values for calculations
  CASE p_analysis_type
    WHEN 'revenue' THEN
      SELECT COALESCE(SUM(si.quantity * si.price), 0), COALESCE(SUM(si.quantity), 0)
      INTO total_revenue, total_quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN p_period_start AND p_period_end
        AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
    WHEN 'quantity' THEN
      SELECT COALESCE(SUM(si.quantity * si.price), 0), COALESCE(SUM(si.quantity), 0)
      INTO total_revenue, total_quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.sale_date BETWEEN p_period_start AND p_period_end
        AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
    WHEN 'profit' THEN
      SELECT COALESCE(SUM(si.quantity * (si.price - COALESCE(p.cost, 0))), 0), COALESCE(SUM(si.quantity), 0)
      INTO total_revenue, total_quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.sale_date BETWEEN p_period_start AND p_period_end
        AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  END CASE;
  
  -- Insert analysis for each product
  FOR product_record IN
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.sku as product_sku,
      c.name as product_category,
      COALESCE(SUM(si.quantity), 0) as total_quantity,
      COALESCE(SUM(si.quantity * si.price), 0) as total_revenue,
      COALESCE(SUM(si.quantity * COALESCE(p.cost, 0)), 0) as total_cost
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN sale_items si ON p.id = si.product_id
    LEFT JOIN sales s ON si.sale_id = s.id
      AND s.sale_date BETWEEN p_period_start AND p_period_end
      AND s.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
    WHERE p.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
      AND (p.is_active = true OR EXISTS (SELECT 1 FROM sale_items si2 WHERE si2.product_id = p.id))
    GROUP BY p.id, p.name, p.sku, c.name
    ORDER BY 
      CASE p_analysis_type
        WHEN 'revenue' THEN COALESCE(SUM(si.quantity * si.price), 0)
        WHEN 'quantity' THEN COALESCE(SUM(si.quantity), 0)
        WHEN 'profit' THEN COALESCE(SUM(si.quantity * (si.price - COALESCE(p.cost, 0))), 0)
      END DESC
  LOOP
    rank_counter := rank_counter + 1;
    cumulative_revenue := cumulative_revenue + product_record.total_revenue;
    cumulative_quantity := cumulative_quantity + product_record.total_quantity;
    
    -- Calculate ABC class
    INSERT INTO abc_analysis (
      analysis_date,
      period_start,
      period_end,
      product_id,
      product_name,
      product_sku,
      product_category,
      total_quantity,
      total_revenue,
      total_cost,
      profit_margin,
      cumulative_revenue_percentage,
      cumulative_quantity_percentage,
      abc_class,
      rank_position,
      total_products,
      tenant_id
    ) VALUES (
      current_analysis_date,
      p_period_start,
      p_period_end,
      product_record.product_id,
      product_record.product_name,
      product_record.product_sku,
      product_record.product_category,
      product_record.total_quantity,
      product_record.total_revenue,
      product_record.total_cost,
      CASE WHEN product_record.total_revenue > 0 
        THEN ((product_record.total_revenue - product_record.total_cost) / product_record.total_revenue) * 100 
        ELSE 0 END,
      CASE WHEN total_revenue > 0 THEN (cumulative_revenue / total_revenue) * 100 ELSE 0 END,
      CASE WHEN total_quantity > 0 THEN (cumulative_quantity / total_quantity) * 100 ELSE 0 END,
      CASE 
        WHEN (cumulative_revenue / total_revenue) * 100 <= p_class_a_threshold THEN 'A'
        WHEN (cumulative_revenue / total_revenue) * 100 <= p_class_b_threshold THEN 'B'
        ELSE 'C'
      END,
      rank_counter,
      rank_counter,
      COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
    );
  END LOOP;
  
  -- Create summary
  INSERT INTO abc_analysis_summary (
    analysis_date,
    period_start,
    period_end,
    total_products,
    total_revenue,
    total_quantity,
    class_a_products,
    class_a_revenue,
    class_a_percentage,
    class_b_products,
    class_b_revenue,
    class_b_percentage,
    class_c_products,
    class_c_revenue,
    class_c_percentage,
    analysis_config,
    tenant_id
  ) SELECT
    current_analysis_date,
    p_period_start,
    p_period_end,
    COUNT(*),
    SUM(total_revenue),
    SUM(total_quantity),
    COUNT(*) FILTER (WHERE abc_class = 'A'),
    SUM(total_revenue) FILTER (WHERE abc_class = 'A'),
    (SUM(total_revenue) FILTER (WHERE abc_class = 'A') / SUM(total_revenue)) * 100,
    COUNT(*) FILTER (WHERE abc_class = 'B'),
    SUM(total_revenue) FILTER (WHERE abc_class = 'B'),
    (SUM(total_revenue) FILTER (WHERE abc_class = 'B') / SUM(total_revenue)) * 100,
    COUNT(*) FILTER (WHERE abc_class = 'C'),
    SUM(total_revenue) FILTER (WHERE abc_class = 'C'),
    (SUM(total_revenue) FILTER (WHERE abc_class = 'C') / SUM(total_revenue)) * 100,
    json_build_object(
      'analysis_type', p_analysis_type,
      'class_a_threshold', p_class_a_threshold,
      'class_b_threshold', p_class_b_threshold
    ),
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  FROM abc_analysis
  WHERE analysis_date = current_analysis_date
    AND tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id');
  
  RETURN current_analysis_date::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ABC recommendations
CREATE OR REPLACE FUNCTION get_abc_recommendations(
  p_analysis_date DATE DEFAULT CURRENT_DATE,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE(
  recommendation_type VARCHAR,
  product_id UUID,
  product_name VARCHAR,
  current_class VARCHAR,
  suggested_action VARCHAR,
  priority VARCHAR,
  reasoning TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH analysis_data AS (
    SELECT 
      aa.*,
      aas.class_a_percentage,
      aas.class_b_percentage,
      aas.total_revenue as total_period_revenue
    FROM abc_analysis aa
    JOIN abc_analysis_summary aas ON aa.analysis_date = aas.analysis_date
    WHERE aa.analysis_date = p_analysis_date
      AND aa.tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  )
  SELECT
    CASE 
      WHEN abc_class = 'A' AND profit_margin < 10 THEN 'MARGEM_BAIXA'
      WHEN abc_class = 'B' AND profit_margin > 20 THEN 'PROMOVER_A'
      WHEN abc_class = 'C' AND total_revenue > 0 THEN 'ANALISAR_C'
      WHEN abc_class = 'C' AND total_revenue = 0 THEN 'DESCONTINUAR'
      WHEN cumulative_revenue_percentage > 80 AND abc_class = 'B' THEN 'PROMOVER_A'
      ELSE 'MANUTENCAO'
    END as recommendation_type,
    product_id,
    product_name,
    abc_class,
    CASE 
      WHEN abc_class = 'A' AND profit_margin < 10 THEN 'Reajustar preço ou negociar com fornecedor'
      WHEN abc_class = 'B' AND profit_margin > 20 THEN 'Considerar promoção para classe A'
      WHEN abc_class = 'C' AND total_revenue > 0 THEN 'Analisar viabilidade e estratégia'
      WHEN abc_class = 'C' AND total_revenue = 0 THEN 'Considerar descontinuação'
      WHEN cumulative_revenue_percentage > 80 AND abc_class = 'B' THEN 'Monitorar para possível promoção'
      ELSE 'Manter estratégia atual'
    END as suggested_action,
    CASE 
      WHEN abc_class = 'A' AND profit_margin < 10 THEN 'ALTA'
      WHEN abc_class = 'C' AND total_revenue = 0 THEN 'ALTA'
      WHEN abc_class = 'B' AND profit_margin > 20 THEN 'MEDIA'
      ELSE 'BAIXA'
    END as priority,
    CASE 
      WHEN abc_class = 'A' AND profit_margin < 10 THEN 'Produto importante com margem abaixo do ideal'
      WHEN abc_class = 'B' AND profit_margin > 20 THEN 'Produto com bom desempenho e margem atrativa'
      WHEN abc_class = 'C' AND total_revenue > 0 THEN 'Produto com baixa participação na receita'
      WHEN abc_class = 'C' AND total_revenue = 0 THEN 'Produto sem vendas no período'
      WHEN cumulative_revenue_percentage > 80 AND abc_class = 'B' THEN 'Produto próximo da classe A'
      ELSE 'Produto com desempenho estável'
    END as reasoning
  FROM analysis_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample configuration
INSERT INTO abc_analysis_config (
  id,
  name,
  description,
  class_a_threshold,
  class_b_threshold,
  analysis_type,
  min_period_days,
  exclude_inactive,
  is_active,
  is_default,
  created_by,
  tenant_id
) VALUES
(
  gen_random_uuid(),
  'Configuração Padrão',
  'Análise ABC padrão baseada em receita',
  80.0,
  95.0,
  'revenue',
  30,
  true,
  true,
  true,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Análise por Quantidade',
  'Análise ABC baseada em quantidade vendida',
  80.0,
  95.0,
  'quantity',
  30,
  true,
  false,
  false,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Análise por Lucratividade',
  'Análise ABC baseada na margem de lucro',
  80.0,
  95.0,
  'profit',
  30,
  true,
  false,
  false,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
);
