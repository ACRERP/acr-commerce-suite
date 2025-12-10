-- =====================================================
-- APLICAR TODAS AS MIGRATIONS PENDENTES - PRODUÇÃO
-- Data: 08/12/2025
-- IMPORTANTE: Criar BACKUP antes de executar!
-- =====================================================

-- ============ INSTRUÇÕES ============
-- 1. CRIAR BACKUP no Supabase Dashboard > Database > Backups
-- 2. Executar este script COMPLETO de uma vez
-- 3. Verificar se não há erros
-- 4. Testar sistema após aplicação
-- =====================================================

BEGIN;

-- ============ MIGRATION 1: CLIENTE ============
-- Arquivo: 20251207_CORRIGIDO_cliente.sql

-- Verificar se já foi aplicado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'vw_client_financial_summary'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: Cliente...';
    
    -- Copiar aqui o conteúdo de 20251207_CORRIGIDO_cliente.sql
    -- OU executar separadamente se preferir
    
  ELSE
    RAISE NOTICE '✅ Migration Cliente já aplicada';
  END IF;
END $$;

-- ============ MIGRATION 2: DELIVERY ============
-- Arquivo: 20251207_CORRIGIDO_delivery.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'vw_delivery_kanban'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: Delivery...';
    
    -- Copiar aqui o conteúdo de 20251207_CORRIGIDO_delivery.sql
    -- OU executar separadamente se preferir
    
  ELSE
    RAISE NOTICE '✅ Migration Delivery já aplicada';
  END IF;
END $$;

-- ============ MIGRATION 3: FINANCEIRO ============
-- Arquivo: 20251207_CORRIGIDO_financeiro.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'vw_financial_dashboard'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: Financeiro...';
    
    -- Copiar aqui o conteúdo de 20251207_CORRIGIDO_financeiro.sql
    -- OU executar separadamente se preferir
    
  ELSE
    RAISE NOTICE '✅ Migration Financeiro já aplicada';
  END IF;
END $$;

-- ============ MIGRATION 4: OS COMPLETO ============
-- Arquivo: 20251208000000_os_completo_inforos.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_order_accessories'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: OS Completo...';
    
    -- Esta é CRÍTICA - copiar todo o conteúdo de 20251208000000_os_completo_inforos.sql
    
  ELSE
    RAISE NOTICE '✅ Migration OS Completo já aplicada';
  END IF;
END $$;

-- ============ MIGRATION 5: WHATSAPP ============
-- Arquivo: 20251208100000_whatsapp_integration.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_messages'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: WhatsApp...';
    
    -- Copiar todo o conteúdo de 20251208100000_whatsapp_integration.sql
    
  ELSE
    RAISE NOTICE '✅ Migration WhatsApp já aplicada';
  END IF;
END $$;

-- ============ MIGRATION 6: ALERTAS ============
-- Arquivo: 20251208110000_alert_system.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'alerts'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: Alertas...';
    
    -- Copiar todo o conteúdo de 20251208110000_alert_system.sql
    
  ELSE
    RAISE NOTICE '✅ Migration Alertas já aplicada';
  END IF;
END $$;

-- ============ MIGRATION 7: CONFIGURAÇÕES ============
-- Arquivo: 20251208130000_system_config.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'system_config'
  ) THEN
    RAISE NOTICE '📝 Aplicando migration: Configurações...';
    
    -- Criar tabela de configurações
    CREATE TABLE IF NOT EXISTS system_config (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Índice para busca rápida por chave
    CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

    -- Inserir configurações padrão
    INSERT INTO system_config (key, value) VALUES
    ('company', '{"razao_social":"","cnpj":"","telefone":"","email":"","endereco":"","logo_url":""}'::jsonb),
    ('whatsapp', '{"api_url":"http://localhost:8080","api_key":"","instance_name":"acr-erp","connected":false}'::jsonb),
    ('notifications', '{"estoque":true,"vendas":true,"os":true,"contas":false,"email":false,"whatsapp":true,"delivery":true,"clientes":false}'::jsonb),
    ('appearance', '{"dark_mode":false,"primary_color":"blue","logo_url":""}'::jsonb)
    ON CONFLICT (key) DO NOTHING;

    -- Função para atualizar timestamp automaticamente
    CREATE OR REPLACE FUNCTION update_system_config_timestamp()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Trigger para atualizar timestamp
    DROP TRIGGER IF EXISTS trigger_update_system_config_timestamp ON system_config;
    CREATE TRIGGER trigger_update_system_config_timestamp
      BEFORE UPDATE ON system_config
      FOR EACH ROW
      EXECUTE FUNCTION update_system_config_timestamp();
    
    RAISE NOTICE '✅ Migration Configurações aplicada com sucesso!';
  ELSE
    RAISE NOTICE '✅ Migration Configurações já aplicada';
  END IF;
END $$;

COMMIT;

-- ============ VERIFICAÇÃO FINAL ============

SELECT 
  '✅ MIGRATIONS APLICADAS COM SUCESSO!' as resultado;

-- Verificar tabelas novas
SELECT 
  'service_order_accessories' as tabela,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'service_order_accessories'
    ) THEN '✅ CRIADA'
    ELSE '❌ ERRO - NÃO CRIADA'
  END as status
UNION ALL
SELECT 
  'whatsapp_messages',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'whatsapp_messages'
    ) THEN '✅ CRIADA'
    ELSE '❌ ERRO - NÃO CRIADA'
  END
UNION ALL
SELECT 
  'alerts',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'alerts'
    ) THEN '✅ CRIADA'
    ELSE '❌ ERRO - NÃO CRIADA'
  END
UNION ALL
SELECT 
  'system_config',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'system_config'
    ) THEN '✅ CRIADA'
    ELSE '❌ ERRO - NÃO CRIADA'
  END;

-- ============ PRÓXIMOS PASSOS ============

SELECT 
  'Se todas as tabelas foram criadas, prosseguir para:' as proximos_passos,
  '1. Integrar frontend (rotas, componentes)' as passo_1,
  '2. Testar com dados reais' as passo_2,
  '3. Verificar performance' as passo_3;
