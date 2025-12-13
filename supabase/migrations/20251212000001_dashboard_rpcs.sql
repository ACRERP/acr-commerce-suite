-- =====================================================
-- MIGRATION: DASHBOARD RPCs & ANALYTICS
-- Data: 12/12/2025
-- Objetivo: Criar funções de banco de dados para agregar dados dos dashboards com performance
-- =====================================================

-- 1. Função para KPIs do Dashboard (Receita, Clientes, Ticket Médio)
create or replace function get_dashboard_stats(period_days int default 30)
returns json
language plpgsql
security definer
as $$
declare
    v_total_revenue decimal(12,2);
    v_previous_revenue decimal(12,2);
    v_revenue_growth decimal(5,2);
    v_new_customers int;
    v_avg_ticket decimal(10,2);
    v_result json;
begin
    -- Calcular Receita Total no Período
    select coalesce(sum(total_amount), 0)
    into v_total_revenue
    from sales
    where created_at >= (now() - (period_days || ' days')::interval)
    and status = 'completed';

    -- Calcular Receita do Período Anterior (para growth)
    select coalesce(sum(total_amount), 0)
    into v_previous_revenue
    from sales
    where created_at >= (now() - ((period_days * 2) || ' days')::interval)
    and created_at < (now() - (period_days || ' days')::interval)
    and status = 'completed';

    -- Calcular Crescimento %
    if v_previous_revenue > 0 then
        v_revenue_growth := ((v_total_revenue - v_previous_revenue) / v_previous_revenue) * 100;
    else
        v_revenue_growth := 0;
    end if;

    -- Novos Clientes
    select count(*)
    into v_new_customers
    from clients
    where created_at >= (now() - (period_days || ' days')::interval);

    -- Ticket Médio
    select coalesce(avg(total_amount), 0)
    into v_avg_ticket
    from sales
    where created_at >= (now() - (period_days || ' days')::interval)
    and status = 'completed';

    v_result := json_build_object(
        'revenue', v_total_revenue,
        'revenue_growth', round(v_revenue_growth, 1),
        'new_customers', v_new_customers,
        'avg_ticket', round(v_avg_ticket, 2)
    );

    return v_result;
end;
$$;

-- 2. Função para Gráfico de Vendas (Area Chart)
create or replace function get_sales_chart_data(period_days int default 30)
returns table (
    date text,
    revenue decimal(12,2),
    canceled decimal(12,2)
)
language plpgsql
security definer
as $$
begin
    return query
    select 
        to_char(date_trunc('day', created_at), 'DD/MM')::text as date,
        sum(case when status = 'completed' then total_amount else 0 end) as revenue,
        sum(case when status = 'canceled' then total_amount else 0 end) as canceled
    from sales
    where created_at >= (now() - (period_days || ' days')::interval)
    group by 1
    order by min(created_at);
end;
$$;

-- 3. Função para Resumo Fiscal
create or replace function get_fiscal_summary()
returns json
language plpgsql
security definer
as $$
declare
    v_invoices_count int;
    v_pending_taxes decimal(12,2);
    v_result json;
begin
    -- Contar notas emitidas no mês atual
    select count(*)
    into v_invoices_count
    from fiscal_notes
    where date_part('month', created_at) = date_part('month', current_date)
    and date_part('year', created_at) = date_part('year', current_date);

    -- Simulação de impostos (ex: 6% do faturamento para Simples Nacional)
    select coalesce(sum(total_amount) * 0.06, 0)
    into v_pending_taxes
    from sales
    where date_part('month', created_at) = date_part('month', current_date)
    and date_part('year', created_at) = date_part('year', current_date)
    and status = 'completed';

    v_result := json_build_object(
        'issued_invoices', v_invoices_count,
        'estimated_taxes', round(v_pending_taxes, 2)
    );

    return v_result;
end;
$$;

-- Grants (Permissões)
grant execute on function get_dashboard_stats(int) to authenticated;
grant execute on function get_sales_chart_data(int) to authenticated;
grant execute on function get_fiscal_summary() to authenticated;
