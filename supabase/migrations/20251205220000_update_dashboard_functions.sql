-- Update function to include total_products
create or replace function public.get_dashboard_stats()
returns json as $$
declare
  total_sales_amount numeric;
  total_orders bigint;
  total_clients bigint;
  total_products bigint;
  products_low_stock bigint;
begin
  select coalesce(sum(total_amount), 0) into total_sales_amount from public.sales where status = 'concluida';
  select count(*) into total_orders from public.sales;
  select count(*) into total_clients from public.clients;
  select count(*) into total_products from public.products;
  select count(*) into products_low_stock from public.products where stock_quantity <= minimum_stock_level;

  return json_build_object(
    'total_sales_amount', total_sales_amount,
    'total_orders', total_orders,
    'total_clients', total_clients,
    'total_products', total_products,
    'products_low_stock', products_low_stock
  );
end;
$$ language plpgsql security definer;
