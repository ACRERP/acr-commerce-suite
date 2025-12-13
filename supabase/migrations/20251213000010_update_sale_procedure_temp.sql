-- 1. Fix Schema Mismatch
-- clients.id is BIGINT, but financial_transactions.client_id was created as UUID.
-- We must convert financial_transactions.client_id to BIGINT.

DO $$
BEGIN
    -- Check if column is uuid (implementation detail to avoid error if already fixed)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'financial_transactions' 
        AND column_name = 'client_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop foreign key first
        ALTER TABLE public.financial_transactions DROP CONSTRAINT IF EXISTS financial_transactions_client_id_fkey;
        
        -- Change column type (using NULL to avoid casting errors, assuming clean slate or acceptable data loss for this dev fix)
        ALTER TABLE public.financial_transactions ALTER COLUMN client_id TYPE bigint USING NULL;
        
        -- Re-add foreign key
        ALTER TABLE public.financial_transactions 
        ADD CONSTRAINT financial_transactions_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id);
    END IF;
END $$;

-- 2. Update create_sale_with_items to automatically create a financial transaction
CREATE OR REPLACE FUNCTION create_sale_with_items(
  sale_data jsonb,
  sale_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_sale_id bigint;
  result jsonb;
  v_type varchar(20);
  v_status varchar(20);
  v_due_date date;
  v_payment_date date;
  v_category_id uuid;
BEGIN
  -- 1. Create Sale Record
  INSERT INTO public.sales (
    client_id,
    total_amount,
    payment_method,
    status
  ) VALUES (
    (sale_data->>'client_id')::bigint,
    (sale_data->>'total_amount')::numeric,
    sale_data->>'payment_method',
    COALESCE(sale_data->>'status', 'concluida')::public.sale_status
  ) RETURNING id INTO new_sale_id;

  -- 2. Create Sale Items
  INSERT INTO public.sale_items (
    sale_id,
    product_id,
    quantity,
    price
  ) SELECT
    new_sale_id,
    (item->>'product_id')::bigint,
    (item->>'quantity')::integer,
    (item->>'price')::numeric
  FROM jsonb_array_elements(sale_items) AS item;

  -- 3. Determine Financial Transaction Details
  v_type := 'receivable';
  v_status := CASE WHEN (sale_data->>'payment_method') = 'fiado' THEN 'pending' ELSE 'paid' END;
  v_due_date := CURRENT_DATE;
  v_payment_date := CASE WHEN v_status = 'paid' THEN CURRENT_DATE ELSE NULL END;

  -- 4. Get or Create "Vendas" Category
  SELECT id INTO v_category_id FROM public.financial_categories WHERE name = 'Vendas' LIMIT 1;
  
  IF v_category_id IS NULL THEN
      INSERT INTO public.financial_categories (name, type, color, created_by)
      VALUES ('Vendas', 'income', '#22c55e', auth.uid())
      RETURNING id INTO v_category_id;
  END IF;

  -- 5. Create Financial Transaction
  INSERT INTO public.financial_transactions (
    description,
    amount,
    type,
    status,
    due_date,
    payment_date,
    client_id,
    category_id,
    reference_number,
    notes,
    created_by
  ) VALUES (
    'Venda PDV #' || new_sale_id,
    (sale_data->>'total_amount')::numeric,
    v_type,
    v_status,
    v_due_date,
    v_payment_date,
    (sale_data->>'client_id')::bigint,
    v_category_id,
    new_sale_id::text,
    'Venda PDV - Método: ' || (sale_data->>'payment_method'),
    auth.uid()
  );

  -- 6. Return Result
  SELECT jsonb_build_object(
    'id', s.id,
    'client_id', s.client_id,
    'user_id', s.user_id,
    'total_amount', s.total_amount,
    'payment_method', s.payment_method,
    'status', s.status,
    'created_at', s.created_at,
    'updated_at', s.updated_at
  ) INTO result
  FROM public.sales s
  WHERE s.id = new_sale_id;

  RETURN result;
END;
$$;
