-- Função para obter estatísticas gerais do dashboard
create or replace function public.get_dashboard_stats()
returns json as $$
declare
  total_sales_amount numeric;
  total_orders bigint;
  total_clients bigint;
  products_low_stock bigint;
begin
  select coalesce(sum(total_amount), 0) into total_sales_amount from public.sales where status = 'concluida';
  select count(*) into total_orders from public.sales;
  select count(*) into total_clients from public.clients;
  select count(*) into products_low_stock from public.products where stock_quantity <= minimum_stock_level;

  return json_build_object(
    'total_sales_amount', total_sales_amount,
    'total_orders', total_orders,
    'total_clients', total_clients,
    'products_low_stock', products_low_stock
  );
end;
$$ language plpgsql security definer;

-- Função para obter vendas ao longo do tempo (para gráficos)
create or replace function public.get_sales_over_time(days integer default 30)
returns table(sale_date date, total numeric) as $$
begin
  return query
    select date_trunc('day', s.created_at)::date as sale_date, sum(s.total_amount) as total
    from public.sales s
    where s.created_at >= now() - (days || ' days')::interval and s.status = 'concluida'
    group by sale_date
    order by sale_date asc;
end;
$$ language plpgsql security definer;

-- Função para obter atividades recentes
create or replace function public.get_recent_activities()
returns table(activity_type text, description text, amount numeric, created_at timestamptz) as $$
begin
  return query
    select 'Venda' as activity_type, c.name as description, s.total_amount as amount, s.created_at
    from public.sales s
    left join public.clients c on s.client_id = c.id
    order by s.created_at desc
    limit 5;
end;
$$ language plpgsql security definer;

-- Função para obter produtos mais vendidos
create or replace function public.get_top_products()
returns table(product_name text, total_sold bigint) as $$
begin
  return query
    select p.name as product_name, sum(si.quantity) as total_sold
    from public.sale_items si
    join public.products p on si.product_id = p.id
    group by p.name
    order by total_sold desc
    limit 5;
end;
$$ language plpgsql security definer;
