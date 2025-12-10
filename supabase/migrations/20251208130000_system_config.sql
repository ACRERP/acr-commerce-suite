-- Migration: Persistência de Configurações
-- Criado em: 08/12/2025
-- Objetivo: Armazenar configurações do sistema no Supabase

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

-- Comentários
COMMENT ON TABLE system_config IS 'Armazena configurações do sistema';
COMMENT ON COLUMN system_config.key IS 'Chave única da configuração (ex: company, whatsapp, notifications)';
COMMENT ON COLUMN system_config.value IS 'Valor da configuração em formato JSON';

-- Inserir configurações padrão
INSERT INTO system_config (key, value) VALUES
('company', '{
  "razao_social": "",
  "cnpj": "",
  "telefone": "",
  "email": "",
  "endereco": "",
  "logo_url": ""
}'::jsonb),
('whatsapp', '{
  "api_url": "http://localhost:8080",
  "api_key": "",
  "instance_name": "acr-erp",
  "connected": false
}'::jsonb),
('notifications', '{
  "estoque": true,
  "vendas": true,
  "os": true,
  "contas": false,
  "email": false,
  "whatsapp": true,
  "delivery": true,
  "clientes": false
}'::jsonb),
('appearance', '{
  "dark_mode": false,
  "primary_color": "blue",
  "logo_url": ""
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_system_config_timestamp ON system_config;
CREATE TRIGGER trigger_update_system_config_timestamp
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_timestamp();
