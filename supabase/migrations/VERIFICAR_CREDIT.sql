-- Verificar colunas exatas de clients
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name LIKE '%credit%'
ORDER BY column_name;
