-- =====================================================
-- VERIFICAÇÃO COMPLETA - TUDO QUE FOI CRIADO HOJE
-- Data: 07/12/2025
-- =====================================================

-- =====================================================
-- MÓDULO CLIENTE
-- =====================================================

SELECT '=== MÓDULO CLIENTE ===' as secao, '' as nome, '' as tipo, '' as existe;

-- Campos novos na tabela clients
SELECT 
    'Cliente' as secao,
    column_name as nome,
    'Campo' as tipo,
    CASE WHEN column_name IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as existe
FROM information_schema.columns
WHERE table_name = 'clients'
AND column_name IN (
    'credit_limit',
    'credit_used', 
    'credit_available',
    'financial_status',
    'allow_credit',
    'blocked',
    'blocked_reason',
    'blocked_at',
    'blocked_by',
    'whatsapp',
    'secondary_phone',
    'city',
    'state',
    'zip_code',
    'neighborhood',
    'address_number',
    'complement',
    'birth_date',
    'rg_ie',
    'client_type',
    'status',
    'notes',
    'last_purchase_date',
    'total_purchases',
    'total_spent'
)
ORDER BY column_name

UNION ALL

-- Views do Cliente
SELECT 
    'Cliente' as secao,
    table_name as nome,
    'View' as tipo,
    '✅ SIM' as existe
FROM information_schema.views
WHERE table_name IN (
    'vw_client_financial_summary',
    'vw_client_purchase_history',
    'vw_client_delivery_history',
    'vw_clients_overdue',
    'vw_clients_blocked'
)

UNION ALL

-- Funções do Cliente
SELECT 
    'Cliente' as secao,
    routine_name as nome,
    'Função' as tipo,
    '✅ SIM' as existe
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'fn_update_client_credit',
    'fn_check_credit_limit',
    'fn_block_client',
    'fn_unblock_client',
    'fn_update_client_stats'
)

UNION ALL

-- Triggers do Cliente
SELECT 
    'Cliente' as secao,
    trigger_name as nome,
    'Trigger' as tipo,
    '✅ SIM' as existe
FROM information_schema.triggers
WHERE trigger_name IN (
    'trg_update_credit_on_sale',
    'trg_update_credit_on_payment',
    'trg_check_client_financial_status'
)

UNION ALL

SELECT '=== MÓDULO DELIVERY ===' as secao, '' as nome, '' as tipo, '' as existe

UNION ALL

-- Tabela delivery_men
SELECT 
    'Delivery' as secao,
    'delivery_men' as nome,
    'Tabela' as tipo,
    CASE WHEN table_name IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as existe
FROM information_schema.tables
WHERE table_name = 'delivery_men'

UNION ALL

-- Campos novos em delivery_orders
SELECT 
    'Delivery' as secao,
    column_name as nome,
    'Campo' as tipo,
    CASE WHEN column_name IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as existe
FROM information_schema.columns
WHERE table_name = 'delivery_orders'
AND column_name IN (
    'delivery_man_id',
    'estimated_time',
    'preparation_time',
    'delivery_time',
    'priority',
    'payment_method',
    'payment_status',
    'observations',
    'customer_name',
    'customer_phone',
    'change_for',
    'assigned_at',
    'started_at',
    'cancelled_reason',
    'rating'
)
ORDER BY column_name

UNION ALL

-- Views do Delivery
SELECT 
    'Delivery' as secao,
    table_name as nome,
    'View' as tipo,
    '✅ SIM' as existe
FROM information_schema.views
WHERE table_name IN (
    'vw_delivery_by_status',
    'vw_delivery_performance_today',
    'vw_delivery_performance_monthly',
    'vw_delivery_kanban'
)

UNION ALL

-- Funções do Delivery
SELECT 
    'Delivery' as secao,
    routine_name as nome,
    'Função' as tipo,
    '✅ SIM' as existe
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'fn_assign_deliveryman',
    'fn_start_delivery',
    'fn_complete_delivery',
    'fn_cancel_delivery',
    'fn_calculate_delivery_time'
)

UNION ALL

-- Triggers do Delivery
SELECT 
    'Delivery' as secao,
    trigger_name as nome,
    'Trigger' as tipo,
    '✅ SIM' as existe
FROM information_schema.triggers
WHERE trigger_name IN (
    'trg_reserve_stock_on_delivery',
    'trg_return_stock_on_cancel',
    'trg_update_deliveryman_status'
)

UNION ALL

SELECT '=== MÓDULO FINANCEIRO ===' as secao, '' as nome, '' as tipo, '' as existe

UNION ALL

-- Tabelas do Financeiro
SELECT 
    'Financeiro' as secao,
    table_name as nome,
    'Tabela' as tipo,
    '✅ SIM' as existe
FROM information_schema.tables
WHERE table_name IN (
    'financial_categories',
    'cash_flow'
)

UNION ALL

-- Categorias criadas
SELECT 
    'Financeiro' as secao,
    name as nome,
    'Categoria' as tipo,
    '✅ SIM' as existe
FROM financial_categories
ORDER BY type, name

UNION ALL

-- Campos em accounts_receivable
SELECT 
    'Financeiro' as secao,
    column_name as nome,
    'Campo AR' as tipo,
    CASE WHEN column_name IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as existe
FROM information_schema.columns
WHERE table_name = 'accounts_receivable'
AND column_name IN (
    'installment_number',
    'total_installments',
    'interest_rate',
    'late_fee',
    'discount',
    'original_amount',
    'payment_method',
    'reference_type',
    'reference_id'
)
ORDER BY column_name

UNION ALL

-- Campos em accounts_payable
SELECT 
    'Financeiro' as secao,
    column_name as nome,
    'Campo AP' as tipo,
    CASE WHEN column_name IS NOT NULL THEN '✅ SIM' ELSE '❌ NÃO' END as existe
FROM information_schema.columns
WHERE table_name = 'accounts_payable'
AND column_name IN (
    'category_id',
    'installment_number',
    'total_installments',
    'attachment_url',
    'payment_method',
    'reference_type',
    'reference_id',
    'original_amount'
)
ORDER BY column_name

UNION ALL

-- Views do Financeiro
SELECT 
    'Financeiro' as secao,
    table_name as nome,
    'View' as tipo,
    '✅ SIM' as existe
FROM information_schema.views
WHERE table_name IN (
    'vw_financial_dashboard',
    'vw_cash_flow_daily',
    'vw_cash_flow_by_category',
    'vw_dre_monthly',
    'vw_overdue_accounts'
)

UNION ALL

-- Funções do Financeiro
SELECT 
    'Financeiro' as secao,
    routine_name as nome,
    'Função' as tipo,
    '✅ SIM' as existe
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'fn_calculate_late_fees',
    'fn_generate_installments_receivable',
    'fn_generate_installments_payable',
    'fn_pay_receivable'
)

UNION ALL

-- Triggers do Financeiro
SELECT 
    'Financeiro' as secao,
    trigger_name as nome,
    'Trigger' as tipo,
    '✅ SIM' as existe
FROM information_schema.triggers
WHERE trigger_name IN (
    'trg_create_cash_flow_on_sale'
)

UNION ALL

SELECT '=== RESUMO GERAL ===' as secao, '' as nome, '' as tipo, '' as existe

UNION ALL

-- Resumo por módulo
SELECT 
    'RESUMO' as secao,
    'Cliente - Campos' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 25' as existe
FROM information_schema.columns
WHERE table_name = 'clients'
AND column_name IN ('credit_limit', 'credit_used', 'credit_available', 'financial_status', 'allow_credit', 'blocked', 'blocked_reason', 'blocked_at', 'blocked_by', 'whatsapp', 'secondary_phone', 'city', 'state', 'zip_code', 'neighborhood', 'address_number', 'complement', 'birth_date', 'rg_ie', 'client_type', 'status', 'notes', 'last_purchase_date', 'total_purchases', 'total_spent')

UNION ALL

SELECT 
    'RESUMO' as secao,
    'Cliente - Views' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 5' as existe
FROM information_schema.views
WHERE table_name LIKE 'vw_client%'

UNION ALL

SELECT 
    'RESUMO' as secao,
    'Delivery - Tabela' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 1' as existe
FROM information_schema.tables
WHERE table_name = 'delivery_men'

UNION ALL

SELECT 
    'RESUMO' as secao,
    'Delivery - Views' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 4' as existe
FROM information_schema.views
WHERE table_name LIKE 'vw_delivery%'

UNION ALL

SELECT 
    'RESUMO' as secao,
    'Financeiro - Tabelas' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 2' as existe
FROM information_schema.tables
WHERE table_name IN ('financial_categories', 'cash_flow')

UNION ALL

SELECT 
    'RESUMO' as secao,
    'Financeiro - Categorias' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 11' as existe
FROM financial_categories

UNION ALL

SELECT 
    'RESUMO' as secao,
    'Financeiro - Views' as nome,
    'Total' as tipo,
    COUNT(*)::text || ' de 5' as existe
FROM information_schema.views
WHERE table_name IN ('vw_financial_dashboard', 'vw_cash_flow_daily', 'vw_cash_flow_by_category', 'vw_dre_monthly', 'vw_overdue_accounts')

ORDER BY secao, tipo, nome;
