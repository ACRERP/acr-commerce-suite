# Configuração do Supabase Storage para Upload de Imagens

## Passo 1: Criar o Bucket

No painel do Supabase (https://app.supabase.com):

1. Vá para **Storage** no menu lateral
2. Clique em **Create a new bucket**
3. Nome do bucket: `images`
4. **Public bucket**: ✅ Marque como público
5. Clique em **Create bucket**

## Passo 2: Configurar Políticas de Acesso (RLS)

Execute no SQL Editor do Supabase:

```sql
-- Allow public read access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

## Passo 3: Testar Upload

Após configurar:

1. Abra uma Ordem de Serviço
2. Vá para a seção "Checklist de Entrada"
3. Clique em "Adicionar Fotos"
4. Selecione até 5 imagens
5. Verifique se aparecem na grade de imagens

## Estrutura de Pastas

As imagens serão salvas em:
```
images/
  └── service-orders/
      ├── abc123_1733432100000.jpg
      ├── def456_1733432101000.png
      └── ...
```

## Troubleshooting

### Erro: "new row violates row-level security policy"
- Verifique se as políticas RLS foram criadas corretamente
- Confirme que o usuário está autenticado

### Erro: "Bucket not found"
- Verifique se o bucket `images` foi criado
- Confirme o nome exato do bucket

### Imagens não aparecem
- Verifique se o bucket está marcado como público
- Teste a URL pública da imagem diretamente no navegador
