-- Migration: Fiscal (Certificados, NFC-e, SEFAZ)
-- Criado em: 09/12/2025
-- Objetivo: Configuração fiscal completa para emissão de NFC-e

-- ============ TABELA FISCAL_CONFIG ============
CREATE TABLE IF NOT EXISTS fiscal_config (
  id SERIAL PRIMARY KEY,
  certificate_type VARCHAR(10) CHECK (certificate_type IN ('A1', 'A3')),
  certificate_data TEXT, -- Base64 do arquivo .pfx (apenas A1)
  certificate_password TEXT, -- Senha do certificado (criptografada)
  certificate_valid_until DATE,
  csc_token VARCHAR(100), -- Token CSC para NFC-e
  csc_id VARCHAR(10), -- ID do CSC
  sefaz_endpoint VARCHAR(255), -- URL do SEFAZ por estado
  sefaz_state VARCHAR(2), -- UF (SP, RJ, etc)
  nfce_series INT DEFAULT 1,
  nfce_last_number INT DEFAULT 0,
  ambiente VARCHAR(20) DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_fiscal_config_active ON fiscal_config(active);

-- ============ FUNÇÃO PARA ATUALIZAR TIMESTAMP ============
CREATE OR REPLACE FUNCTION update_fiscal_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_fiscal_config_timestamp ON fiscal_config;
CREATE TRIGGER trigger_update_fiscal_config_timestamp
  BEFORE UPDATE ON fiscal_config
  FOR EACH ROW
  EXECUTE FUNCTION update_fiscal_config_timestamp();

-- ============ CONFIGURAÇÃO PADRÃO ============
INSERT INTO fiscal_config (
  certificate_type,
  sefaz_state,
  ambiente,
  active
) VALUES (
  'A1',
  'SP',
  'homologacao',
  false
) ON CONFLICT DO NOTHING;

-- ============ VERIFICAÇÃO ============
SELECT
  'Migration Fiscal aplicada!' as resultado,
  COUNT(*) as total_configs
FROM fiscal_config;

-- Comentários
COMMENT ON TABLE fiscal_config IS 'Configurações fiscais para emissão de NFC-e';
COMMENT ON COLUMN fiscal_config.certificate_type IS 'Tipo de certificado: A1 (arquivo) ou A3 (token/smartcard)';
COMMENT ON COLUMN fiscal_config.certificate_data IS 'Dados do certificado A1 em base64';
COMMENT ON COLUMN fiscal_config.csc_token IS 'Token CSC para NFC-e (obrigatório)';
COMMENT ON COLUMN fiscal_config.ambiente IS 'Ambiente: homologacao ou producao';
