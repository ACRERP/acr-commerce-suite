-- Create bank accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment')),
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create bank statements table
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL,
  closing_balance DECIMAL(15,2) NOT NULL,
  total_credits DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_debits DECIMAL(15,2) NOT NULL DEFAULT 0,
  file_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'reconciled', 'error')),
  processed_at TIMESTAMP WITH TIME ZONE,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create bank statement transactions table
CREATE TABLE IF NOT EXISTS bank_statement_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  reference_number VARCHAR(100),
  category_code VARCHAR(50),
  balance_after_transaction DECIMAL(15,2),
  reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'unmatched' CHECK (reconciliation_status IN ('unmatched', 'matched', 'manual', 'ignored')),
  matched_transaction_id UUID REFERENCES financial_transactions(id),
  confidence_score DECIMAL(3,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Create reconciliation rules table
CREATE TABLE IF NOT EXISTS reconciliation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('description_match', 'amount_match', 'date_match', 'reference_match')),
  pattern TEXT NOT NULL,
  match_threshold DECIMAL(3,2) DEFAULT 0.8,
  category_id UUID REFERENCES financial_categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL
);

-- Create reconciliation logs table
CREATE TABLE IF NOT EXISTS reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_statement_id UUID REFERENCES bank_statements(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Create indexes
CREATE INDEX idx_bank_accounts_tenant_id ON bank_accounts(tenant_id);
CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);
CREATE INDEX idx_bank_statements_bank_account_id ON bank_statements(bank_account_id);
CREATE INDEX idx_bank_statements_statement_date ON bank_statements(statement_date);
CREATE INDEX idx_bank_statements_status ON bank_statements(status);
CREATE INDEX idx_bank_statement_transactions_statement_id ON bank_statement_transactions(bank_statement_id);
CREATE INDEX idx_bank_statement_transactions_date ON bank_statement_transactions(transaction_date);
CREATE INDEX idx_bank_statement_transactions_status ON bank_statement_transactions(reconciliation_status);
CREATE INDEX idx_bank_statement_transactions_matched_id ON bank_statement_transactions(matched_transaction_id);
CREATE INDEX idx_reconciliation_rules_tenant_id ON reconciliation_rules(tenant_id);
CREATE INDEX idx_reconciliation_rules_is_active ON reconciliation_rules(is_active);
CREATE INDEX idx_reconciliation_logs_statement_id ON reconciliation_logs(bank_statement_id);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view bank accounts from their tenant" ON bank_accounts
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert bank accounts from their tenant" ON bank_accounts
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update bank accounts from their tenant" ON bank_accounts
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can delete bank accounts from their tenant" ON bank_accounts
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- RLS Policies for bank_statements
CREATE POLICY "Users can view bank statements from their tenant" ON bank_statements
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert bank statements from their tenant" ON bank_statements
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update bank statements from their tenant" ON bank_statements
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can delete bank statements from their tenant" ON bank_statements
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- RLS Policies for bank_statement_transactions
CREATE POLICY "Users can view bank statement transactions from their tenant" ON bank_statement_transactions
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert bank statement transactions from their tenant" ON bank_statement_transactions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update bank statement transactions from their tenant" ON bank_statement_transactions
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can delete bank statement transactions from their tenant" ON bank_statement_transactions
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- RLS Policies for reconciliation_rules
CREATE POLICY "Users can view reconciliation rules from their tenant" ON reconciliation_rules
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert reconciliation rules from their tenant" ON reconciliation_rules
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can update reconciliation rules from their tenant" ON reconciliation_rules
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can delete reconciliation rules from their tenant" ON reconciliation_rules
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- RLS Policies for reconciliation_logs
CREATE POLICY "Users can view reconciliation logs from their tenant" ON reconciliation_logs
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can insert reconciliation logs from their tenant" ON reconciliation_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statements_updated_at BEFORE UPDATE ON bank_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statement_transactions_updated_at BEFORE UPDATE ON bank_statement_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliation_rules_updated_at BEFORE UPDATE ON reconciliation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO bank_accounts (name, bank_name, account_number, account_type, opening_balance, current_balance, tenant_id) VALUES
('Conta Principal', 'Banco do Brasil', '12345-6', 'checking', 10000.00, 15000.00, '00000000-0000-0000-0000-000000000000'),
('Conta Poupança', 'Caixa Econômica', '98765-4', 'savings', 5000.00, 7500.00, '00000000-0000-0000-0000-000000000000');

INSERT INTO reconciliation_rules (name, description, rule_type, pattern, match_threshold, priority, tenant_id) VALUES
('Match by exact description', 'Match transactions with exact description', 'description_match', '^.*$', 1.0, 1, '00000000-0000-0000-0000-000000000000'),
('Match by amount ± R$ 1,00', 'Match transactions with amount within R$ 1,00', 'amount_match', '±1.00', 0.9, 2, '00000000-0000-0000-0000-000000000000'),
('Match by same day', 'Match transactions on same date', 'date_match', 'same_day', 0.8, 3, '00000000-0000-0000-0000-000000000000');
