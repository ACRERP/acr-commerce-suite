-- Criar usuário de teste para desenvolvimento
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
  gen_random_uuid(),
  'admin@teste.com',
  now(),
  null,
  null,
  '{"name": "Admin Teste", "role": "admin"}',
  now(),
  now(),
  now()
);

-- Criar profile correspondente
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@teste.com'),
  'Admin Teste',
  'admin@teste.com',
  'admin',
  now(),
  now()
);

-- Criar usuário vendedor
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
  gen_random_uuid(),
  'vendedor@teste.com',
  now(),
  null,
  null,
  '{"name": "Vendedor Teste", "role": "vendas"}',
  now(),
  now(),
  now()
);

-- Criar profile do vendedor
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'vendedor@teste.com'),
  'Vendedor Teste',
  'vendedor@teste.com',
  'vendas',
  now(),
  now()
);
