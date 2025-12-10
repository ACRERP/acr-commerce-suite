-- =====================================================
-- APLICAR AS 3 MIGRATIONS PRINCIPAIS - ORDEM CORRETA
-- =====================================================
-- Execute estas 3 migrations NESTA ORDEM no Supabase
-- =====================================================

-- =====================================================
-- PASSO 1: MÓDULO CLIENTE
-- =====================================================
-- Arquivo: 20251207120000_complete_clients_module.sql
-- Copie TODO o conteúdo deste arquivo e execute no Supabase

-- =====================================================
-- PASSO 2: MÓDULO DELIVERY  
-- =====================================================
-- Arquivo: 20251207210000_complete_delivery_module.sql
-- Copie TODO o conteúdo deste arquivo e execute no Supabase

-- =====================================================
-- PASSO 3: MÓDULO FINANCEIRO
-- =====================================================
-- Arquivo: 20251207220000_complete_financial_module.sql
-- Copie TODO o conteúdo deste arquivo e execute no Supabase

-- =====================================================
-- VERIFICAÇÃO APÓS APLICAR
-- =====================================================
-- Execute este SQL para confirmar que tudo foi aplicado:

SELECT 
    '✅ VERIFICAÇÃO FINAL' as status,
    '' as item,
    '' as resultado;

-- Cliente
SELECT 
    'CLIENTE' as status,
    'Views' as item,
    COUNT(*)::text || ' de 5' as resultado
FROM information_schema.views
WHERE table_name LIKE 'vw_client%'

UNION ALL

SELECT 
    'CLIENTE',
    'Funções' as item,
    COUNT(*)::text || ' de 5' as resultado
FROM information_schema.routines
WHERE routine_name IN ('fn_update_client_credit', 'fn_check_credit_limit', 'fn_block_client', 'fn_unblock_client', 'fn_update_client_stats')

UNION ALL

-- Delivery
SELECT 
    'DELIVERY',
    'Tabela delivery_men' as item,
    CASE WHEN COUNT(*) = 1 THEN '✅ Criada' ELSE '❌ Não existe' END as resultado
FROM information_schema.tables
WHERE table_name = 'delivery_men'

UNION ALL

SELECT 
    'DELIVERY',
    'Views' as item,
    COUNT(*)::text || ' de 4' as resultado
FROM information_schema.views
WHERE table_name LIKE 'vw_delivery%'

UNION ALL

-- Financeiro
SELECT 
    'FINANCEIRO',
    'Tabelas' as item,
    COUNT(*)::text || ' de 2' as resultado
FROM information_schema.tables
WHERE table_name IN ('financial_categories', 'cash_flow')

UNION ALL

SELECT 
    'FINANCEIRO',
    'Views' as item,
    COUNT(*)::text || ' de 5' as resultado
FROM information_schema.views
WHERE table_name IN ('vw_financial_dashboard', 'vw_cash_flow_daily', 'vw_cash_flow_by_category', 'vw_dre_monthly', 'vw_overdue_accounts')

ORDER BY status, item;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- CLIENTE    | Views              | 5 de 5
-- CLIENTE    | Funções            | 5 de 5
-- DELIVERY   | Tabela delivery_men| ✅ Criada
-- DELIVERY   | Views              | 4 de 4
-- FINANCEIRO | Tabelas            | 2 de 2
-- FINANCEIRO | Views              | 5 de 5
-- =====================================================
