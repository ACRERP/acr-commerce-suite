-- Adicionar colunas de preço à tabela de produtos

alter table public.products
add column price numeric(10, 2) not null default 0.00,
add column cost_price numeric(10, 2) not null default 0.00;

-- Comentários para clareza
comment on column public.products.price is 'Preço de venda do produto';
comment on column public.products.cost_price is 'Preço de custo do produto';
