-- Migration: Upload de Fotos em Produtos
-- Criado em: 08/12/2025
-- Objetivo: Adicionar suporte para upload e armazenamento de imagens de produtos

-- Adicionar coluna image_url na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Adicionar coluna images (array para múltiplas fotos)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Comentários
COMMENT ON COLUMN products.image_url IS 'URL da imagem principal do produto (Supabase Storage)';
COMMENT ON COLUMN products.images IS 'Array de URLs de imagens adicionais do produto';

-- Verificação
SELECT 
  'Migration produtos - upload fotos aplicada!' as resultado,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('image_url', 'images');
