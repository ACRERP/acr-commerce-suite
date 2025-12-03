// Extrator de dados do Microsoft Access SMB v4.0a
// Sistema para análise e implementação no ACR

import { supabase } from './supabaseClient'

// Estrutura completa do banco Access SMB v4.0a
export interface AccessSMBStructure {
  // Tabelas Principais
  tblProdutos: Array<{
    ID: number
    Codigo: string
    Descricao: string
    Unidade: string
    PrecoVenda: number
    PrecoCusto: number
    Estoque: number
    EstoqueMinimo: number
    Categoria: string
    CodigoBarras: string
    Fornecedor: string
    DataCadastro: Date
    Ativo: boolean
    NCM: string
    CSOSN: string
    CFOP: string
    MargemLucro: number
    Comissao: number
    Peso: number
    Volume: number
    ControlaEstoque: boolean
    Imagem: string
    Observacoes: string
  }>

  tblClientes: Array<{
    ID: number
    Nome: string
    CPFCNPJ: string
    RG_IE: string
    Telefone: string
    Celular: string
    Email: string
    Endereco: string
    Numero: string
    Complemento: string
    Bairro: string
    Cidade: string
    UF: string
    CEP: string
    DataCadastro: Date
    LimiteCredito: number
    Tipo: string // 'F' Física, 'J' Jurídica
    Ativo: boolean
    DataNascimento: Date
    Profissao: string
    Conjuge: string
    Referencia: string
    Observacoes: string
  }>

  tblVendas: Array<{
    ID: number
    Data: Date
    Hora: string
    IDCliente: number
    IDVendedor: number
    Total: number
    Desconto: number
    Acrescimo: number
    FormaPagto: string
    Parcelas: number
    Situacao: string // 'ABERTA', 'FECHADA', 'CANCELADA'
    Tipo: string // 'VENDA', 'ORCAMENTO', 'PEDIDO'
    Observacao: string
    ValorPago: number
    Troco: number
    CPFCliente: string
    NomeCliente: string
    Placa: string
    Mesa: number
    Comanda: number
    Garcom: number
    TaxaEntrega: number
    TaxaServico: number
    PercentualServico: number
    ChaveNFE: string
    NumeroNFE: number
    StatusNFE: string
    DataEmissaoNFE: Date
    HoraEmissaoNFE: string
  }>

  tblItensVenda: Array<{
    ID: number
    IDVenda: number
    IDProduto: number
    Quantidade: number
    PrecoUnitario: number
    PrecoTotal: number
    DescontoItem: number
    AcrescimoItem: number
    Unidade: string
    CustoReal: number
    LucroItem: number
    ComissaoItem: number
    AliqICMS: number
    AliqIPI: number
    AliqPIS: number
    AliqCOFINS: number
    CFOP: string
    CST_ICMS: string
    CST_IPI: string
    CST_PIS: string
    CST_COFINS: string
    Observacao: string
  }>

  tblVendedores: Array<{
    ID: number
    Nome: string
    CPF: string
    Telefone: string
    Celular: string
    Email: string
    DataAdmissao: Date
    Salario: number
    Comissao: number
    MetaVendas: number
    PercentualMeta: number
    Senha: string
    Ativo: boolean
    Permissoes: string
    Cargo: string
    Endereco: string
    Bairro: string
    Cidade: string
    UF: string
    CEP: string
    Observacoes: string
  }>

  tblFornecedores: Array<{
    ID: number
    Nome: string
    CPFCNPJ: string
    RG_IE: string
    Telefone: string
    Celular: string
    Email: string
    Contato: string
    Endereco: string
    Bairro: string
    Cidade: string
    UF: string
    CEP: string
    DataCadastro: Date
    Ativo: boolean
    Banco: string
    Agencia: string
    Conta: string
    TipoConta: string
    Observacoes: string
  }>

  tblContasReceber: Array<{
    ID: number
    IDCliente: number
    IDVenda: number
    Descricao: string
    Valor: number
    ValorPago: number
    DataVencimento: Date
    DataPagamento: Date
    Situacao: string // 'ABERTA', 'PAGA', 'VENCIDA'
    FormaPagto: string
    Documento: string
    Parcela: number
    TotalParcelas: number
    Juros: number
    Multa: number
    Desconto: number
    Observacoes: string
  }>

  tblContasPagar: Array<{
    ID: number
    IDFornecedor: number
    Descricao: string
    Valor: number
    ValorPago: number
    DataVencimento: Date
    DataPagamento: Date
    Situacao: string
    FormaPagto: string
    Documento: string
    Parcela: number
    TotalParcelas: number
    Juros: number
    Multa: number
    Desconto: number
    Categoria: string
    CentroCusto: string
    Observacoes: string
  }>

  tblCaixa: Array<{
    ID: number
    DataAbertura: Date
    HoraAbertura: string
    DataFechamento: Date
    HoraFechamento: string
    IDOperador: number
    ValorInicial: number
    ValorFinal: number
    Sangria: number
    Suprimento: number
    VendasDinheiro: number
    VendasCartao: number
    VendasDebito: number
    VendasPIX: number
    VendasCrediario: number
    VendasFiado: number
    TotalVendas: number
    Situacao: string // 'ABERTO', 'FECHADO'
    Observacoes: string
  }>

  tblMovimentacoesCaixa: Array<{
    ID: number
    IDCaixa: number
    Data: Date
    Hora: string
    Tipo: string // 'SANGRIA', 'SUPRIMENTO', 'VENDA'
    Valor: number
    FormaPagto: string
    Descricao: string
    IDOperador: number
    Documento: string
  }>

  tblOrdensServico: {
    ID: number
    Data: Date
    Hora: string
    IDCliente: number
    IDEquipamento: number
    IDTecnico: number
    Problema: string
    Solucao: string
    Status: string // 'ABERTA', 'ANDAMENTO', 'CONCLUIDA', 'CANCELADA'
    Prioridade: string // 'BAIXA', 'MEDIA', 'ALTA', 'URGENTE'
    DataConclusao: Date
    HoraConclusao: string
    ValorServico: number
    ValorPecas: number
    ValorTotal: number
    FormaPagto: string
    Garantia: number
    Observacoes: string
  }

  tblEquipamentos: {
    ID: number
    IDCliente: number
    Tipo: string
    Marca: string
    Modelo: string
    NumeroSerie: string
    Patrimonio: string
    DataCompra: Date
    GarantiaFabricante: string
    GarantiaLoja: string
    Acessorios: string
    Defeito: string
    Estado: string
    Observacoes: string
  }

  tblEstoque: {
    ID: number
    IDProduto: number
    IDFornecedor: number
    Data: Date
    Tipo: string // 'ENTRADA', 'SAIDA', 'AJUSTE'
    Quantidade: number
    ValorUnitario: number
    ValorTotal: number
    Documento: string
    NumeroNF: number
    SerieNF: string
    Motivo: string
    IDOperador: number
    Observacoes: string
  }

  tblComposicao: {
    ID: number
    IDProdutoPai: number
    IDProdutoFilho: number
    Quantidade: number
    Unidade: string
    CustoRateio: number
    Observacoes: string
  }

  tblTabelasPreco: {
    ID: number
    Descricao: string
    DataInicio: Date
    DataFim: Date
    Ativo: boolean
    TipoCliente: string
    Observacoes: string
  }

  tblItensTabelaPreco: {
    ID: number
    IDTabela: number
    IDProduto: number
    Preco: number
    MargemLucro: number
    DescontoMaximo: number
    Observacoes: string
  }

  tblPromocoes: {
    ID: number
    Descricao: string
    DataInicio: Date
    DataFim: Date
    Tipo: string // 'PERCENTUAL', 'VALOR_FIXO', 'LEVE_X_PAGUE_Y'
    Valor: number
    QuantidadeMinima: number
    QuantidadePaga: number
    IDProduto: number
    Categoria: string
    Ativo: boolean
    LimitadoCliente: boolean
    QuantidadeCliente: number
    Observacoes: string
  }

  tblDelivery: {
    ID: number
    IDVenda: number
    IDCliente: number
    IDMotoBoy: number
    DataPedido: Date
    HoraPedido: string
    DataEntrega: Date
    HoraEntrega: string
    EnderecoEntrega: string
    BairroEntrega: string
    CidadeEntrega: string
    UFEntrega: string
    CEPEntrega: string
    Referencia: string
    TelefoneEntrega: string
    ValorEntrega: number
    KM: number
    Status: string // 'PENDENTE', 'EM_ROTA', 'ENTREGUE', 'CANCELADO'
    Observacoes: string
  }

  tblMotoBoys: {
    ID: number
    Nome: string
    CPF: string
    Telefone: string
    Celular: string
    CNH: string
    CategoriaCNH: string
    ValidadeCNH: Date
    PlacaMoto: string
    ModeloMoto: string
    CorMoto: string
    DataAdmissao: Date
    Salario: number
    ComissaoEntrega: number
    Ativo: boolean
    Senha: string
    Observacoes: string
  }

  tblMesas: {
    ID: number
    Numero: number
    Descricao: string
    Capacidade: number
    Status: string // 'LIVRE', 'OCUPADA', 'RESERVADA'
    IDGarcom: number
    DataAbertura: Date
    HoraAbertura: string
    Total: number
    Observacoes: string
  }

  tblComandas: {
    ID: number
    Numero: number
    IDMesa: number
    IDGarcom: number
    DataAbertura: Date
    HoraAbertura: string
    DataFechamento: Date
    HoraFechamento: string
    Status: string // 'ABERTA', 'FECHADA', 'CANCELADA'
    Total: number
    Cliente: string
    Couvert: number
    TaxaServico: number
    Observacoes: string
  }

  tblItensComanda: {
    ID: number
    IDComanda: number
    IDProduto: number
    Quantidade: number
    PrecoUnitario: number
    PrecoTotal: number
    Status: string // 'PENDENTE', 'ENVIADO', 'ENTREGUE', 'CANCELADO'
    Data: Date
    Hora: string
    Observacoes: string
  }

  tblConfiguracoes: {
    EmpresaNome: string
    EmpresaCNPJ: string
    EmpresaIE: string
    EmpresaEndereco: string
    EmpresaBairro: string
    EmpresaCidade: string
    EmpresaUF: string
    EmpresaCEP: string
    EmpresaTelefone: string
    EmpresaEmail: string
    EmpresaSite: string
    Logotipo: string
    MensagemCupom: string
    MensagemOrcamento: string
    ViaCupom: number
    ImpressoraCupom: string
    ImpressoraNFE: string
    ImpressoraEtiqueta: string
    PortaImpressora: string
    TaxaServicoPadrao: number
    CouvertArtista: number
    ControlaEstoque: boolean
    ControlaComissao: boolean
    ControlaCaixa: boolean
    BloqueiaEstoqueNegativo: boolean
    ExigeCPFNF: boolean
    CalculaICMS: boolean
    CalculaIPI: boolean
    CalculaPISCOFINS: boolean
    AmbienteNFE: string // '1' Produção, '2' Homologação
    CertificadoDigital: string
    SenhaCertificado: string
    TokenSAT: string
    CodigoAtivacaoSAT: string
    AssinaturaACSAT: string
    NumeroCaixa: string
    CaminhoBackup: string
    HorarioBackup: string
    DiasBackup: number
    LimiteCreditoCliente: number
    ValidadeOrcamento: number
    Arredondamento: string // '00', '01', '05', '10', '25', '50'
    CasasDecimais: number
    BloqueiaPrecoZero: boolean
    ExibeImagemProduto: boolean
    TamanhoImagem: number
    QualidadeImagem: number
    AtualizacaoAutomatica: boolean
    VersaoBanco: string
    DataUltimaAtualizacao: Date
    HoraUltimaAtualizacao: string
  }

  tblUsuarios: {
    ID: number
    Nome: string
    Usuario: string
    Senha: string
    Nivel: string // '1' Admin, '2' Gerente, '3' Operador, '4' Caixa
    Permissoes: string
    Ativo: boolean
    DataCadastro: Date
    UltimoAcesso: Date
    HorarioAcesso: string
    LimiteDesconto: number
    LimiteAcrescimo: number
    PermiteCancelar: boolean
    PermiteAlterarPreco: boolean
    PermiteRemoverItem: boolean
    PermiteAbrirCaixa: boolean
    PermiteFecharCaixa: boolean
    PermiteSangria: boolean
    PermiteSuprimento: boolean
    PermiteRelatorios: boolean
    PermiteCadastros: boolean
    PermiteEstoque: boolean
    PermiteFinanceiro: boolean
    PermiteFiscal: boolean
    Observacoes: string
  }

  tblPermissoes: {
    ID: number
    Descricao: string
    Modulo: string
    Acao: string
    NivelMinimo: number
    Ativo: boolean
    Observacoes: string
  }
}

// Função para extrair dados do Access
export class AccessSMBExtractor {
  private filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  // Verificar se o arquivo Access existe
  async verifyFile(): Promise<boolean> {
    try {
      // Simulação - na implementação real usaria biblioteca como 'node-adodb' ou 'mdb-tools'
      console.log(`Verificando arquivo: ${this.filePath}`)
      return true
    } catch (error) {
      console.error('Erro ao verificar arquivo:', error)
      return false
    }
  }

  // Extrair todas as tabelas
  async extractAllTables(): Promise<Partial<AccessSMBStructure>> {
    const extractedData: Partial<AccessSMBStructure> = {}

    try {
      // Simulação de extração de dados
      console.log('Iniciando extração de dados do SMB v4.0a...')

      // Na implementação real, aqui seria feita a conexão com o Access
      // e extração de cada tabela

      return extractedData
    } catch (error) {
      console.error('Erro na extração:', error)
      throw error
    }
  }

  // Mapear dados para o sistema ACR
  async mapToACR(accessData: Partial<AccessSMBStructure>): Promise<{
    products?: Array<{
      id: number
      name: string
      code: string
      description: string
      price: number
      cost_price: number
      stock_quantity: number
      minimum_stock_level: number
      category: string
      barcode: string
      unit: string
      supplier: string
      ncm: string
      csosn: string
      cfop: string
      margin: number
      commission: number
      weight: number
      volume: number
      track_inventory: boolean
      image_url: string
      notes: string
      created_at: Date
      active: boolean
    }>
    clients?: Array<{
      id: number
      name: string
      cpf_cnpj: string
      rg_ie: string
      phone: string
      mobile: string
      email: string
      address: string
      complement: string
      neighborhood: string
      city: string
      state: string
      zip_code: string
      credit_limit: number
      type: string
      birth_date: Date
      profession: string
      spouse: string
      reference: string
      notes: string
      created_at: Date
      active: boolean
    }>
    sales?: Array<{
      id: number
      client_id: number
      user_id: number
      total_amount: number
      discount: number
      addition: number
      payment_method: string
      installments: number
      status: string
      type: string
      notes: string
      amount_paid: number
      change: number
      client_cpf: string
      client_name: string
      plate: string
      table: number
      command: number
      waiter: number
      delivery_fee: number
      service_fee: number
      service_percentage: number
      nfe_key: string
      nfe_number: number
      nfe_status: string
      nfe_date: Date
      nfe_time: string
      created_at: Date
      created_at_time: string
    }>
    sale_items?: Array<{
      id: number
      sale_id: number
      product_id: number
      quantity: number
      unit_price: number
      total_price: number
      discount: number
      addition: number
      unit: string
      real_cost: number
      profit: number
      commission: number
      icms_rate: number
      ipi_rate: number
      pis_rate: number
      cofins_rate: number
      cfop: string
      cst_icms: string
      cst_ipi: string
      cst_pis: string
      cst_cofins: string
      notes: string
    }>
  }> {
    const mappedData = {
      // Mapeamento de Produtos
      products: accessData.tblProdutos?.map(product => ({
        id: product.ID,
        name: product.Descricao,
        code: product.Codigo,
        description: product.Descricao,
        price: product.PrecoVenda,
        cost_price: product.PrecoCusto,
        stock_quantity: product.Estoque,
        minimum_stock_level: product.EstoqueMinimo,
        category: product.Categoria,
        barcode: product.CodigoBarras,
        unit: product.Unidade,
        supplier: product.Fornecedor,
        ncm: product.NCM,
        csosn: product.CSOSN,
        cfop: product.CFOP,
        margin: product.MargemLucro,
        commission: product.Comissao,
        weight: product.Peso,
        volume: product.Volume,
        track_inventory: product.ControlaEstoque,
        image_url: product.Imagem,
        notes: product.Observacoes,
        created_at: product.DataCadastro,
        active: product.Ativo
      })),

      // Mapeamento de Clientes
      clients: accessData.tblClientes?.map(client => ({
        id: client.ID,
        name: client.Nome,
        cpf_cnpj: client.CPFCNPJ,
        rg_ie: client.RG_IE,
        phone: client.Telefone,
        mobile: client.Celular,
        email: client.Email,
        address: `${client.Endereco}, ${client.Numero}`,
        complement: client.Complemento,
        neighborhood: client.Bairro,
        city: client.Cidade,
        state: client.UF,
        zip_code: client.CEP,
        credit_limit: client.LimiteCredito,
        type: client.Tipo,
        birth_date: client.DataNascimento,
        profession: client.Profissao,
        spouse: client.Conjuge,
        reference: client.Referencia,
        notes: client.Observacoes,
        created_at: client.DataCadastro,
        active: client.Ativo
      })),

      // Mapeamento de Vendas
      sales: accessData.tblVendas?.map(sale => ({
        id: sale.ID,
        client_id: sale.IDCliente,
        user_id: sale.IDVendedor,
        total_amount: sale.Total,
        discount: sale.Desconto,
        addition: sale.Acrescimo,
        payment_method: sale.FormaPagto,
        installments: sale.Parcelas,
        status: sale.Situacao,
        type: sale.Tipo,
        notes: sale.Observacao,
        amount_paid: sale.ValorPago,
        change: sale.Troco,
        client_cpf: sale.CPFCliente,
        client_name: sale.NomeCliente,
        plate: sale.Placa,
        table: sale.Mesa,
        command: sale.Comanda,
        waiter: sale.Garcom,
        delivery_fee: sale.TaxaEntrega,
        service_fee: sale.TaxaServico,
        service_percentage: sale.PercentualServico,
        nfe_key: sale.ChaveNFE,
        nfe_number: sale.NumeroNFE,
        nfe_status: sale.StatusNFE,
        nfe_date: sale.DataEmissaoNFE,
        nfe_time: sale.HoraEmissaoNFE,
        created_at: sale.Data,
        created_at_time: sale.Hora
      })),

      // Mapeamento de Itens de Venda
      sale_items: accessData.tblItensVenda?.map(item => ({
        id: item.ID,
        sale_id: item.IDVenda,
        product_id: item.IDProduto,
        quantity: item.Quantidade,
        unit_price: item.PrecoUnitario,
        total_price: item.PrecoTotal,
        discount: item.DescontoItem,
        addition: item.AcrescimoItem,
        unit: item.Unidade,
        real_cost: item.CustoReal,
        profit: item.LucroItem,
        commission: item.ComissaoItem,
        icms_rate: item.AliqICMS,
        ipi_rate: item.AliqIPI,
        pis_rate: item.AliqPIS,
        cofins_rate: item.AliqCOFINS,
        cfop: item.CFOP,
        cst_icms: item.CST_ICMS,
        cst_ipi: item.CST_IPI,
        cst_pis: item.CST_PIS,
        cst_cofins: item.CST_COFINS,
        notes: item.Observacao
      })),

      // Mapeamento de Vendedores
      sellers: accessData.tblVendedores?.map(seller => ({
        id: seller.ID,
        name: seller.Nome,
        cpf: seller.CPF,
        phone: seller.Telefone,
        mobile: seller.Celular,
        email: seller.Email,
        hire_date: seller.DataAdmissao,
        salary: seller.Salario,
        commission: seller.Comissao,
        sales_target: seller.MetaVendas,
        target_percentage: seller.PercentualMeta,
        password: seller.Senha,
        active: seller.Ativo,
        permissions: seller.Permissoes,
        position: seller.Cargo,
        address: seller.Endereco,
        neighborhood: seller.Bairro,
        city: seller.Cidade,
        state: seller.UF,
        zip_code: seller.CEP,
        notes: seller.Observacoes
      })),

      // Mapeamento de Fornecedores
      suppliers: accessData.tblFornecedores?.map(supplier => ({
        id: supplier.ID,
        name: supplier.Nome,
        cpf_cnpj: supplier.CPFCNPJ,
        rg_ie: supplier.RG_IE,
        phone: supplier.Telefone,
        mobile: supplier.Celular,
        email: supplier.Email,
        contact: supplier.Contato,
        address: supplier.Endereco,
        neighborhood: supplier.Bairro,
        city: supplier.Cidade,
        state: supplier.UF,
        zip_code: supplier.CEP,
        created_at: supplier.DataCadastro,
        active: supplier.Ativo,
        bank: supplier.Banco,
        agency: supplier.Agencia,
        account: supplier.Conta,
        account_type: supplier.TipoConta,
        notes: supplier.Observacoes
      })),

      // Mapeamento de Contas a Receber
      accounts_receivable: accessData.tblContasReceber?.map(account => ({
        id: account.ID,
        client_id: account.IDCliente,
        sale_id: account.IDVenda,
        description: account.Descricao,
        amount: account.Valor,
        amount_paid: account.ValorPago,
        due_date: account.DataVencimento,
        payment_date: account.DataPagamento,
        status: account.Situacao,
        payment_method: account.FormaPagto,
        document: account.Documento,
        installment: account.Parcela,
        total_installments: account.TotalParcelas,
        interest: account.Juros,
        fine: account.Multa,
        discount: account.Desconto,
        notes: account.Observacoes
      })),

      // Mapeamento de Contas a Pagar
      accounts_payable: accessData.tblContasPagar?.map(account => ({
        id: account.ID,
        supplier_id: account.IDFornecedor,
        description: account.Descricao,
        amount: account.Valor,
        amount_paid: account.ValorPago,
        due_date: account.DataVencimento,
        payment_date: account.DataPagamento,
        status: account.Situacao,
        payment_method: account.FormaPagto,
        document: account.Documento,
        installment: account.Parcela,
        total_installments: account.TotalParcelas,
        interest: account.Juros,
        fine: account.Multa,
        discount: account.Desconto,
        category: account.Categoria,
        cost_center: account.CentroCusto,
        notes: account.Observacoes
      })),

      // Mapeamento de Caixa
      cash_registers: accessData.tblCaixa?.map(register => ({
        id: register.ID,
        opening_date: register.DataAbertura,
        opening_time: register.HoraAbertura,
        closing_date: register.DataFechamento,
        closing_time: register.HoraFechamento,
        operator_id: register.IDOperador,
        opening_balance: register.ValorInicial,
        closing_balance: register.ValorFinal,
        withdrawals: register.Sangria,
        supplements: register.Suprimento,
        cash_sales: register.VendasDinheiro,
        card_sales: register.VendasCartao,
        debit_sales: register.VendasDebito,
        pix_sales: register.VendasPIX,
        credit_sales: register.VendasCrediario,
        credit_sales_fiado: register.VendasFiado,
        total_sales: register.TotalVendas,
        status: register.Situacao,
        notes: register.Observacoes
      })),

      // Mapeamento de Movimentações de Caixa
      cash_movements: accessData.tblMovimentacoesCaixa?.map(movement => ({
        id: movement.ID,
        cash_register_id: movement.IDCaixa,
        date: movement.Data,
        time: movement.Hora,
        type: movement.Tipo,
        amount: movement.Valor,
        payment_method: movement.FormaPagto,
        description: movement.Descricao,
        operator_id: movement.IDOperador,
        document: movement.Documento
      }))
    }

    return mappedData
  }

  // Importar dados para o Supabase
  async importToSupabase(mappedData: {
    products?: Array<any>
    clients?: Array<any>
    sales?: Array<any>
    sale_items?: Array<any>
  }) {
    try {
      console.log('Iniciando importação para o Supabase...')

      // Importar Produtos
      if (mappedData.products?.length > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .upsert(mappedData.products)
        
        if (productsError) throw productsError
        console.log(`${mappedData.products.length} produtos importados`)
      }

      // Importar Clientes
      if (mappedData.clients?.length > 0) {
        const { error: clientsError } = await supabase
          .from('clients')
          .upsert(mappedData.clients)
        
        if (clientsError) throw clientsError
        console.log(`${mappedData.clients.length} clientes importados`)
      }

      // Importar Vendas
      if (mappedData.sales?.length > 0) {
        const { error: salesError } = await supabase
          .from('sales')
          .upsert(mappedData.sales)
        
        if (salesError) throw salesError
        console.log(`${mappedData.sales.length} vendas importadas`)
      }

      // Importar Itens de Venda
      if (mappedData.sale_items?.length > 0) {
        const { error: itemsError } = await supabase
          .from('sale_items')
          .upsert(mappedData.sale_items)
        
        if (itemsError) throw itemsError
        console.log(`${mappedData.sale_items.length} itens de venda importados`)
      }

      // Continuar com outras tabelas...

      console.log('Importação concluída com sucesso!')
      return true
    } catch (error) {
      console.error('Erro na importação:', error)
      throw error
    }
  }

  // Processo completo de extração e importação
  async fullProcess() {
    try {
      // 1. Verificar arquivo
      const fileExists = await this.verifyFile()
      if (!fileExists) {
        throw new Error('Arquivo Access não encontrado')
      }

      // 2. Extrair dados
      const accessData = await this.extractAllTables()

      // 3. Mapear para ACR
      const mappedData = await this.mapToACR(accessData)

      // 4. Importar para Supabase
      await this.importToSupabase(mappedData)

      return {
        success: true,
        message: 'Processo concluído com sucesso',
        summary: {
          products: mappedData.products?.length || 0,
          clients: mappedData.clients?.length || 0,
          sales: mappedData.sales?.length || 0,
          sale_items: mappedData.sale_items?.length || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      }
    }
  }
}

// Função para uso no componente
export async function extractAccessData(filePath: string) {
  const extractor = new AccessSMBExtractor(filePath)
  return await extractor.fullProcess()
}

// Análise de compatibilidade
export const compatibilityAnalysis = {
  // Estruturas 100% compatíveis
  fullyCompatible: [
    'products',
    'clients',
    'sales',
    'sale_items'
  ],

  // Estruturas parcialmente compatíveis
  partiallyCompatible: [
    'sellers',
    'suppliers',
    'accounts_receivable',
    'accounts_payable',
    'cash_registers',
    'cash_movements'
  ],

  // Estruturas que precisam ser criadas
  needsCreation: [
    'service_orders',
    'equipment',
    'inventory_movements',
    'product_composition',
    'price_tables',
    'promotions',
    'delivery',
    'delivery_drivers',
    'tables',
    'commands',
    'command_items',
    'configurations',
    'users',
    'permissions'
  ],

  // Módulos críticos para PDV
  pdvModules: [
    'products',
    'clients',
    'sales',
    'sale_items',
    'cash_registers',
    'cash_movements',
    'users'
  ],

  // Módulos para restaurante
  restaurantModules: [
    'tables',
    'commands',
    'command_items'
  ],

  // Módulos para delivery
  deliveryModules: [
    'delivery',
    'delivery_drivers'
  ]
}
