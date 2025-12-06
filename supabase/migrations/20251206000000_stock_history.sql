-- Create Stock Movements Table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  new_stock_level INTEGER NOT NULL,
  movement_type VARCHAR(50) NOT NULL, -- 'sale', 'restock', 'correction', 'return', 'manual_adjustment'
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  tenant_id UUID -- Optional depending on tenancy model, but products don't have it yet?
);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock movements" 
ON stock_movements FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert stock movements" 
ON stock_movements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Update decrement_stock function to log movement
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  v_new_stock := v_current_stock - p_quantity;

  -- Update product
  UPDATE products
  SET stock_quantity = v_new_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  -- Log movement
  INSERT INTO stock_movements (
    product_id,
    quantity_change,
    new_stock_level,
    movement_type,
    description,
    user_id
  ) VALUES (
    p_product_id,
    -p_quantity,
    v_new_stock,
    'sale',
    'Venda realizada via PDV',
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for manual updates (e.g. via edit form)
CREATE OR REPLACE FUNCTION log_stock_update()
RETURNS TRIGGER AS $$
DECLARE
  v_change INTEGER;
BEGIN
  -- Only log if stock_quantity changed
  IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
    v_change := NEW.stock_quantity - OLD.stock_quantity;
    
    -- Try to avoid double logging if called from decrement_stock?
    -- decrement_stock logs explicitly.
    -- If we have a trigger, decrement_stock might trigger this too.
    -- We can check if a log was recently added or use a session variable.
    -- OR, simpler: decrement_stock does the UPDATE which fires this trigger.
    -- So decrement_stock SHOULD NOT Insert manually if the trigger does it?
    -- But the trigger doesn't know the "reason" ('sale').
    -- Strategy:
    -- 1. Use the trigger for generic updates.
    -- 2. decrement_stock updates the description/type specifically?
    -- OR
    -- 2. decrement_stock sets a local variable `stock.reason`? No.
    
    -- Improved Strategy:
    -- Remove manual INSERT from decrement_stock and rely on Trigger?
    -- But Trigger defaults to 'manual_adjustment'.
    -- We can check if `current_setting('app.stock_movement_reason', true)` is set.
    
    INSERT INTO stock_movements (
      product_id,
      quantity_change,
      new_stock_level,
      movement_type,
      description,
      user_id
    ) VALUES (
      NEW.id,
      v_change,
      NEW.stock_quantity,
      COALESCE(current_setting('app.stock_movement_type', true), 'manual_update'),
      COALESCE(current_setting('app.stock_movement_description', true), 'Atualização manual de estoque'),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- However, setting session variables from client is not easy with standard supabase client updates.
-- So for now, to enable the PDV 'sale' type, I will NOT use a general trigger on UPDATE yet.
-- I'll stick to explicit logging in `decrement_stock` and maybe manual logging for other actions?
-- OR, I just drop the Trigger idea for now and only log in `decrement_stock`.
-- BUT then manual edits in ProductForm won't be logged.
-- That's a gap.
-- I will create the table and update `decrement_stock` as planned (Explicit log).
-- For ProductForm edits, I won't have a log yet unless I update the updateProduct function to also insert a log.
-- That is acceptable for now. I'll just do `decrement_stock` update.

DROP TRIGGER IF EXISTS on_stock_change ON products;
