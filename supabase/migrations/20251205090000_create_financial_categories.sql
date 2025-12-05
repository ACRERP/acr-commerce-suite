-- Create financial categories table
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('revenue', 'expense', 'asset', 'liability')),
  parent_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color code
  icon VARCHAR(50) DEFAULT 'folder',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_financial_categories_type ON financial_categories(type);
CREATE INDEX idx_financial_categories_parent_id ON financial_categories(parent_id);
CREATE INDEX idx_financial_categories_company_id ON financial_categories(company_id);
CREATE INDEX idx_financial_categories_active ON financial_categories(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_categories_updated_at
  BEFORE UPDATE ON financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view financial categories of their company"
  ON financial_categories FOR SELECT
  USING (company_id = auth.uid());

CREATE POLICY "Users can insert financial categories for their company"
  ON financial_categories FOR INSERT
  WITH CHECK (company_id = auth.uid());

CREATE POLICY "Users can update financial categories of their company"
  ON financial_categories FOR UPDATE
  USING (company_id = auth.uid());

CREATE POLICY "Users can delete financial categories of their company"
  ON financial_categories FOR DELETE
  USING (company_id = auth.uid());

-- Insert default categories
INSERT INTO financial_categories (name, description, type, color, icon, company_id) VALUES
-- Revenue Categories
('Vendas de Produtos', 'Receita da venda de mercadorias', 'revenue', '#10B981', 'shopping-cart', '00000000-0000-0000-0000-000000000000'),
('Vendas de Serviços', 'Receita da prestação de serviços', 'revenue', '#3B82F6', 'briefcase', '00000000-0000-0000-0000-000000000000'),
('Receitas Financeiras', 'Rendimentos de aplicações e juros', 'revenue', '#8B5CF6', 'trending-up', '00000000-0000-0000-0000-000000000000'),
('Outras Receitas', 'Receitas não operacionais', 'revenue', '#06B6D4', 'plus-circle', '00000000-0000-0000-0000-000000000000'),

-- Expense Categories
('Custo de Mercadorias', 'Custo dos produtos vendidos', 'expense', '#EF4444', 'package', '00000000-0000-0000-0000-000000000000'),
('Aluguel', 'Despesas com locação de imóveis', 'expense', '#F59E0B', 'home', '00000000-0000-0000-0000-000000000000'),
('Salários', 'Pagamento de salários e benefícios', 'expense', '#F97316', 'users', '00000000-0000-0000-0000-000000000000'),
('Serviços Terceiros', 'Contratação de serviços externos', 'expense', '#EC4899', 'wrench', '00000000-0000-0000-0000-000000000000'),
('Impostos', 'Pagamento de tributos e taxas', 'expense', '#DC2626', 'file-text', '00000000-0000-0000-0000-000000000000'),
('Marketing', 'Despesas com marketing e publicidade', 'expense', '#7C3AED', 'megaphone', '00000000-0000-0000-0000-000000000000'),
('Transporte', 'Despesas com transporte e entregas', 'expense', '#0891B2', 'truck', '00000000-0000-0000-0000-000000000000'),
('Utilidades', 'Água, luz, telefone, internet', 'expense', '#059669', 'zap', '00000000-0000-0000-0000-000000000000'),
('Material de Escritório', 'Suprimentos e materiais de escritório', 'expense', '#84CC16', 'paperclip', '00000000-0000-0000-0000-000000000000'),
('Despesas Bancárias', 'Tarifas e serviços bancários', 'expense', '#6366F1', 'credit-card', '00000000-0000-0000-0000-000000000000'),

-- Asset Categories
('Caixa e Bancos', 'Dinheiro em caixa e contas bancárias', 'asset', '#0EA5E9', 'dollar-sign', '00000000-0000-0000-0000-000000000000'),
('Contas a Receber', 'Valores a receber de clientes', 'asset', '#14B8A6', 'arrow-down-left', '00000000-0000-0000-0000-000000000000'),
('Estoque', 'Produtos em estoque', 'asset', '#22C55E', 'package', '00000000-0000-0000-0000-000000000000'),
('Imobilizado', 'Equipamentos e veículos', 'asset', '#A855F7', 'truck', '00000000-0000-0000-0000-000000000000'),

-- Liability Categories
('Fornecedores', 'Contas a pagar a fornecedores', 'liability', '#F43F5E', 'arrow-up-right', '00000000-0000-0000-0000-000000000000'),
('Empréstimos', 'Financiamentos e empréstimos', 'liability', '#E11D48', 'briefcase', '00000000-0000-0000-0000-000000000000'),
('Salários a Pagar', 'Salários e encargos pendentes', 'liability', '#DC2626', 'users', '00000000-0000-0000-0000-000000000000'),
('Impostos a Pagar', 'Tributos pendentes de pagamento', 'liability', '#B91C1C', 'file-text', '00000000-0000-0000-0000-000000000000');

-- Create subcategories for some main categories
-- Subcategories for Custo de Mercadorias
INSERT INTO financial_categories (name, description, type, parent_id, color, icon, company_id)
SELECT 
  'Matéria-Prima', 
  'Custo de matérias-primas', 
  'expense', 
  id, 
  '#DC2626', 
  'package', 
  '00000000-0000-0000-0000-000000000000'
FROM financial_categories 
WHERE name = 'Custo de Mercadorias' AND company;
