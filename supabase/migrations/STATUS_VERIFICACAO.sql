-- =====================================================
-- VERIFICAÇÃO RÁPIDA - O QUE FOI FEITO E O QUE FALTA
-- Execute este SQL no Supabase para ver o status
-- =====================================================

-- RESUMO EXECUTIVO
SELECT 
    '🎯 RESUMO EXECUTIVO' as categoria,
    '' as item,
    '' as status,
    '' as detalhes;

-- MÓDULO CLIENTE
SELECT 
    '📋 CLIENTE' as categoria,
    'Campos Básicos' as item,
    CASE WHEN COUNT(*) >= 7 THEN '✅ COMPLETO' ELSE '⚠️ FALTAM ' || (7 - COUNT(*)) END as status,
    COUNT(*)::text || ' de 7' as detalhes
FROM information_schema.columns
WHERE table_name = 'clients' 
AND column_name IN ('credit_limit', 'credit_used', 'blocked', 'whatsapp', 'city', 'financial_status', 'allow_credit')

UNION ALL

SELECT 
    '📋 CLIENTE',
    'Views de Histórico' as item,
    CASE WHEN COUNT(*) >= 5 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 5' as detalhes
FROM information_schema.views
WHERE table_name LIKE 'vw_client%'

UNION ALL

SELECT 
    '📋 CLIENTE',
    'Funções de Crédito' as item,
    CASE WHEN COUNT(*) >= 5 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 5' as detalhes
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('fn_update_client_credit', 'fn_check_credit_limit', 'fn_block_client', 'fn_unblock_client', 'fn_update_client_stats')

UNION ALL

SELECT 
    '📋 CLIENTE',
    'Triggers Automáticos' as item,
    CASE WHEN COUNT(*) >= 3 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 3' as detalhes
FROM information_schema.triggers
WHERE trigger_name IN ('trg_update_credit_on_sale', 'trg_update_credit_on_payment', 'trg_check_client_financial_status')

UNION ALL

-- MÓDULO DELIVERY
SELECT 
    '🚚 DELIVERY' as categoria,
    'Tabela Entregadores' as item,
    CASE WHEN COUNT(*) = 1 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    CASE WHEN COUNT(*) = 1 THEN 'Criada' ELSE 'Não existe' END as detalhes
FROM information_schema.tables
WHERE table_name = 'delivery_men'

UNION ALL

SELECT 
    '🚚 DELIVERY',
    'Campos Delivery Orders' as item,
    CASE WHEN COUNT(*) >= 10 THEN '✅ COMPLETO' ELSE '⚠️ FALTAM ' || (10 - COUNT(*)) END as status,
    COUNT(*)::text || ' de 10+' as detalhes
FROM information_schema.columns
WHERE table_name = 'delivery_orders'
AND column_name IN ('delivery_man_id', 'estimated_time', 'priority', 'payment_status', 'customer_name', 'assigned_at', 'started_at', 'delivery_time', 'rating', 'cancelled_reason')

UNION ALL

SELECT 
    '🚚 DELIVERY',
    'Views (Kanban/Performance)' as item,
    CASE WHEN COUNT(*) >= 4 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 4' as detalhes
FROM information_schema.views
WHERE table_name LIKE 'vw_delivery%'

UNION ALL

SELECT 
    '🚚 DELIVERY',
    'Funções de Controle' as item,
    CASE WHEN COUNT(*) >= 5 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 5' as detalhes
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('fn_assign_deliveryman', 'fn_start_delivery', 'fn_complete_delivery', 'fn_cancel_delivery', 'fn_calculate_delivery_time')

UNION ALL

-- MÓDULO FINANCEIRO
SELECT 
    '💰 FINANCEIRO' as categoria,
    'Tabelas (Categorias/Fluxo)' as item,
    CASE WHEN COUNT(*) = 2 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 2' as detalhes
FROM information_schema.tables
WHERE table_name IN ('financial_categories', 'cash_flow')

UNION ALL

SELECT 
    '💰 FINANCEIRO',
    'Categorias Padrão' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_categories')
        THEN (
            SELECT CASE WHEN COUNT(*) >= 11 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END
            FROM financial_categories
        )
        ELSE '❌ FALTA APLICAR'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_categories')
        THEN (SELECT COUNT(*)::text || ' categorias' FROM financial_categories)
        ELSE 'Tabela não existe'
    END as detalhes

UNION ALL

SELECT 
    '💰 FINANCEIRO',
    'Views (Dashboard/DRE)' as item,
    CASE WHEN COUNT(*) >= 5 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 5' as detalhes
FROM information_schema.views
WHERE table_name IN ('vw_financial_dashboard', 'vw_cash_flow_daily', 'vw_cash_flow_by_category', 'vw_dre_monthly', 'vw_overdue_accounts')

UNION ALL

SELECT 
    '💰 FINANCEIRO',
    'Funções (Juros/Parcelas)' as item,
    CASE WHEN COUNT(*) >= 4 THEN '✅ COMPLETO' ELSE '❌ FALTA APLICAR' END as status,
    COUNT(*)::text || ' de 4' as detalhes
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('fn_calculate_late_fees', 'fn_generate_installments_receivable', 'fn_generate_installments_payable', 'fn_pay_receivable')

UNION ALL

-- CONCLUSÃO
SELECT 
    '📊 CONCLUSÃO' as categoria,
    'Status Geral' as item,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.views WHERE table_name LIKE 'vw_client%'
        ) >= 5 
        AND (
            SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'delivery_men'
        ) = 1
        AND (
            SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('financial_categories', 'cash_flow')
        ) = 2
        THEN '🎉 TUDO PRONTO - 100%'
        ELSE '⚠️ FALTA APLICAR MIGRATIONS'
    END as status,
    'Veja detalhes acima' as detalhes

ORDER BY 
    CASE categoria
        WHEN '🎯 RESUMO EXECUTIVO' THEN 1
        WHEN '📋 CLIENTE' THEN 2
        WHEN '🚚 DELIVERY' THEN 3
        WHEN '💰 FINANCEIRO' THEN 4
        WHEN '📊 CONCLUSÃO' THEN 5
    END,
    item;
