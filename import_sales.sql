-- Importar Vendas SMB para Supabase
-- Execute este SQL no painel Supabase

-- 1. Importar Vendas (tblVendas)
INSERT INTO public.sales (
    id,
    client_id,
    user_id,
    total_amount,
    payment_method,
    status,
    discount,
    addition,
    installments,
    type,
    notes,
    amount_paid,
    change_amount,
    created_at,
    updated_at
)
SELECT 
    v.ID,
    v.IDCliente,
    NULL::uuid, -- user_id será null por enquanto
    v.Total,
    CASE 
        WHEN v.FormaPagto = 'DINHEIRO' THEN 'dinheiro'
        WHEN v.FormaPagto = 'CARTAO_CREDITO' THEN 'cartao_credito'
        WHEN v.FormaPagto = 'CARTAO_DEBITO' THEN 'cartao_debito'
        WHEN v.FormaPagto = 'PIX' THEN 'pix'
        ELSE 'fiado'
    END,
    CASE 
        WHEN v.Situacao = 'FECHADA' THEN 'concluida'
        WHEN v.Situacao = 'ABERTA' THEN 'pendente'
        WHEN v.Situacao = 'CANCELADA' THEN 'cancelada'
        ELSE 'concluida'
    END,
    COALESCE(v.Desconto, 0),
    COALESCE(v.Acrescimo, 0),
    COALESCE(v.Parcelas, 1),
    COALESCE(v.Tipo, 'sale'),
    v.Observacao,
    COALESCE(v.ValorPago, 0),
    COALESCE(v.Troco, 0),
    v.Data,
    NOW()
FROM json_populate_recordset(NULL::record, 
    '[
        {"ID": 1, "Data": "2025-12-03T16:37:53.813Z", "IDCliente": 266, "Total": 536.0443813949119, "Desconto": 18.467178033099117, "Acrescimo": 0, "FormaPagto": "DINHEIRO", "Parcelas": 1, "Situacao": "FECHADA", "Tipo": "VENDA", "Observacao": "", "ValorPago": 0, "Troco": 0}
    ]'
) AS v(ID bigint, Data timestamp, IDCliente bigint, Total numeric, Desconto numeric, Acrescimo numeric, FormaPagto text, Parcelas integer, Situacao text, Tipo text, Observacao text, ValorPago numeric, Troco numeric);

-- 2. Importar Itens de Venda (tblItensVenda)
INSERT INTO public.sale_items (
    id,
    sale_id,
    product_id,
    quantity,
    price,
    total_price,
    discount,
    addition,
    unit,
    created_at,
    updated_at
)
SELECT 
    i.ID,
    i.IDVenda,
    i.IDProduto,
    i.Quantidade,
    i.PrecoUnitario,
    i.Total,
    0, -- discount
    0, -- addition
    'UN',
    NOW(),
    NOW()
FROM json_populate_recordset(NULL::record,
    '[
        {"ID": 1, "IDVenda": 1, "IDProduto": 1, "Quantidade": 2, "PrecoUnitario": 50.0, "Total": 100.0}
    ]'
) AS i(ID bigint, IDVenda bigint, IDProduto bigint, Quantidade integer, PrecoUnitario numeric, Total numeric);

-- 3. Verificar importação
SELECT 'Vendas importadas: ' || COUNT(*) as resultado FROM public.sales;
SELECT 'Itens importados: ' || COUNT(*) as resultado FROM public.sale_items;
