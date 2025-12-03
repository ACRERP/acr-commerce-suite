// Biblioteca para integração com Microsoft Access
// Opções para conectar dados do Access ao sistema React

// OPÇÃO 1: Exportar do Access para CSV/JSON
export interface AccessExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  tables: string[]
}

// OPÇÃO 2: Conectar via ODBC (requer backend)
export interface AccessConnection {
  connectionString: string
  query: string
}

// OPÇÃO 3: Usar Node.js com node-odbc (backend)
export interface AccessODBCConfig {
  driver: 'Microsoft Access Driver (*.mdb, *.accdb)'
  database: string
  query: string
}

// Exemplos de queries comuns para ERP
export const commonAccessQueries = {
  // Produtos
  products: `
    SELECT 
      p.id,
      p.nome as name,
      p.descricao as description,
      p.categoria as category,
      p.marca as brand,
      p.codigo as code,
      p.estoque_atual as stock_quantity,
      p.estoque_minimo as minimum_stock_level,
      p.preco_venda as price,
      p.preco_custo as cost_price,
      p.data_cadastro as created_at,
      p.data_atualizacao as updated_at
    FROM produtos p
    ORDER BY p.nome
  `,
  
  // Clientes
  clients: `
    SELECT 
      c.id,
      c.nome as name,
      c.email,
      c.telefone as phone,
      c.endereco as address,
      c.cpf_cnpj,
      c.data_cadastro as created_at,
      c.data_atualizacao as updated_at
    FROM clientes c
    ORDER BY c.nome
  `,
  
  // Vendas
  sales: `
    SELECT 
      v.id,
      v.cliente_id as client_id,
      v.usuario_id as user_id,
      v.data_venda as created_at,
      v.total_amount,
      v.forma_pagamento as payment_method,
      v.status,
      iv.produto_id as product_id,
      iv.quantidade as quantity,
      iv.preco_unitario as price
    FROM vendas v
    INNER JOIN itens_venda iv ON v.id = iv.venda_id
    ORDER BY v.data_venda DESC
  `
}

// Função para mapear dados do Access para nosso formato
export function mapAccessData(accessData: any[], table: string) {
  switch (table) {
    case 'products':
      return accessData.map(item => ({
        id: item.id,
        name: item.name || item.nome,
        description: item.description || item.descricao,
        category: item.category || item.categoria,
        brand: item.brand || item.marca,
        code: item.code || item.codigo,
        stock_quantity: parseInt(item.stock_quantity || item.estoque_atual) || 0,
        minimum_stock_level: parseInt(item.minimum_stock_level || item.estoque_minimo) || 0,
        price: parseFloat(item.price || item.preco_venda) || 0,
        cost_price: parseFloat(item.cost_price || item.preco_custo) || 0,
        created_at: item.created_at || item.data_cadastro,
        updated_at: item.updated_at || item.data_atualizacao
      }))
    
    case 'clients':
      return accessData.map(item => ({
        id: item.id,
        name: item.name || item.nome,
        email: item.email,
        phone: item.phone || item.telefone,
        address: item.address || item.endereco,
        cpf_cnpj: item.cpf_cnpj,
        created_at: item.created_at || item.data_cadastro,
        updated_at: item.updated_at || item.data_atualizacao
      }))
    
    default:
      return accessData
  }
}

// Script para exportar do Access (instruções)
export const exportInstructions = `
INSTRUÇÕES PARA EXPORTAR DO ACCESS:

1. ABRIR O BANCO ACCESS:
   - Abra seu arquivo .mdb ou .accdb

2. EXPORTAR TABELAS:
   - Clique na tabela desejada
   - Vá em External Data > Export
   - Escolha formato: Excel ou Text File (CSV)
   - Salve o arquivo

3. IMPORTAR PARA NOSSO SISTEMA:
   - Use a página /import no sistema
   - Selecione o arquivo exportado
   - Confirme o mapeamento dos campos

4. OU MANIPULAR DIRETAMENTE:
   - Salve como CSV
   - Use ferramentas online para converter para JSON
   - Importe via SQL no Supabase

TABELAS RECOMENDADAS:
- produtos → products
- clientes → clients  
- vendas → sales
- itens_venda → sale_items
`
