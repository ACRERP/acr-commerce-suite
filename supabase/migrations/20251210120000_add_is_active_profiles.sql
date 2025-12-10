-- Migration: Adicionar campo is_active na tabela profiles
-- Data: 10/12/2025

-- Adicionar coluna is_active
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Comentário
COMMENT ON COLUMN profiles.is_active IS 'Indica se o usuário está ativo no sistema';

-- Verificação
SELECT 
  'Coluna is_active adicionada!' as resultado,
  COUNT(*) as total_profiles
FROM profiles;
