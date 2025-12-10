-- =====================================================
-- VERIFICAÇÃO COMPLETA DE TODO O SISTEMA ACR ERP
-- Execute no Supabase para ver status de TODAS as tabelas
-- =====================================================

-- TABELAS PRINCIPAIS
SELECT 
    '📦 TABELAS PRINCIPAIS' as categoria,
    table_name as nome,
    '✅ EXISTE' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name)::text || ' colunas' as detalhes
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'

UNION ALL

-- VIEWS DO SISTEMA
SELECT 
    '👁️ VIEWS' as categoria,
    table_name as nome,
    '✅ EXISTE' as status,
    'View' as detalhes
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

-- FUNÇÕES DO SISTEMA
SELECT 
    '⚙️ FUNÇÕES' as categoria,
    routine_name as nome,
    '✅ EXISTE' as status,
    routine_type as detalhes
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'

UNION ALL

-- TRIGGERS DO SISTEMA
SELECT 
    '🔔 TRIGGERS' as categoria,
    trigger_name as nome,
    '✅ EXISTE' as status,
    event_object_table as detalhes
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

-- RESUMO GERAL
SELECT 
    '📊 RESUMO GERAL' as categoria,
    'Total de Tabelas' as nome,
    COUNT(*)::text as status,
    '' as detalhes
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    '📊 RESUMO GERAL',
    'Total de Views',
    COUNT(*)::text,
    ''
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

SELECT 
    '📊 RESUMO GERAL',
    'Total de Funções',
    COUNT(*)::text,
    ''
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'

UNION ALL

SELECT 
    '📊 RESUMO GERAL',
    'Total de Triggers',
    COUNT(*)::text,
    ''
FROM information_schema.triggers
WHERE trigger_schema = 'public'

ORDER BY categoria, nome;
