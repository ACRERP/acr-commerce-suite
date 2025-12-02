-- Tabela principal de produtos para atender o escopo completo
create table public.products_rows (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  description text,
  category text,
  subcategory text,
  brand text,
  status text not null default 'active' check (status in ('active', 'inactive', 'draft', 'low', 'critical')),
  sku text unique,
  barcode text unique,
  sale_price numeric(12,2) not null default 0,
  cost_price numeric(12,2),
  stock_qty integer not null default 0,
  min_stock integer not null default 0,
  auto_categorized boolean not null default false,
  category_source text not null default 'manual' check (category_source in ('manual', 'automatic', 'spreadsheet', 'api')),
  image_url text,
  spreadsheet_row_id text,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para gerar código automático do produto
create or replace function public.generate_product_code()
returns trigger as $$
begin
  if new.code is null then
    new.code := coalesce(new.sku, 'PRD-' || to_char(extract(epoch from new.created_at), 'FM999999999'));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_product_code
  before insert on public.products_rows
  for each row execute procedure public.generate_product_code();

comment on table public.products_rows is 'Catálogo central de produtos com informações de estoque e categorização automática.';
comment on column public.products_rows.code is 'Código interno padronizado (fallback para SKU).';
comment on column public.products_rows.category_source is 'Origem da categorização (manual, automática, planilha, API Supabase).';

create index products_rows_name_idx
  on public.products_rows using gin (to_tsvector('portuguese', coalesce(name, '')));

create index products_rows_category_idx
  on public.products_rows (category, subcategory);

create index products_rows_status_idx
  on public.products_rows (status);

create trigger handle_products_rows_updated_at
  before update on public.products_rows
  for each row execute procedure public.handle_updated_at();

alter table public.products_rows enable row level security;

create policy "Authenticated users can read products"
  on public.products_rows for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage products"
  on public.products_rows for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

insert into public.products_rows
  (name, sku, sale_price, cost_price, stock_qty, min_stock, category, subcategory, brand, status, description, auto_categorized, category_source)
values
  ('Capinha iPhone 14 Pro', 'CAP-IP14P-001', 89.90, 42.00, 45, 10, 'Acessórios', 'Capinhas', 'Apple', 'active', 'Capinha de silicone com proteção completa.', true, 'spreadsheet'),
  ('Carregador Tipo-C 20W', 'CAR-TC20-001', 45.00, 25.00, 28, 20, 'Energia', 'Carregadores', 'Baseus', 'active', 'Carregador rápido Type-C 20W.', true, 'spreadsheet'),
  ('Película de Vidro iPhone', 'PEL-VID-IP001', 35.00, 12.00, 15, 25, 'Acessórios', 'Películas', 'GShield', 'low', 'Película de vidro temperado 9H.', true, 'spreadsheet'),
  ('Fone Bluetooth TWS', 'FON-TWS-001', 159.90, 90.00, 12, 10, 'Áudio', 'Fones', 'SoundPro', 'active', 'Fone sem fio com case de carregamento.', false, 'manual');
