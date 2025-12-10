-- Migration: Alertas - Marcar como Lido
-- Criado em: 08/12/2025
-- Objetivo: Adicionar funcionalidade de marcar alertas como lidos

-- Adicionar coluna read na tabela alerts
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Adicionar coluna read_at para timestamp
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Índice para buscar alertas não lidos rapidamente
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read) WHERE read = FALSE;

-- Comentários
COMMENT ON COLUMN alerts.read IS 'Indica se o alerta foi lido pelo usuário';
COMMENT ON COLUMN alerts.read_at IS 'Data e hora em que o alerta foi marcado como lido';

-- Verificação
SELECT 
  'Migration alertas - marcar lido aplicada!' as resultado,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'alerts'
AND column_name IN ('read', 'read_at');
