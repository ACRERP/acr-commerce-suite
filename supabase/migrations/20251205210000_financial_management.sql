-- Financial Management Migration
-- Adds cash flow tracking, expense management, bank reconciliation
-- This migration only ADDS new features, preserves all existing data

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'DollarSign',
  color VARCHAR(20) DEFAULT 'red',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'dinheiro', 'transferencia', 'cartao', 'pix', 'cheque'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
  receipt_url VARCHAR(500),
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'conta_corrente', 'poupanca', 'investimento'
  account_number VARCHAR(50) NOT NULL,
  agency VARCHAR(20),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'BRL',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'transfer', 'payment_received', 'payment_made'
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  reference_number VARCHAR(100),
  category VARCHAR(100),
  reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  related_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Cash Flow Summary
CREATE TABLE IF NOT EXISTS cash_flow_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_income DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_expenses DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  net_cash_flow DECIMAL(15,2) GENERATED ALWAYS AS (total_income - total_expenses) STORED,
  closing_balance DECIMAL(15,2) GENERATED ALWAYS AS (opening_balance + net_cash_flow) STORED,
  sales_count INTEGER DEFAULT 0,
  expenses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Financial Reports
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL, -- 'p&l', 'balance_sheet', 'cash_flow', 'expenses'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  report_data JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Budget Management
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (budget_amount - spent_amount) STORED,
  period_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Add financial columns to existing tables
ALTER TABLE sales ADD COLUMN IF NOT EXISTS bank_transaction_id UUID REFERENCES bank_transactions(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_flow_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED;

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tenant expense categories" ON expense_categories
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant expense categories" ON expense_categories
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant expenses" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant expenses" ON expenses
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant bank accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant bank accounts" ON bank_accounts
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant bank transactions" ON bank_transactions
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant bank transactions" ON bank_transactions
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant cash flow" ON cash_flow_summary
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant cash flow" ON cash_flow_summary
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant financial reports" ON financial_reports
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant financial reports" ON financial_reports
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can view their own tenant budgets" ON budgets
  FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY "Users can manage their own tenant budgets" ON budgets
  FOR ALL USING (auth.uid() IS NOT NULL AND tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_tenant ON bank_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_summary_date ON cash_flow_summary(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_summary_tenant ON cash_flow_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant ON budgets(tenant_id);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, icon, color, tenant_id) VALUES
('Aluguel', 'Despesas com aluguel do estabelecimento', 'Home', 'blue', current_setting('app.current_tenant')::uuid),
('Água e Luz', 'Contas de água, luz e gás', 'Zap', 'cyan', current_setting('app.current_tenant')::uuid),
('Telefone e Internet', 'Contas de telefone e internet', 'Wifi', 'green', current_setting('app.current_tenant')::uuid),
('Funcionários', 'Salários e benefícios dos funcionários', 'Users', 'purple', current_setting('app.current_tenant')::uuid),
('Fornecedores', 'Pagamentos a fornecedores', 'Truck', 'orange', current_setting('app.current_tenant')::uuid),
('Marketing', 'Despesas com marketing e publicidade', 'Megaphone', 'pink', current_setting('app.current_tenant')::uuid),
('Impostos', 'Pagamentos de impostos e taxas', 'FileText', 'red', current_setting('app.current_tenant')::uuid),
('Manutenção', 'Manutenção de equipamentos e instalações', 'Wrench', 'gray', current_setting('app.current_tenant')::uuid),
('Material de Escritório', 'Suprimentos para escritório', 'Package', 'indigo', current_setting('app.current_tenant')::uuid),
('Transporte', 'Despesas com transporte e combustível', 'Car', 'yellow', current_setting('app.current_tenant')::uuid)
ON CONFLICT DO NOTHING;

-- Function to update cash flow summary
CREATE OR REPLACE FUNCTION update_cash_flow_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  opening_balance DECIMAL(15,2) := 0;
  total_income DECIMAL(15,2) := 0;
  total_expenses DECIMAL(15,2) := 0;
  sales_count INTEGER := 0;
  expenses_count INTEGER := 0;
  previous_date DATE;
BEGIN
  -- Get previous day's closing balance
  previous_date := target_date - INTERVAL '1 day';
  
  SELECT closing_balance INTO opening_balance
  FROM cash_flow_summary
  WHERE date = previous_date;
  
  -- Calculate today's income from sales
  SELECT 
    COALESCE(SUM(total_amount), 0),
    COUNT(*)
  INTO total_income, sales_count
  FROM sales
  WHERE DATE(created_at) = target_date
    AND status = 'concluida';
  
  -- Calculate today's expenses
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO total_expenses, expenses_count
  FROM expenses
  WHERE expense_date = target_date
    AND status IN ('approved', 'paid');
  
  -- Insert or update cash flow summary
  INSERT INTO cash_flow_summary (
    date, opening_balance, total_income, total_expenses,
    sales_count, expenses_count, tenant_id
  ) VALUES (
    target_date, opening_balance, total_income, total_expenses,
    sales_count, expenses_count, current_setting('app.current_tenant')::uuid
  )
  ON CONFLICT (date) DO UPDATE SET
    opening_balance = EXCLUDED.opening_balance,
    total_income = EXCLUDED.total_income,
    total_expenses = EXCLUDED.total_expenses,
    sales_count = EXCLUDED.sales_count,
    expenses_count = EXCLUDED.expenses_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create bank transaction from sale
CREATE OR REPLACE FUNCTION create_sale_transaction(sale_id_param INTEGER, bank_account_id_param UUID)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  sale_data RECORD;
BEGIN
  -- Get sale data
  SELECT total_amount, created_at INTO sale_data
  FROM sales
  WHERE id = sale_id_param;
  
  -- Create bank transaction
  INSERT INTO bank_transactions (
    bank_account_id, transaction_type, amount, description,
    transaction_date, reference_number, related_sale_id, tenant_id
  ) VALUES (
    bank_account_id_param, 'payment_received', sale_data.total_amount,
    'Venda #' || sale_id_param, DATE(sale_data.created_at),
    'SALE-' || sale_id_param, sale_id_param,
    current_setting('app.current_tenant')::uuid
  )
  RETURNING id INTO transaction_id;
  
  -- Update sale with transaction reference
  UPDATE sales
  SET bank_transaction_id = transaction_id
  WHERE id = sale_id_param;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create bank transaction from expense
CREATE OR REPLACE FUNCTION create_expense_transaction(expense_id_param UUID, bank_account_id_param UUID)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  expense_data RECORD;
BEGIN
  -- Get expense data
  SELECT amount, description, expense_date INTO expense_data
  FROM expenses
  WHERE id = expense_id_param;
  
  -- Create bank transaction
  INSERT INTO bank_transactions (
    bank_account_id, transaction_type, amount, description,
    transaction_date, reference_number, related_expense_id, tenant_id
  ) VALUES (
    bank_account_id_param, 'payment_made', expense_data.amount,
    'Despesa: ' || expense_data.description, expense_data.expense_date,
    'EXP-' || substr(expense_id_param::text, 1, 8), expense_id_param,
    current_setting('app.current_tenant')::uuid
  )
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update cash flow
CREATE TRIGGER on_sale_insert_update_cash_flow
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_flow_summary(DATE(NEW.created_at));

CREATE TRIGGER on_expense_insert_update_cash_flow
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_flow_summary(NEW.expense_date);

-- Initialize today's cash flow
SELECT update_cash_flow_summary(CURRENT_DATE);

COMMENT ON TABLE expense_categories IS 'Categories for organizing expenses';
COMMENT ON TABLE expenses IS 'Business expense tracking and management';
COMMENT ON TABLE bank_accounts IS 'Bank accounts for financial management';
COMMENT ON TABLE bank_transactions IS 'All bank transactions for reconciliation';
COMMENT ON TABLE cash_flow_summary IS 'Daily cash flow summary';
COMMENT ON TABLE financial_reports IS 'Generated financial reports';
COMMENT ON TABLE budgets IS 'Budget planning and tracking';
