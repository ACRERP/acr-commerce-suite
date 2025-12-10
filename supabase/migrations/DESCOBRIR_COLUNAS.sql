-- Execute este SQL no Supabase para descobrir os nomes corretos das colunas

-- 1. Verificar colunas de accounts_receivable
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts_receivable'
ORDER BY ordinal_position;

-- 2. Verificar colunas de delivery_orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_orders'
ORDER BY ordinal_position;

-- 3. Verificar colunas de accounts_payable
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts_payable'
ORDER BY ordinal_position;
