-- Verificar se os usuários foram criados
SELECT u.email, p.role, p.full_name 
FROM auth.users u 
LEFT JOIN public.profiles p ON u.id = p.id 
WHERE u.email IN ('admin@teste.com', 'vendas@teste.com', 'financeiro@teste.com');

-- Se os profiles não existirem, criar manualmente
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Test User'),
  COALESCE(u.raw_user_meta_data->>'role', 'vendas'),
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.email IN ('admin@teste.com', 'vendas@teste.com', 'financeiro@teste.com')
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Forçar atualização do role para admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@teste.com';

UPDATE public.profiles 
SET role = 'vendas' 
WHERE email = 'vendas@teste.com';

UPDATE public.profiles 
SET role = 'financeiro' 
WHERE email = 'financeiro@teste.com';
