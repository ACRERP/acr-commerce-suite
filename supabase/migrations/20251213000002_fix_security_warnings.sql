-- Migration: Fix Function Search Paths (Dynamic & Robust)
-- Created at: 2025-12-13
-- Description: Sets explicit search_path = public for all functions to prevent search path hijacking.
-- Uses a DO block to dynamically identify functions and avoid signature mismatch errors.

DO $$
DECLARE
    r RECORD;
    v_sql TEXT;
BEGIN
    -- Loop through all functions in the public schema that we want to secure
    -- We filter by name to target the ones flagged in the report (or usually all, but let's be specific or broad)
    -- Broad approach: Secure ALL functions in public schema that are not owned by extensions is often best practice.
    -- However, let's target the specific ones listed + any commonly used ones.
    
    FOR r IN 
        SELECT n.nspname as schema_name, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'handle_new_user',
            'update_roles_timestamp',
            'has_permission',
            'handle_updated_at',
            'update_updated_at_column',
            'update_system_config_timestamp',
            'update_fiscal_config_timestamp',
            'update_whatsapp_config_timestamp',
            'update_accounts_updated_at',
            'update_sale_totals',
            'create_sale_with_items',
            'get_sales_over_time',
            'get_sales_chart_data',
            'get_fiscal_summary',
            'calculate_interest_on_receivable',
            'create_payable_installments',
            'fn_get_next_fiscal_note_number',
            'fn_calculate_taxes_for_sale',
            'fn_generate_fiscal_note_key',
            'fn_clean_old_whatsapp_messages',
            'fn_get_pending_whatsapp_messages',
            'fn_process_scheduled_whatsapp',
            'fn_update_whatsapp_config_timestamp',
            'update_stock_on_sale_complete',
            'create_cash_movement_on_sale',
            'update_product_stock_on_insert',
            'cleanup_old_backups',
            'get_dashboard_stats',
            'fn_clean_old_alerts',
            'fn_create_os_vencida_alert',
            'fn_create_estoque_baixo_alert',
            'fn_process_all_alerts',
            'update_client_statistics',
            'get_recent_activities',
            'get_top_products',
            'increment_stock',
            'generate_product_code',
            'handle_os_item_stock',
            'get_client_available_credit',
            'update_client_credit_usage',
            'update_client_on_payment',
            'generate_os_receivable',
            'update_overdue_status',
            'decrement_stock',
            'fn_calcular_status_prazo',
            'fn_gerar_numero_os',
            'fn_calcular_valor_total_os',
            'fn_registrar_historico_status'
        )
    LOOP
        v_sql := format('ALTER FUNCTION %I.%I(%s) SET search_path = public', r.schema_name, r.function_name, r.args);
        RAISE NOTICE 'Securing function: %', v_sql;
        EXECUTE v_sql;
    END LOOP;
END $$;
