-- =====================================================
-- VERIFICAÇÃO COMPLETA DO SISTEMA - PRODUÇÃO REAL
-- Data: 08/12/2025
-- Objetivo: Verificar estado atual antes de produção
-- =====================================================

-- ============ 1. VERIFICAR TABELAS ============

SELECT 
  '=== TABELAS EXISTENTES ===' as info;

SELECT 
  tablename as tabela,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) as tamanho
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============ 2. VERIFICAR VIEWS ============

SELECT 
  '=== VIEWS EXISTENTES ===' as info;

SELECT 
  viewname as view
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- ============ 3. VERIFICAR FUNÇÕES ============

SELECT 
  '=== FUNÇÕES EXISTENTES ===' as info;

SELECT 
  routine_name as funcao,
  routine_type as tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============ 4. VERIFICAR TRIGGERS ============

SELECT 
  '=== TRIGGERS EXISTENTES ===' as info;

SELECT 
  trigger_name as trigger,
  event_object_table as tabela
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- ============ 5. VERIFICAR RLS ============

SELECT 
  '=== STATUS RLS (Row Level Security) ===' as info;

SELECT 
  tablename as tabela,
  CASE 
    WHEN rowsecurity THEN '✅ ATIVO'
    ELSE '❌ DESATIVADO'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============ 6. VERIFICAR POLÍTICAS RLS ============

SELECT 
  '=== POLÍTICAS RLS ===' as info;

SELECT 
  tablename as tabela,
  policyname as politica,
  cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============ 7. VERIFICAR TABELAS ESPECÍFICAS (NOVAS) ============

SELECT 
  '=== VERIFICAR TABELAS NOVAS ===' as info;

SELECT 
  'service_order_accessories' as tabela,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'service_order_accessories'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - APLICAR 20251208000000_os_completo_inforos.sql'
  END as status
UNION ALL
SELECT 
  'whatsapp_messages',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'whatsapp_messages'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - APLICAR 20251208100000_whatsapp_integration.sql'
  END
UNION ALL
SELECT 
  'alerts',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'alerts'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - APLICAR 20251208110000_alert_system.sql'
  END;

-- ============ 8. VERIFICAR VIEWS ESPECÍFICAS ============

SELECT 
  '=== VERIFICAR VIEWS NOVAS ===' as info;

SELECT 
  'vw_os_dashboard' as view,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'vw_os_dashboard'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END as status
UNION ALL
SELECT 
  'vw_technician_productivity',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'vw_technician_productivity'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END
UNION ALL
SELECT 
  'vw_whatsapp_stats',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'vw_whatsapp_stats'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END
UNION ALL
SELECT 
  'vw_alert_stats',
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'vw_alert_stats'
    ) THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE'
  END;

-- ============ 9. CONTAR DADOS EXISTENTES ============

SELECT 
  '=== DADOS EXISTENTES ===' as info;

SELECT 
  'clients' as tabela,
  COUNT(*) as total_registros
FROM clients
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'service_orders', COUNT(*) FROM service_orders
ORDER BY tabela;

-- ============ 10. VERIFICAR INTEGRIDADE ============

SELECT 
  '=== INTEGRIDADE REFERENCIAL ===' as info;

SELECT 
  tc.table_name as tabela,
  COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name
ORDER BY total_foreign_keys DESC;

-- ============ 11. VERIFICAR ÍNDICES ============

SELECT 
  '=== ÍNDICES CRIADOS ===' as info;

SELECT 
  tablename as tabela,
  COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_indices DESC;

-- ============ 12. RESUMO FINAL ============

SELECT 
  '=== RESUMO DO SISTEMA ===' as info;

SELECT 
  'Total de Tabelas' as metrica,
  COUNT(*)::text as valor
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total de Views',
  COUNT(*)::text
FROM pg_views
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total de Funções',
  COUNT(*)::text
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 
  'Total de Triggers',
  COUNT(*)::text
FROM information_schema.triggers
WHERE trigger_schema = 'public'
UNION ALL
SELECT 
  'Total de Clientes',
  COUNT(*)::text
FROM clients
UNION ALL
SELECT 
  'Total de Produtos',
  COUNT(*)::text
FROM products
UNION ALL
SELECT 
  'Total de Vendas',
  COUNT(*)::text
FROM sales
UNION ALL
SELECT 
  'Total de OS',
  COUNT(*)::text
FROM service_orders;

-- ============ FIM DA VERIFICAÇÃO ============

SELECT 
  '✅ VERIFICAÇÃO COMPLETA!' as resultado,
  'Analise os resultados acima para identificar o que precisa ser aplicado' as proximos_passos;
