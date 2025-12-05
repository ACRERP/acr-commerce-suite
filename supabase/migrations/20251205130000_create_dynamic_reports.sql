-- Create dynamic reports tables
-- Migration: 20251205130000_create_dynamic_reports.sql

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('sales', 'financial', 'inventory', 'customer', 'product', 'custom')),
  data_source VARCHAR(50) NOT NULL CHECK (data_source IN ('sales', 'invoices', 'products', 'clients', 'financial_transactions', 'inventory')),
  query_definition JSONB NOT NULL,
  filters_config JSONB NOT NULL DEFAULT '[]',
  columns_config JSONB NOT NULL DEFAULT '[]',
  group_by_config JSONB,
  sort_config JSONB,
  chart_config JSONB,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create saved_reports table
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  filters_values JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  file_format VARCHAR(10) NOT NULL CHECK (file_format IN ('pdf', 'excel', 'csv')),
  file_size BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'expired')),
  error_message TEXT,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create report_schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  schedule_config JSONB NOT NULL,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  recipients JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create report_access_log table
CREATE TABLE IF NOT EXISTS report_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES saved_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('viewed', 'downloaded', 'shared', 'deleted')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_template_id ON saved_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_status ON saved_reports(status);
CREATE INDEX IF NOT EXISTS idx_saved_reports_created_at ON saved_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_reports_tenant_id ON saved_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_template_id ON report_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant_id ON report_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_access_log_report_id ON report_access_log(report_id);
CREATE INDEX IF NOT EXISTS idx_report_access_log_created_at ON report_access_log(created_at);

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_templates
CREATE POLICY "Users can view report templates for their tenant" ON report_templates
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert report templates for their tenant" ON report_templates
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update their own report templates" ON report_templates
  FOR UPDATE USING (created_by = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Admins can update any template in their tenant" ON report_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
      AND auth.users.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

CREATE POLICY "Users can delete their own report templates" ON report_templates
  FOR DELETE USING (created_by = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');

-- RLS Policies for saved_reports
CREATE POLICY "Users can view reports for their tenant" ON saved_reports
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert reports for their tenant" ON saved_reports
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update their own reports" ON saved_reports
  FOR UPDATE USING (created_by = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete their own reports" ON saved_reports
  FOR DELETE USING (created_by = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');

-- RLS Policies for report_schedules
CREATE POLICY "Users can view schedules for their tenant" ON report_schedules
  FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can insert schedules for their tenant" ON report_schedules
  FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can update their own schedules" ON report_schedules
  FOR UPDATE USING (created_by = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Users can delete their own schedules" ON report_schedules
  FOR DELETE USING (created_by = auth.uid() AND tenant_id = auth.jwt() ->> 'tenant_id');

-- RLS Policies for report_access_log
CREATE POLICY "Users can view access logs for their tenant" ON report_access_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM saved_reports 
      WHERE saved_reports.id = report_access_log.report_id 
      AND saved_reports.tenant_id = auth.jwt() ->> 'tenant_id'
    )
  );

CREATE POLICY "Users can insert access logs" ON report_access_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_report_templates_updated_at 
  BEFORE UPDATE ON report_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at 
  BEFORE UPDATE ON report_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate report
CREATE OR REPLACE FUNCTION generate_report(
  p_template_id UUID,
  p_filters_values JSONB DEFAULT '{}',
  p_file_format VARCHAR DEFAULT 'pdf',
  p_report_name VARCHAR DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  template_data JSONB;
  query_sql TEXT;
  result_data JSONB;
BEGIN
  -- Get template data
  SELECT row_to_json(t.*) INTO template_data
  FROM report_templates t
  WHERE t.id = p_template_id;
  
  -- Build query from template
  query_sql := build_dynamic_query(template_data ->> 'query_definition', p_filters_values);
  
  -- Execute query and get results
  EXECUTE 'SELECT json_agg(row_to_json(t.*)) FROM (' || query_sql || ') t'
  INTO result_data;
  
  -- Create saved report record
  INSERT INTO saved_reports (
    template_id,
    name,
    description,
    filters_values,
    file_format,
    status,
    tenant_id
  ) VALUES (
    p_template_id,
    COALESCE(p_report_name, template_data ->> 'name'),
    template_data ->> 'description',
    p_filters_values,
    p_file_format,
    'generating',
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO report_id;
  
  -- This would normally call an Edge Function to generate the file
  -- For now, we'll simulate the generation
  UPDATE saved_reports 
  SET 
    status = 'completed',
    file_url = '/reports/' || report_id || '.' || p_file_format,
    file_size = LENGTH(result_data::text),
    generated_at = NOW()
  WHERE id = report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to build dynamic query
CREATE OR REPLACE FUNCTION build_dynamic_query(
  query_definition JSONB,
  filters_values JSONB
)
RETURNS TEXT AS $$
DECLARE
  base_query TEXT;
  where_clause TEXT := '';
  group_clause TEXT := '';
  order_clause TEXT := '';
  final_query TEXT;
BEGIN
  -- Extract base query
  base_query := query_definition ->> 'base_query';
  
  -- Build WHERE clause from filters
  IF jsonb_typeof(filters_values) = 'object' AND jsonb_array_length(filters_values) > 0 THEN
    where_clause := ' WHERE ';
    
    -- This is a simplified version - real implementation would be more complex
    IF filters_values ? 'date_start' THEN
      where_clause := where_clause || 'date >= ''' || (filters_values ->> 'date_start') || '''';
    END IF;
    
    IF filters_values ? 'date_end' THEN
      IF length(where_clause) > 7 THEN
        where_clause := where_clause || ' AND ';
      END IF;
      where_clause := where_clause || 'date <= ''' || (filters_values ->> 'date_end') || '''';
    END IF;
  END IF;
  
  -- Add GROUP BY if specified
  IF query_definition ? 'group_by' THEN
    group_clause := ' GROUP BY ' || (query_definition ->> 'group_by');
  END IF;
  
  -- Add ORDER BY if specified
  IF query_definition ? 'order_by' THEN
    order_clause := ' ORDER BY ' || (query_definition ->> 'order_by');
  END IF;
  
  -- Build final query
  final_query := base_query || where_clause || group_clause || order_clause;
  
  RETURN final_query;
END;
$$ LANGUAGE plpgsql;

-- Sample report templates
INSERT INTO report_templates (
  id,
  name,
  description,
  report_type,
  data_source,
  query_definition,
  filters_config,
  columns_config,
  is_active,
  created_by,
  tenant_id
) VALUES
(
  gen_random_uuid(),
  'Vendas por Período',
  'Relatório de vendas filtrado por período',
  'sales',
  'sales',
  '{
    "base_query": "SELECT s.id, s.sale_date, c.name as client_name, s.total_amount, s.status FROM sales s LEFT JOIN clients c ON s.client_id = c.id",
    "group_by": "c.name, s.status",
    "order_by": "s.sale_date DESC"
  }',
  '[
    {
      "key": "date_start",
      "label": "Data Inicial",
      "type": "date",
      "required": true
    },
    {
      "key": "date_end",
      "label": "Data Final",
      "type": "date",
      "required": true
    },
    {
      "key": "status",
      "label": "Status",
      "type": "select",
      "options": ["pending", "completed", "cancelled"]
    }
  ]',
  '[
    {"key": "id", "label": "ID", "type": "text"},
    {"key": "sale_date", "label": "Data", "type": "date"},
    {"key": "client_name", "label": "Cliente", "type": "text"},
    {"key": "total_amount", "label": "Valor Total", "type": "currency"},
    {"key": "status", "label": "Status", "type": "badge"}
  ]',
  true,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
),
(
  gen_random_uuid(),
  'Relatório Financeiro',
  'Relatório de movimentações financeiras',
  'financial',
  'financial_transactions',
  '{
    "base_query": "SELECT ft.date, ft.description, ft.amount, ft.type, fc.name as category_name FROM financial_transactions ft LEFT JOIN financial_categories fc ON ft.category_id = fc.id",
    "order_by": "ft.date DESC"
  }',
  '[
    {
      "key": "date_start",
      "label": "Data Inicial",
      "type": "date",
      "required": true
    },
    {
      "key": "date_end",
      "label": "Data Final",
      "type": "date",
      "required": true
    },
    {
      "key": "type",
      "label": "Tipo",
      "type": "select",
      "options": ["income", "expense"]
    },
    {
      "key": "category_id",
      "label": "Categoria",
      "type": "select",
      "source": "financial_categories"
    }
  ]',
  '[
    {"key": "date", "label": "Data", "type": "date"},
    {"key": "description", "label": "Descrição", "type": "text"},
    {"key": "amount", "label": "Valor", "type": "currency"},
    {"key": "type", "label": "Tipo", "type": "badge"},
    {"key": "category_name", "label": "Categoria", "type": "text"}
  ]',
  true,
  (SELECT id FROM auth.users LIMIT 1),
  '00000000-0000-0000-0000-000000000001'
);
