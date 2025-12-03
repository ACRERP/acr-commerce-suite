-- Procedure para criar venda com itens em transação
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
BEGIN
  -- Iniciar transação
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

  -- Inserir itens da venda
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

  -- Retornar venda completa com itens
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

-- Grant permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.create_sale_with_items TO authenticated;
