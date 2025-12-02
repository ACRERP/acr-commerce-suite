-- Criar usuários de teste via signup manual
-- Use estes dados para criar usuários no painel Supabase Authentication

-- 1. Admin
-- Email: admin@teste.com
-- Senha: 123456
-- Role: admin
-- Full Name: Administrador Teste

-- 2. Vendas  
-- Email: vendas@teste.com
-- Senha: 123456
-- Role: vendas
-- Full Name: Vendedor Teste

-- 3. Financeiro
-- Email: financeiro@teste.com
-- Senha: 123456
-- Role: financeiro
-- Full Name: Financeiro Teste

-- Para criar os usuários:
-- 1. Vá ao painel Supabase > Authentication > Users
-- 2. Clique "Add user" para cada um acima
-- 3. Depois vá em SQL Editor e execute:

-- Atualizar roles para usuários existentes
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@teste.com';

UPDATE public.profiles 
SET role = 'vendas' 
WHERE email = 'vendas@teste.com';

UPDATE public.profiles 
SET role = 'financeiro' 
WHERE email = 'financeiro@teste.com';
