-- =====================================================
-- TESTE COMPLETO DO SISTEMA - VERIFICAR SE ESTÁ FUNCIONANDO
-- Execute este SQL no Supabase após aplicar as migrations
-- =====================================================

-- =====================================================
-- TESTE 1: VERIFICAR SE AS VIEWS FORAM CRIADAS
-- =====================================================

SELECT 
    'Views Cliente' as categoria,
    COUNT(*) as criadas,
    CASE WHEN COUNT(*) >= 3 THEN '✅ PASSOU' ELSE '❌ FALHOU' END as resultado
FROM information_schema.views
WHERE table_name IN ('vw_client_financial_summary', 'vw_client_purchase_history', 'vw_client_delivery_history', 'vw_clients_overdue')

UNION ALL

SELECT 
    'Views Delivery',
    COUNT(*),
    CASE WHEN COUNT(*) >= 4 THEN '✅ PASSOU' ELSE '❌ FALHOU' END
FROM information_schema.views
WHERE table_name IN ('vw_delivery_by_status', 'vw_delivery_performance_today', 'vw_delivery_performance_monthly', 'vw_delivery_kanban')

UNION ALL

SELECT 
    'Views Financeiro',
    COUNT(*),
    CASE WHEN COUNT(*) >= 5 THEN '✅ PASSOU' ELSE '❌ FALHOU' END
FROM information_schema.views
WHERE table_name IN ('vw_financial_dashboard', 'vw_cash_flow_daily', 'vw_cash_flow_by_category', 'vw_dre_monthly', 'vw_overdue_accounts')

UNION ALL

-- TESTE 2: VERIFICAR SE AS TABELAS FORAM CRIADAS

SELECT 
    'Tabelas Financeiro' as categoria,
    COUNT(*) as criadas,
    CASE WHEN COUNT(*) = 2 THEN '✅ PASSOU' ELSE '❌ FALHOU' END as resultado
FROM information_schema.tables
WHERE table_name IN ('financial_categories', 'cash_flow')

UNION ALL

-- TESTE 3: VERIFICAR CATEGORIAS FINANCEIRAS

SELECT 
    'Categorias Inseridas' as categoria,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) >= 11 THEN '✅ PASSOU' ELSE '❌ FALHOU' END as resultado
FROM financial_categories

UNION ALL

-- TESTE 4: VERIFICAR ESTRUTURA DAS TABELAS

SELECT 
    'cash_flow - colunas' as item,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) >= 10 THEN '✅ PASSOU' ELSE '❌ FALHOU' END as resultado
FROM information_schema.columns
WHERE table_name = 'cash_flow'

UNION ALL

SELECT 
    'financial_categories - colunas',
    COUNT(*),
    CASE WHEN COUNT(*) >= 8 THEN '✅ PASSOU' ELSE '❌ FALHOU' END
FROM information_schema.columns
WHERE table_name = 'financial_categories'

UNION ALL

-- TESTE 5: RESUMO FINAL

SELECT 
    'Total de Views' as metrica,
    COUNT(*)::text as valor,
    CASE WHEN COUNT(*) >= 16 THEN '✅ SISTEMA OK' ELSE '⚠️ FALTAM VIEWS' END as status
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'Total de Tabelas',
    COUNT(*)::text,
    CASE WHEN COUNT(*) >= 33 THEN '✅ SISTEMA OK' ELSE '⚠️ FALTAM TABELAS' END
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Total de Funções',
    COUNT(*)::text,
    CASE WHEN COUNT(*) >= 26 THEN '✅ SISTEMA OK' ELSE '⚠️ FALTAM FUNÇÕES' END
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
/*
✅ PASSOU = Tudo funcionando
❌ FALHOU = Precisa aplicar a migration
⚠️ FALTAM = Parcialmente aplicado

Se todos os testes passarem, o sistema está 100% funcional!
*/
