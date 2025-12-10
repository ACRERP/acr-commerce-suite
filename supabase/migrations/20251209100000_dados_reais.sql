-- Script: Dados REAIS (compatível com estrutura atual)
-- Data: 10/12/2025
-- IMPORTANTE: Limpa dados existentes antes de inserir novos

-- ============ LIMPAR DADOS EXISTENTES ============
TRUNCATE TABLE financial_transactions CASCADE;
TRUNCATE TABLE service_orders CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE clients CASCADE;

-- ============ CLIENTES (10) ============
INSERT INTO clients (name, email, phone, cpf_cnpj, address, city, state, cep, person_type) VALUES
('João Silva', 'joao.silva@email.com', '(11) 98765-4321', '123.456.789-00', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 'PF'),
('Maria Santos', 'maria.santos@email.com', '(11) 98765-4322', '234.567.890-11', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100', 'PF'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '(11) 98765-4323', '345.678.901-22', 'Rua Augusta, 789', 'São Paulo', 'SP', '01305-000', 'PF'),
('Ana Costa', 'ana.costa@email.com', '(11) 98765-4324', '456.789.012-33', 'Av. Rebouças, 321', 'São Paulo', 'SP', '05401-000', 'PF'),
('Carlos Souza', 'carlos.souza@email.com', '(11) 98765-4325', '567.890.123-44', 'Rua Oscar Freire, 654', 'São Paulo', 'SP', '01426-000', 'PF'),
('Juliana Lima', 'juliana.lima@email.com', '(11) 98765-4326', '678.901.234-55', 'Av. Faria Lima, 987', 'São Paulo', 'SP', '01452-000', 'PF'),
('Roberto Alves', 'roberto.alves@email.com', '(11) 98765-4327', '789.012.345-66', 'Rua Haddock Lobo, 147', 'São Paulo', 'SP', '01414-000', 'PF'),
('Fernanda Rocha', 'fernanda.rocha@email.com', '(11) 98765-4328', '890.123.456-77', 'Av. Brigadeiro, 258', 'São Paulo', 'SP', '01402-000', 'PF'),
('Lucas Martins', 'lucas.martins@email.com', '(11) 98765-4329', '901.234.567-88', 'Rua da Consolação, 369', 'São Paulo', 'SP', '01301-000', 'PF'),
('Patricia Ferreira', 'patricia.ferreira@email.com', '(11) 98765-4330', '012.345.678-99', 'Av. Ipiranga, 741', 'São Paulo', 'SP', '01046-000', 'PF');

-- ============ VENDAS (50) - Últimos 30 dias ============
DO $$
DECLARE
  v_client_id BIGINT;
  v_date TIMESTAMP;
  v_status TEXT;
  i INT;
BEGIN
  FOR i IN 1..50 LOOP
    SELECT id INTO v_client_id FROM clients ORDER BY RANDOM() LIMIT 1;
    v_date := NOW() - (RANDOM() * INTERVAL '30 days');
    v_status := (ARRAY['orcamento', 'aprovado', 'producao', 'entregue'])[FLOOR(RANDOM() * 4 + 1)];
    
    INSERT INTO sales (client_id, total_amount, payment_method, status, created_at)
    VALUES (
      v_client_id,
      (RANDOM() * 2000 + 100)::NUMERIC(10,2),
      (ARRAY['dinheiro', 'debito', 'credito', 'pix'])[FLOOR(RANDOM() * 4 + 1)]::payment_method,
      v_status::sale_status,
      v_date
    );
  END LOOP;
END $$;

-- ============ OS (30) ============
DO $$
DECLARE
  v_client_id BIGINT;
  v_date TIMESTAMP;
  v_status TEXT;
  i INT;
BEGIN
  FOR i IN 1..30 LOOP
    SELECT id INTO v_client_id FROM clients ORDER BY RANDOM() LIMIT 1;
    v_date := NOW() - (RANDOM() * INTERVAL '60 days');
    v_status := (ARRAY['pendente', 'em_andamento', 'aguardando_peca', 'concluida', 'cancelada'])[FLOOR(RANDOM() * 5 + 1)];
    
    INSERT INTO service_orders (
      client_id,
      device_type,
      reported_issue,
      status,
      valor_total,
      created_at
    )
    VALUES (
      v_client_id,
      (ARRAY['Notebook', 'Desktop', 'Impressora', 'Monitor'])[FLOOR(RANDOM() * 4 + 1)],
      (ARRAY['Não liga', 'Tela quebrada', 'Lento', 'Vírus'])[FLOOR(RANDOM() * 4 + 1)],
      v_status,
      (RANDOM() * 500 + 50)::NUMERIC(10,2),
      v_date
    );
  END LOOP;
END $$;

-- ============ TRANSAÇÕES (100) ============
DO $$
DECLARE
  v_date TIMESTAMP;
  v_type TEXT;
  i INT;
BEGIN
  FOR i IN 1..100 LOOP
    v_date := NOW() - (RANDOM() * INTERVAL '180 days');
    v_type := (ARRAY['receita', 'despesa'])[FLOOR(RANDOM() * 2 + 1)];
    
    INSERT INTO financial_transactions (
      type,
      category,
      description,
      amount,
      payment_method,
      status,
      due_date,
      created_at
    )
    VALUES (
      v_type,
      CASE v_type
        WHEN 'receita' THEN (ARRAY['Vendas', 'Serviços'])[FLOOR(RANDOM() * 2 + 1)]
        ELSE (ARRAY['Fornecedores', 'Salários', 'Aluguel'])[FLOOR(RANDOM() * 3 + 1)]
      END,
      'Transação #' || i,
      (RANDOM() * 5000 + 100)::NUMERIC(10,2),
      (ARRAY['dinheiro', 'pix', 'boleto'])[FLOOR(RANDOM() * 3 + 1)],
      'pago',
      v_date,
      v_date
    );
  END LOOP;
END $$;

-- ============ VERIFICAÇÃO ============
SELECT 
  'Dados inseridos!' as resultado,
  (SELECT COUNT(*) FROM clients) as clientes,
  (SELECT COUNT(*) FROM sales) as vendas,
  (SELECT COUNT(*) FROM service_orders) as os,
  (SELECT COUNT(*) FROM financial_transactions) as transacoes;
