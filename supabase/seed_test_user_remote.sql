-- Execute este script SQL diretamente no Supabase Dashboard (SQL Editor)
-- para criar usuários de teste no ambiente remoto

-- 1. Criar usuário admin
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@teste.com',
  now(),
  null,
  null,
  '{"name": "Admin Teste", "role": "admin"}',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar profile do admin
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin Teste',
  'admin@teste.com',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 3. Criar usuário vendedor
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  phone,
  phone_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'vendedor@teste.com',
  now(),
  null,
  null,
  '{"name": "Vendedor Teste", "role": "vendas"}',
  now(),
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Criar profile do vendedor
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Vendedor Teste',
  'vendedor@teste.com',
  'vendas',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 5. Definir senhas (execute manualmente no dashboard ou via RPC)
-- Senhas: admin123 e vendas123
