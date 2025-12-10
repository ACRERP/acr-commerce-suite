-- =====================================================
-- VERIFICAÇÃO SIMPLES - COPIE E COLE NO SUPABASE
-- =====================================================

SELECT 
    '📋 MÓDULO CLIENTE' as modulo,
    'Views de Histórico' as item,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ ENTREGUE (5/5)'
        WHEN COUNT(*) > 0 THEN '⚠️ PARCIAL (' || COUNT(*) || '/5)'
        ELSE '❌ FALTA APLICAR (0/5)'
    END as status
FROM information_schema.views
WHERE table_name IN ('vw_client_financial_summary', 'vw_client_purchase_history', 'vw_client_delivery_history', 'vw_clients_overdue', 'vw_clients_blocked')

UNION ALL

SELECT 
    '📋 MÓDULO CLIENTE',
    'Funções de Crédito' as item,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ ENTREGUE (5/5)'
        WHEN COUNT(*) > 0 THEN '⚠️ PARCIAL (' || COUNT(*) || '/5)'
        ELSE '❌ FALTA APLICAR (0/5)'
    END
FROM information_schema.routines
WHERE routine_name IN ('fn_update_client_credit', 'fn_check_credit_limit', 'fn_block_client', 'fn_unblock_client', 'fn_update_client_stats')

UNION ALL

SELECT 
    '🚚 MÓDULO DELIVERY',
    'Tabela Entregadores' as item,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ ENTREGUE'
        ELSE '❌ FALTA APLICAR'
    END
FROM information_schema.tables
WHERE table_name = 'delivery_men'

UNION ALL

SELECT 
    '🚚 MÓDULO DELIVERY',
    'Views Kanban/Performance' as item,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ ENTREGUE (4/4)'
        WHEN COUNT(*) > 0 THEN '⚠️ PARCIAL (' || COUNT(*) || '/4)'
        ELSE '❌ FALTA APLICAR (0/4)'
    END
FROM information_schema.views
WHERE table_name IN ('vw_delivery_by_status', 'vw_delivery_performance_today', 'vw_delivery_performance_monthly', 'vw_delivery_kanban')

UNION ALL

SELECT 
    '💰 MÓDULO FINANCEIRO',
    'Tabelas (Categorias/Fluxo)' as item,
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ ENTREGUE (2/2)'
        WHEN COUNT(*) > 0 THEN '⚠️ PARCIAL (' || COUNT(*) || '/2)'
        ELSE '❌ FALTA APLICAR (0/2)'
    END
FROM information_schema.tables
WHERE table_name IN ('financial_categories', 'cash_flow')

UNION ALL

SELECT 
    '💰 MÓDULO FINANCEIRO',
    'Views Dashboard/DRE' as item,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ ENTREGUE (5/5)'
        WHEN COUNT(*) > 0 THEN '⚠️ PARCIAL (' || COUNT(*) || '/5)'
        ELSE '❌ FALTA APLICAR (0/5)'
    END
FROM information_schema.views
WHERE table_name IN ('vw_financial_dashboard', 'vw_cash_flow_daily', 'vw_cash_flow_by_category', 'vw_dre_monthly', 'vw_overdue_accounts')

ORDER BY modulo, item;
