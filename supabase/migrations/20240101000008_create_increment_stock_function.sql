-- Função para incrementar o estoque de um produto (estorno)

create or replace function public.increment_stock(p_product_id bigint, p_quantity integer)
returns void as $$
begin
  update public.products
  set stock_quantity = stock_quantity + p_quantity
  where id = p_product_id;
end;
$$ language plpgsql security definer;
