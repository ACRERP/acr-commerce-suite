-- Migration: Backup (Histórico e Gerenciamento)
-- Criado em: 09/12/2025
-- Objetivo: Sistema de backup e restauração de dados

-- ============ TABELA BACKUPS ============
CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('manual', 'automatico', 'agendado')),
  status VARCHAR(50) CHECK (status IN ('em_progresso', 'concluido', 'falhou')) DEFAULT 'concluido',
  tables_included TEXT[], -- Array de tabelas incluídas
  records_count INT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);

-- ============ TABELA BACKUP_CONFIG ============
CREATE TABLE IF NOT EXISTS backup_config (
  id SERIAL PRIMARY KEY,
  auto_backup_enabled BOOLEAN DEFAULT FALSE,
  backup_frequency VARCHAR(20) CHECK (backup_frequency IN ('diario', 'semanal', 'mensal')),
  backup_time TIME DEFAULT '02:00:00',
  retention_days INT DEFAULT 30,
  max_backups INT DEFAULT 10,
  include_tables TEXT[],
  exclude_tables TEXT[],
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO backup_config (
  auto_backup_enabled,
  backup_frequency,
  retention_days,
  max_backups
) VALUES (
  false,
  'diario',
  30,
  10
) ON CONFLICT DO NOTHING;

-- ============ FUNÇÃO PARA LIMPAR BACKUPS ANTIGOS ============
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
DECLARE
  v_retention_days INT;
  v_max_backups INT;
BEGIN
  -- Buscar configuração
  SELECT retention_days, max_backups INTO v_retention_days, v_max_backups
  FROM backup_config
  LIMIT 1;

  -- Deletar backups antigos por data
  DELETE FROM backups
  WHERE created_at < NOW() - (v_retention_days || ' days')::INTERVAL;

  -- Manter apenas os últimos N backups
  DELETE FROM backups
  WHERE id NOT IN (
    SELECT id FROM backups
    ORDER BY created_at DESC
    LIMIT v_max_backups
  );
END;
$$ LANGUAGE plpgsql;

-- ============ VERIFICAÇÃO ============
SELECT
  'Migration Backup aplicada!' as resultado,
  COUNT(*) as total_backups
FROM backups;

-- Comentários
COMMENT ON TABLE backups IS 'Histórico de backups realizados';
COMMENT ON TABLE backup_config IS 'Configurações de backup automático';
COMMENT ON COLUMN backups.type IS 'Tipo: manual, automatico ou agendado';
COMMENT ON COLUMN backups.status IS 'Status: em_progresso, concluido ou falhou';
COMMENT ON FUNCTION cleanup_old_backups IS 'Remove backups antigos baseado na configuração';
