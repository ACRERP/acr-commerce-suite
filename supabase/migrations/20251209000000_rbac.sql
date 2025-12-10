-- Migration: RBAC (Roles, Permissions, User Roles)
-- Criado em: 09/12/2025
-- Objetivo: Sistema completo de controle de acesso baseado em papéis

-- ============ TABELA ROLES ============
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE, -- Papéis do sistema não podem ser deletados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- ============ TABELA USER_ROLES ============
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- ============ PAPÉIS PADRÃO ============
INSERT INTO roles (name, description, permissions, is_system) VALUES
(
  'admin',
  'Super Administrador - Acesso total ao sistema',
  '{"all": true}'::jsonb,
  true
),
(
  'gerente',
  'Gerente - Acesso a relatórios, financeiro e configurações parciais',
  '{
    "dashboard": {"read": true},
    "pdv": {"read": true, "create": true},
    "vendas": {"read": true, "create": true, "update": true},
    "clientes": {"read": true, "create": true, "update": true},
    "produtos": {"read": true, "create": true, "update": true},
    "os": {"read": true, "create": true, "update": true},
    "delivery": {"read": true, "create": true, "update": true},
    "financeiro": {"read": true, "create": true, "update": true},
    "relatorios": {"read": true, "export": true},
    "configuracoes": {"read": true}
  }'::jsonb,
  true
),
(
  'operador_pdv',
  'Operador PDV - Apenas vendas e consultas básicas',
  '{
    "pdv": {"read": true, "create": true},
    "vendas": {"read": true, "create": true},
    "clientes": {"read": true},
    "produtos": {"read": true}
  }'::jsonb,
  true
),
(
  'caixa',
  'Operador de Caixa - Abrir/fechar caixa e sangria',
  '{
    "caixa": {"read": true, "create": true, "update": true},
    "vendas": {"read": true},
    "relatorios": {"read": true}
  }'::jsonb,
  true
),
(
  'entregador',
  'Entregador - Ver apenas entregas atribuídas',
  '{
    "delivery": {"read": true, "update_status": true}
  }'::jsonb,
  true
),
(
  'financeiro',
  'Financeiro/Contador - Acesso financeiro e fiscal',
  '{
    "financeiro": {"read": true, "create": true, "update": true, "delete": true},
    "fiscal": {"read": true, "create": true},
    "relatorios": {"read": true, "export": true}
  }'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- ============ FUNÇÃO PARA ATUALIZAR TIMESTAMP ============
CREATE OR REPLACE FUNCTION update_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_roles_timestamp ON roles;
CREATE TRIGGER trigger_update_roles_timestamp
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_timestamp();

-- ============ FUNÇÃO HELPER: VERIFICAR PERMISSÃO ============
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_module VARCHAR,
  p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_role RECORD;
BEGIN
  -- Verificar se usuário tem algum papel com a permissão
  FOR v_role IN
    SELECT r.permissions
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
  LOOP
    -- Se tem permissão "all", retorna true
    IF (v_role.permissions->>'all')::boolean = true THEN
      RETURN TRUE;
    END IF;
    
    -- Verificar permissão específica do módulo
    IF (v_role.permissions->p_module->>p_action)::boolean = true THEN
      v_has_permission := TRUE;
    END IF;
  END LOOP;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- ============ VERIFICAÇÃO ============
SELECT
  'Migration RBAC aplicada!' as resultado,
  COUNT(*) as total_roles
FROM roles;

-- Comentários
COMMENT ON TABLE roles IS 'Papéis do sistema com permissões granulares';
COMMENT ON TABLE user_roles IS 'Relacionamento usuários x papéis';
COMMENT ON COLUMN roles.permissions IS 'Permissões em formato JSON: {"module": {"action": true}}';
COMMENT ON COLUMN roles.is_system IS 'Papéis do sistema não podem ser deletados';
COMMENT ON FUNCTION has_permission IS 'Verifica se usuário tem permissão específica';
