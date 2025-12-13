-- =================================================================
-- MIGRATION CONSOLIDADA DE MÓDULOS PENDENTES - ACR COMMERCE SUITE
-- Data: 11/12/2025
-- Módulos: CRM, Fiscal, OS, Financeiro Completo, RBAC
-- Objetivo: Garantir que todas as tabelas e views necessárias existam
-- =================================================================

-- =================================================================
-- 1. MÓDULO RBAC (ROLES & PERMISSIONS)
-- =================================================================

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Inserir roles padrão se não existirem
INSERT INTO roles (name, description, permissions, is_system) VALUES
('admin', 'Super Administrador', '{"all": true}'::jsonb, true),
('gerente', 'Gerente', '{"dashboard": {"read": true}}'::jsonb, true),
('operador_pdv', 'Operador PDV', '{"pdv": {"read": true}}'::jsonb, true),
('caixa', 'Operador de Caixa', '{"caixa": {"read": true}}'::jsonb, true),
('entregador', 'Entregador', '{"delivery": {"read": true}}'::jsonb, true),
('financeiro', 'Financeiro', '{"financeiro": {"read": true}}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- =================================================================
-- 2. MÓDULO CRM (LEADS & METRICS)
-- =================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'site',
    status TEXT DEFAULT 'novo',
    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View v_client_metrics
CREATE OR REPLACE VIEW v_client_metrics AS
SELECT 
    c.id AS client_id,
    c.name,
    c.email,
    c.phone,
    COUNT(s.id) AS purchase_count,
    COALESCE(SUM(s.total_amount), 0) AS total_spent,
    MAX(s.created_at) AS last_purchase_date,
    CASE 
        WHEN MAX(s.created_at) IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM (NOW() - MAX(s.created_at))) 
    END AS days_since_last_purchase,
    CASE 
        WHEN COALESCE(SUM(s.total_amount), 0) >= 5000 THEN 'vip'
        WHEN COUNT(s.id) >= 3 AND EXTRACT(DAY FROM (NOW() - MAX(s.created_at))) < 60 THEN 'recorrente'
        WHEN EXTRACT(DAY FROM (NOW() - MAX(s.created_at))) > 90 THEN 'inativo'
        ELSE 'novo'
    END AS segment
FROM clients c
LEFT JOIN sales s ON c.id = s.client_id
GROUP BY c.id, c.name, c.email, c.phone;

-- =================================================================
-- 3. MÓDULO FINANCEIRO COMPLETO
-- =================================================================

-- 3.1 Categorias Financeiras
CREATE TABLE IF NOT EXISTS financial_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa')),
    description TEXT,
    color VARCHAR(7),
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES financial_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias básicas
INSERT INTO financial_categories (name, type, color, icon) VALUES
('Vendas', 'receita', '#10b981', 'shopping-cart'),
('Serviços', 'receita', '#06b6d4', 'wrench'),
('Despesas Operacionais', 'despesa', '#ef4444', 'home'),
('Fornecedores', 'despesa', '#6366f1', 'package')
ON CONFLICT DO NOTHING;

-- 3.2 Expandir Contas a Receber (Adicionar colunas se não existirem)
DO $$
BEGIN
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
    ALTER TABLE accounts_receivable ADD COLUMN IF NOT EXISTS reference_id INTEGER;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- 3.3 Expandir Contas a Pagar
DO $$
BEGIN
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES financial_categories(id);
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1;
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255);
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS reference_id INTEGER;
    ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- 3.4 Fluxo de Caixa
CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida')),
    category_id INTEGER REFERENCES financial_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    user_id UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- 4. MÓDULO FISCAL
-- =================================================================

-- 4.1 Configurações Fiscais
CREATE TABLE IF NOT EXISTS company_fiscal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id), -- Pode ser null se single tenant
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) NOT NULL,
  inscricao_estadual VARCHAR(20),
  inscricao_municipal VARCHAR(20),
  regime_tributario VARCHAR(50) DEFAULT 'simples_nacional',
  certificado_a1 BYTEA,
  certificado_senha VARCHAR(255),
  certificado_validade DATE,
  serie_nfce VARCHAR(10) DEFAULT '1',
  ultimo_numero_nfce INTEGER DEFAULT 0,
  csc_nfce VARCHAR(100),
  id_csc_nfce INTEGER DEFAULT 1,
  ambiente VARCHAR(20) DEFAULT 'homologacao',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4.2 Expandir Produtos (NCM, CFOP, etc)
DO $$
BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm VARCHAR(10);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cfop_padrao VARCHAR(10) DEFAULT '5102';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cst VARCHAR(10);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS csosn VARCHAR(10);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS origem VARCHAR(1) DEFAULT '0';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_aliquota DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cest VARCHAR(10);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS unidade_tributavel VARCHAR(10) DEFAULT 'UN';
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- 4.3 Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS fiscal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  serie VARCHAR(10) NOT NULL,
  tipo VARCHAR(10) NOT NULL, -- nfce, nfe
  chave_acesso VARCHAR(44),
  sale_id BIGINT REFERENCES sales(id), -- Atenção: sales.id é BIGINT no schema atual
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  xml_envio TEXT,
  xml_retorno TEXT,
  xml_autorizado TEXT,
  pdf_url TEXT,
  qr_code TEXT,
  data_emissao TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =================================================================
-- 5. MÓDULO OS (ORDEM DE SERVIÇO)
-- =================================================================

-- 5.1 Garantir tabela service_orders base
CREATE TABLE IF NOT EXISTS service_orders (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id),
    status VARCHAR(50) DEFAULT 'aberta',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.2 Expandir Service Orders
DO $$
BEGIN
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20) DEFAULT 'media';
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS prazo_entrega TIMESTAMP WITH TIME ZONE;
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS status_prazo VARCHAR(20);
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS diagnostico TEXT;
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS solucao_proposta TEXT;
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS valor_servicos DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS valor_pecas DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS valor_final DECIMAL(10,2);
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS device_type VARCHAR(100);
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS device_brand VARCHAR(100);
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS reported_issue TEXT;
    ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id); -- Técnico
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- 5.3 Tabelas Auxiliares OS
CREATE TABLE IF NOT EXISTS service_order_services (
  id BIGSERIAL PRIMARY KEY,
  service_order_id BIGINT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  descricao VARCHAR(200) NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  tecnico_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_order_parts (
  id BIGSERIAL PRIMARY KEY,
  service_order_id BIGINT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  produto_id BIGINT REFERENCES products(id),
  descricao VARCHAR(200),
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_order_history (
  id BIGSERIAL PRIMARY KEY,
  service_order_id BIGINT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- 6. HABILITAR RLS (Segurança)
-- =================================================================

-- Função helper para RLS
DO $$
BEGIN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
    ALTER TABLE company_fiscal_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fiscal_notes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
    ALTER TABLE service_order_services ENABLE ROW LEVEL SECURITY;
    ALTER TABLE service_order_parts ENABLE ROW LEVEL SECURITY;
END $$;

-- Criar políticas genéricas de leitura (ajustar conforme necessidade real de produção)
-- Cada policy precisa ter um nome único
CREATE POLICY IF NOT EXISTS "leads_read_policy" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "financial_categories_read_policy" ON financial_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "cash_flow_read_policy" ON cash_flow FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "company_fiscal_settings_read_policy" ON company_fiscal_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "fiscal_notes_read_policy" ON fiscal_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "service_orders_read_policy" ON service_orders FOR SELECT TO authenticated USING (true);

-- Politicas de escrita simplificadas (necessário refinar depois com RBAC real)
CREATE POLICY IF NOT EXISTS "leads_write_policy" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "cash_flow_write_policy" ON cash_flow FOR ALL TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "service_orders_write_policy" ON service_orders FOR ALL TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "service_order_services_write_policy" ON service_order_services FOR ALL TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "service_order_parts_write_policy" ON service_order_parts FOR ALL TO authenticated USING (true);

-- =================================================================
-- FIM DA MIGRATION CONSOLIDADA
-- =================================================================
