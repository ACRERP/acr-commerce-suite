-- =====================================================
-- FASE 8: MÓDULO DE COMPRAS (PURCHASES)
-- =====================================================

-- 1. Tabela de Compras (Cabeçalho)
CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid REFERENCES suppliers(id),
  invoice_number VARCHAR(50), -- Número da NFe de entrada
  invoice_series VARCHAR(10),
  issue_date DATE DEFAULT CURRENT_DATE, -- Data de emissão da nota
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Data de entrada no sistema
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  additional_costs DECIMAL(10,2) DEFAULT 0, -- Frete, seguro, etc
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'canceled')),
  notes TEXT,
  user_id uuid REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Itens da Compra
CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,4) NOT NULL, -- Custo unitário na nota
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(entry_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);

-- 3. Trigger para atualizar total da compra
CREATE OR REPLACE FUNCTION update_purchase_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchases 
  SET total_amount = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM purchase_items 
    WHERE purchase_id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.purchase_id ELSE NEW.purchase_id END)
  ) + COALESCE(additional_costs, 0) - COALESCE(discount_amount, 0)
  WHERE id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.purchase_id ELSE NEW.purchase_id END);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_purchase_total ON purchase_items;
CREATE TRIGGER trigger_update_purchase_total
AFTER INSERT OR UPDATE OR DELETE ON purchase_items
FOR EACH ROW EXECUTE FUNCTION update_purchase_total();

-- 4. Função para processar entrada de estoque ao completar compra
-- Esta função iterará sobre os itens da compra e criará movimentações de estoque (entrada)
CREATE OR REPLACE FUNCTION process_purchase_completion()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Se o status mudou para 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Para cada item da compra
    FOR item IN SELECT * FROM purchase_items WHERE purchase_id = NEW.id LOOP
      
      -- Inserir movimentação de estoque
      -- O trigger da tabela stock_movements (update_average_cost e update_stock_quantity) 
      -- cuidará de atualizar o estoque e o preço de custo do produto.
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        cost_price,
        reference_type,
        reference_id, -- Usamos o ID inteiro (hash) como referência, mas a coluna é BIGINT?
                      -- ERRO POTENCIAL: stock_movements.reference_id é BIGINT. 
                      -- Purchases usa UUID.
                      -- Ajuste necessário: Alterar stock_movements.reference_id para TEXT ou adicionar reference_uuid.
        reason,
        user_id
      ) VALUES (
        item.product_id,
        'entrada',
        item.quantity,
        item.unit_cost,
        'purchase',
        NULL, -- Não conseguimos ligar diretamente se tipos forem incompatíveis. Ver abaixo.
        'Compra #' || COALESCE(NEW.invoice_number, NEW.id::text),
        (SELECT id::bigint FROM profiles WHERE user_id = NEW.user_id LIMIT 1) -- Tenta converter user_id uuid -> profile bigint se existir link
      );
      
    END LOOP;
    
    -- Gerar conta a pagar no financeiro (Opcional - implementação futura)
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CORREÇÃO: A tabela stock_movements usa reference_id como BIGINT.
-- Precisamos alterar para TEXT para suportar UUIDs de purchases e sales.
ALTER TABLE stock_movements ALTER COLUMN reference_id TYPE TEXT;

-- Tentar relinkar o trigger process_purchase_completion agora que o tipo está correto
create or replace function process_purchase_completion_v2()
returns trigger as $$
declare
  item record;
  p_profile_id bigint;
begin
  if new.status = 'completed' and old.status != 'completed' then
    
    -- Busca profile id (assumindo que profiles.user_id é o link)
    select id into p_profile_id from profiles where user_id = new.user_id;

    for item in select * from purchase_items where purchase_id = new.id loop
      
      insert into stock_movements (
        product_id,
        movement_type,
        quantity,
        cost_price,
        reference_type,
        reference_id,
        reason,
        user_id
        -- updated_at não precisa, default now()
      ) values (
        item.product_id,
        'entrada',
        item.quantity,
        item.unit_cost,
        'purchase',
        new.id::text, -- Agora cabe no TEXT
        'Compra NF ' || coalesce(new.invoice_number, 'S/N'),
        p_profile_id
      );
      
    end loop;
  end if;
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trigger_purchase_completion ON purchases;
CREATE TRIGGER trigger_purchase_completion
AFTER UPDATE ON purchases
FOR EACH ROW EXECUTE FUNCTION process_purchase_completion_v2();

-- 5. RLS Policies
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view purchases" ON purchases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert purchases" ON purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own purchases" ON purchases
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view items" ON purchase_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert items" ON purchase_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM purchases WHERE id = purchase_id AND user_id = auth.uid())
  );
