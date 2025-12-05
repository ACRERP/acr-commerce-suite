-- Create financial transactions table
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('revenue', 'expense')),
  category_id UUID REFERENCES financial_categories(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  due_date DATE,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  attachment_url TEXT,
  recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20), -- daily, weekly, monthly, yearly
  recurring_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_category_id ON financial_transactions(category_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX idx_financial_transactions_company_id ON financial_transactions(company_id);
CREATE INDEX idx_financial_transactions_recurring ON financial_transactions(recurring);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view financial transactions of their company"
  ON financial_transactions FOR SELECT
  USING (company_id = auth.uid());

CREATE POLICY "Users can insert financial transactions for their company"
  ON financial_transactions FOR INSERT
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can update financial transactions of their company"
  ON financial_transactions FOR UPDATE
  USING (company_id = auth.uid());

CREATE POLICY "Users can delete financial transactions of their company"
  ON financial_transactions FOR DELETE
  USING (company_id = auth.uid());

-- Create financial reports table
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- dre, cash_flow, balance_sheet, etc.
  description TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  configuration JSONB, -- Report configuration and filters
  data JSONB, -- Generated report data
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'published')),
  file_url TEXT, -- PDF/Excel export URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_financial_reports_type ON financial_reports(type);
CREATE INDEX idx_financial_reports_period ON financial_reports(period_start, period_end);
CREATE INDEX idx_financial_reports_company_id ON financial_reports(company_id);
CREATE INDEX idx_financial_reports_status ON financial_reports(status);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON financial_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view financial reports of their company"
  ON financial_reports FOR SELECT
  USING (company_id = auth.uid());

CREATE POLICY "Users can insert financial reports for their company"
  ON financial_reports FOR INSERT
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can update financial reports of their company"
  ON financial_reports FOR UPDATE
  USING (company_id = auth.uid());

CREATE POLICY "Users can delete financial reports of their company"
  ON financial_reports FOR DELETE
  USING (company_id = auth.uid());

-- Insert sample transactions for demonstration
INSERT INTO financial_transactions (
  description, amount, type, category_id, date, status, company_id
) VALUES
-- Revenue transactions
('Venda de Produto - Notebook Dell', 5000.00, 'revenue', 
 (SELECT id FROM financial_categories WHERE name = 'Vendas de Produtos' LIMIT 1), 
 '2025-01-15', 'paid', '00000000-0000-0000-0000-000000000000'),

('Venda de Serviço - Consultoria', 2500.00, 'revenue',
 (SELECT id FROM financial_categories WHERE name = 'Vendas de Serviços' LIMIT 1),
 '2025-01-20', 'paid', '00000000-0000-0000-0000-000000000000'),

('Rendimento de Aplicação', 150.00, 'revenue',
 (SELECT id FROM financial_categories WHERE name = 'Receitas Financeiras' LIMIT 1),
 '2025-01-25', 'paid', '00000000-0000-0000-0000-000000000000'),

-- Expense transactions
('Aluguel do Escritório', 2000.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Aluguel' LIMIT 1),
 '2025-01-05', 'paid', '00000000-0000-0000-0000-000000000000'),

('Salários - Janeiro', 8000.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Salários' LIMIT 1),
 '2025-01-10', 'paid', '00000000-0000-0000-0000-000000000000'),

('Compra de Material de Escritório', 250.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Material de Escritório' LIMIT 1),
 '2025-01-12', 'paid', '00000000-0000-0000-0000-000000000000'),

('Conta de Luz', 350.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Utilidades' LIMIT 1),
 '2025-01-15', 'paid', '00000000-0000-0000-0000-000000000000'),

('Internet e Telefone', 200.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Utilidades' LIMIT 1),
 '2025-01-15', 'paid', '00000000-0000-0000-0000-000000000000'),

('Marketing Digital', 500.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Marketing' LIMIT 1),
 '2025-01-18', 'paid', '00000000-0000-0000-0000-000000000000'),

('Taxa Bancária', 25.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Despesas Bancárias' LIMIT 1),
 '2025-01-20', 'paid', '00000000-0000-0000-0000-000000000000'),

-- February transactions
('Venda de Produto - iPhone', 4000.00, 'revenue',
 (SELECT id FROM financial_categories WHERE name = 'Vendas de Produtos' LIMIT 1),
 '2025-02-10', 'paid', '00000000-0000-0000-0000-000000000000'),

('Aluguel do Escritório', 2000.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Aluguel' LIMIT 1),
 '2025-02-05', 'paid', '00000000-0000-0000-0000-000000000000'),

('Salários - Fevereiro', 8000.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Salários' LIMIT 1),
 '2025-02-10', 'paid', '00000000-0000-0000-0000-000000000000'),

('Conta de Luz', 320.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Utilidades' LIMIT 1),
 '2025-02-15', 'paid', '00000000-0000-0000-0000-000000000000'),

('Internet e Telefone', 200.00, 'expense',
 (SELECT id FROM financial_categories WHERE name = 'Utilidades' LIMIT 1),
 '2025-02-15', 'paid', '00000000-0000-0000-0000-000000000000');
