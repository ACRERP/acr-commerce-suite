-- =====================================================
-- PDV AUDIT LOGS - Database Migration
-- Date: 2025-12-07
-- Description: Audit log table for PDV operations
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS pdv_audit_logs (
  id SERIAL PRIMARY KEY,
  
  -- User info
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(100),
  
  -- Action details
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'sale', 'cash_register', 'cash_movement', etc.
  entity_id INTEGER,
  
  -- Old and new values (JSON)
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  cash_register_id INTEGER REFERENCES cash_registers(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON pdv_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON pdv_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON pdv_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON pdv_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_cash_register ON pdv_audit_logs(cash_register_id);

-- Comment
COMMENT ON TABLE pdv_audit_logs IS 'Registro de auditoria para todas as operações do PDV';

-- Common action types:
-- 'cash_open' - Abertura de caixa
-- 'cash_close' - Fechamento de caixa
-- 'sale_create' - Criação de venda
-- 'sale_cancel' - Cancelamento de venda
-- 'sale_suspend' - Suspensão de venda
-- 'sale_resume' - Retomada de venda suspensa
-- 'withdrawal' - Sangria/Retirada
-- 'reinforcement' - Reforço de caixa
-- 'discount_apply' - Aplicação de desconto
-- 'item_add' - Adição de item
-- 'item_remove' - Remoção de item
-- 'payment_add' - Adição de pagamento
-- 'login' - Login no sistema
-- 'logout' - Logout do sistema
