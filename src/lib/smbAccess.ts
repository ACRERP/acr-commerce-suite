// Integração com SMB v4.0a (Sistema de Gerenciamento de Bares e Restaurantes)
// Conectando dados do SMB para o novo sistema ERP

export interface SMBCredentials {
  databasePath: string
  username?: string
  password?: string
}

// Estrutura típica de dados SMB v4.0a
export interface SMBProduct {
  CODIGO: string
  DESCRICAO: string
  UNIDADE: string
  PRECO_VENDA: number
  PRECO_CUSTO: number
  ESTOQUE: number
  ESTOQUE_MINIMO: number
  CATEGORIA: string
  BARRAS?: string
  DATA_CADASTRO: string
  ULTIMA_ALTERACAO: string
}

export interface SMBCustomer {
  CODIGO: string
  NOME: string
  CPF_CNPJ: string
  TELEFONE: string
  ENDERECO: string
  BAIRRO: string
  CIDADE: string
  UF: string
  CEP: string
  LIMIT_CREDITO?: number
  DATA_CADASTRO: string
}

export interface SMBSale {
  CODIGO: string
  DATA: string
  HORA: string
  COD_CLIENTE: string
  COD_VENDEDOR: string
  TOTAL: number
  DESCONTO: number
  ACRESCIMO: number
  FORMA_PAGTO: string
  SITUACAO: string
  OBSERVACAO?: string
}

export interface SMBSaleItem {
  CODIGO: string
  COD_VENDA: string
  COD_PRODUTO: string
  QUANTIDADE: number
  PRECO_UNITARIO: number
  PRECO_TOTAL: number
  DESCONTO_ITEM: number
}

// Queries para extrair dados do SMB
export const smbQueries = {
  // Produtos
  products: `
    SELECT 
      p.CODIGO,
      p.DESCRICAO,
      p.UNIDADE,
      p.PRECO_VENDA,
      p.PRECO_CUSTO,
      p.ESTOQUE,
      p.ESTOQUE_MINIMO,
      p.CATEGORIA,
      p.BARRAS,
      p.DATA_CADASTRO,
      p.ULTIMA_ALTERACAO
    FROM PRODUTOS p
    WHERE p.ATIVO = 'S'
    ORDER BY p.DESCRICAO
  `,
  
  // Clientes
  customers: `
    SELECT 
      c.CODIGO,
      c.NOME,
      c.CPF_CNPJ,
      c.TELEFONE,
      c.ENDERECO,
      c.BAIRRO,
      c.CIDADE,
      c.UF,
      c.CEP,
      c.LIMIT_CREDITO,
      c.DATA_CADASTRO
    FROM CLIENTES c
    WHERE c.ATIVO = 'S'
    ORDER BY c.NOME
  `,
  
  // Vendas
  sales: `
    SELECT 
      v.CODIGO,
      v.DATA,
      v.HORA,
      v.COD_CLIENTE,
      v.COD_VENDEDOR,
      v.TOTAL,
      v.DESCONTO,
      v.ACRESCIMO,
      v.FORMA_PAGTO,
      v.SITUACAO,
      v.OBSERVACAO
    FROM VENDAS v
    WHERE v.DATA >= #01/01/2024#
    ORDER BY v.DATA DESC, v.HORA DESC
  `,
  
  // Itens das Vendas
  saleItems: `
    SELECT 
      i.CODIGO,
      i.COD_VENDA,
      i.COD_PRODUTO,
      i.QUANTIDADE,
      i.PRECO_UNITARIO,
      i.PRECO_TOTAL,
      i.DESCONTO_ITEM
    FROM ITENS_VENDA i
    INNER JOIN VENDAS v ON i.COD_VENDA = v.CODIGO
    WHERE v.DATA >= #01/01/2024#
  `
}

// Mapeamento dos dados SMB para nosso formato
export function mapSMBData(smbData: any[], table: string) {
  switch (table) {
    case 'products':
      return smbData.map((item: SMBProduct) => ({
        id: parseInt(item.CODIGO),
        name: item.DESCRICAO,
        description: item.DESCRICAO,
        category: item.CATEGORIA,
        brand: '',
        code: item.CODIGO,
        stock_quantity: parseInt(item.ESTOQUE) || 0,
        minimum_stock_level: parseInt(item.ESTOQUE_MINIMO) || 0,
        price: parseFloat(item.PRECO_VENDA) || 0,
        cost_price: parseFloat(item.PRECO_CUSTO) || 0,
        created_at: item.DATA_CADASTRO,
        updated_at: item.ULTIMA_ALTERACAO
      }))
    
    case 'customers':
      return smbData.map((item: SMBCustomer) => ({
        id: parseInt(item.CODIGO),
        name: item.NOME,
        email: '',
        phone: item.TELEFONE,
        address: `${item.ENDERECO}, ${item.BAIRRO}, ${item.CIDADE} - ${item.UF}`,
        cpf_cnpj: item.CPF_CNPJ,
        created_at: item.DATA_CADASTRO,
        updated_at: item.DATA_CADASTRO
      }))
    
    case 'sales':
      return smbData.map((item: SMBSale) => ({
        id: parseInt(item.CODIGO),
        client_id: parseInt(item.COD_CLIENTE) || null,
        user_id: item.COD_VENDEDOR,
        total_amount: parseFloat(item.TOTAL) || 0,
        payment_method: mapPaymentMethod(item.FORMA_PAGTO),
        status: mapSaleStatus(item.SITUACAO),
        created_at: `${item.DATA} ${item.HORA}`,
        updated_at: `${item.DATA} ${item.HORA}`
      }))
    
    case 'saleItems':
      return smbData.map((item: SMBSaleItem) => ({
        id: parseInt(item.CODIGO),
        sale_id: parseInt(item.COD_VENDA),
        product_id: parseInt(item.COD_PRODUTO),
        quantity: parseFloat(item.QUANTIDADE) || 0,
        price: parseFloat(item.PRECO_UNITARIO) || 0
      }))
    
    default:
      return smbData
  }
}

// Mapear formas de pagamento
function mapPaymentMethod(smbMethod: string): string {
  const methods: Record<string, string> = {
    'DINHEIRO': 'dinheiro',
    'CARTAO': 'cartao_credito',
    'DEBITO': 'cartao_debito',
    'PIX': 'pix',
    'FIADO': 'fiado',
    'CREDIARIO': 'fiado'
  }
  return methods[smbMethod.toUpperCase()] || 'dinheiro'
}

// Mapear status da venda
function mapSaleStatus(smbStatus: string): string {
  const statuses: Record<string, string> = {
    'ABERTA': 'pendente',
    'FECHADA': 'concluida',
    'CANCELADA': 'cancelada'
  }
  return statuses[smbStatus.toUpperCase()] || 'concluida'
}

// Instruções para exportar do SMB v4.0a
export const smbExportInstructions = `
COMO EXPORTAR DADOS DO SMB v4.0a:

OPÇÃO 1 - VIA RELATÓRIOS DO SMB:
1. Abrir o sistema SMB
2. Ir em Relatórios → Produtos → Listagem Completa
3. Clicar em Exportar → Salvar como CSV/Excel
4. Repetir para Clientes e Vendas

OPÇÃO 2 - VIA BANCO DE DADOS:
1. Localizar arquivo .mdb do SMB (geralmente em C:\\SMB\\DADOS\\)
2. Abrir com Microsoft Access
3. Exportar tabelas:
   - PRODUTOS
   - CLIENTES  
   - VENDAS
   - ITENS_VENDA

OPÇÃO 3 - CONEXÃO DIRETA:
1. Instalar driver ODBC do Access
2. Configurar conexão com o banco SMB
3. Usar queries SQL para extrair dados

CAMPOS IMPORTANTES:
- Produtos: CODIGO, DESCRICAO, PRECO_VENDA, ESTOQUE
- Clientes: CODIGO, NOME, CPF_CNPJ, TELEFONE
- Vendas: CODIGO, DATA, TOTAL, FORMA_PAGTO
`
