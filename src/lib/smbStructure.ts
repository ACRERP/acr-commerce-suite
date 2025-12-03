// Estrutura completa do banco de dados SMB v4.0a
// Análise para implementação no sistema ACR

export interface SMBSchema {
  // Tabelas Principais
  produtos: {
    CODIGO: number
    DESCRICAO: string
    UNIDADE: string
    PRECO_VENDA: number
    PRECO_CUSTO: number
    ESTOQUE: number
    ESTOQUE_MINIMO: number
    CATEGORIA: string
    BARRAS: string
    DATA_CADASTRO: string
    ULTIMA_ALTERACAO: string
    ATIVO: string
    FORNECEDOR: string
    MARGEM_LUCRO: number
    COMISSAO: number
    NCM: string
    CSOSN: string
    CFOP: string
    PESO: number
    VOLUME: number
    CONTROLA_ESTOQUE: string
    IMAGEM: string
    OBSERVACOES: string
  }

  clientes: {
    CODIGO: number
    NOME: string
    CPF_CNPJ: string
    RG_IE: string
    TELEFONE: string
    CELULAR: string
    EMAIL: string
    ENDERECO: string
    NUMERO: string
    COMPLEMENTO: string
    BAIRRO: string
    CIDADE: string
    UF: string
    CEP: string
    DATA_CADASTRO: string
    LIMITE_CREDITO: number
    TIPO: string // 'F' Física, 'J' Jurídica
    ATIVO: string
    DATA_NASCIMENTO: string
    PROFISSAO: string
    CONJUGE: string
    REFERENCIA: string
    OBSERVACOES: string
  }

  vendas: {
    CODIGO: number
    DATA: string
    HORA: string
    COD_CLIENTE: number
    COD_VENDEDOR: number
    TOTAL: number
    DESCONTO: number
    ACRESCIMO: number
    FORMA_PAGTO: string
    PARCELAS: number
    SITUACAO: string // 'ABERTA', 'FECHADA', 'CANCELADA'
    TIPO: string // 'VENDA', 'ORCAMENTO', 'PEDIDO'
    OBSERVACAO: string
    VALOR_PAGO: number
    TROCO: number
    CPF_CLIENTE: string
    NOME_CLIENTE: string
    PLACA: string
    MESA: number
    COMANDA: number
    GARCOM: number
    TAXA_ENTREGA: number
    TAXA_SERVICO: number
    PERCENTUAL_SERVICO: number
    CHAVE_NFE: string
    NUMERO_NFE: number
    STATUS_NFE: string
    DATA_EMISSAO_NFE: string
    HORA_EMISSAO_NFE: string
    CHAVE_CTE: string
    NUMERO_CTE: number
    STATUS_CTE: string
  }

  itens_venda: {
    CODIGO: number
    COD_VENDA: number
    COD_PRODUTO: number
    QUANTIDADE: number
    PRECO_UNITARIO: number
    PRECO_TOTAL: number
    DESCONTO_ITEM: number
    ACRESCIMO_ITEM: number
    UNIDADE: string
    CUSTO_REAL: number
    LUCRO_ITEM: number
    COMISSAO_ITEM: number
    ALIQ_ICMS: number
    ALIQ_IPI: number
    ALIQ_PIS: number
    ALIQ_COFINS: number
    CFOP: string
    CST_ICMS: string
    CST_IPI: string
    CST_PIS: string
    CST_COFINS: string
    OBSERVACAO: string
  }

  vendedores: {
    CODIGO: number
    NOME: string
    CPF: string
    TELEFONE: string
    CELULAR: string
    EMAIL: string
    DATA_ADMISSAO: string
    SALARIO: number
    COMISSAO: number
    META_VENDAS: number
    PERCENTUAL_META: number
    SENHA: string
    ATIVO: string
    PERMISSOES: string
    CARGO: string
    ENDERECO: string
    BAIRRO: string
    CIDADE: string
    UF: string
    CEP: string
    OBSERVACOES: string
  }

  fornecedores: {
    CODIGO: number
    NOME: string
    CPF_CNPJ: string
    RG_IE: string
    TELEFONE: string
    CELULAR: string
    EMAIL: string
    CONTATO: string
    ENDERECO: string
    BAIRRO: string
    CIDADE: string
    UF: string
    CEP: string
    DATA_CADASTRO: string
    ATIVO: string
    BANCO: string
    AGENCIA: string
    CONTA: string
    TIPO_CONTA: string
    OBSERVACOES: string
  }

  contas_receber: {
    CODIGO: number
    COD_CLIENTE: number
    COD_VENDA: number
    DESCRICAO: string
    VALOR: number
    VALOR_PAGO: number
    DATA_VENCIMENTO: string
    DATA_PAGAMENTO: string
    SITUACAO: string // 'ABERTA', 'PAGA', 'VENCIDA'
    FORMA_PAGTO: string
    DOCUMENTO: string
    PARCELA: number
    TOTAL_PARCELAS: number
    JUROS: number
    MULTA: number
    DESCONTO: number
    OBSERVACOES: string
  }

  contas_pagar: {
    CODIGO: number
    COD_FORNECEDOR: number
    DESCRICAO: string
    VALOR: number
    VALOR_PAGO: number
    DATA_VENCIMENTO: string
    DATA_PAGAMENTO: string
    SITUACAO: string
    FORMA_PAGTO: string
    DOCUMENTO: string
    PARCELA: number
    TOTAL_PARCELAS: number
    JUROS: number
    MULTA: number
    DESCONTO: number
    CATEGORIA: string
    CENTRO_CUSTO: string
    OBSERVACOES: string
  }

  caixa: {
    CODIGO: number
    DATA_ABERTURA: string
    HORA_ABERTURA: string
    DATA_FECHAMENTO: string
    HORA_FECHAMENTO: string
    COD_OPERADOR: number
    VALOR_INICIAL: number
    VALOR_FINAL: number
    SANGRIA: number
    SUPRIMENTO: number
    VENDAS_DINHEIRO: number
    VENDAS_CARTAO: number
    VENDAS_DEBITO: number
    VENDAS_PIX: number
    VENDAS_CREDIARIO: number
    VENDAS_FIADO: number
    TOTAL_VENDAS: number
    SITUACAO: string // 'ABERTO', 'FECHADO'
    OBSERVACOES: string
  }

  movimentacoes_caixa: {
    CODIGO: number
    COD_CAIXA: number
    DATA: string
    HORA: string
    TIPO: string // 'SANGRIA', 'SUPRIMENTO', 'VENDA'
    VALOR: number
    FORMA_PAGTO: string
    DESCRICAO: string
    COD_OPERADOR: number
    DOCUMENTO: string
  }

  ordens_servico: {
    CODIGO: number
    DATA: string
    HORA: string
    COD_CLIENTE: number
    COD_EQUIPAMENTO: number
    COD_TECNICO: number
    PROBLEMA: string
    SOLUCAO: string
    STATUS: string // 'ABERTA', 'ANDAMENTO', 'CONCLUIDA', 'CANCELADA'
    PRIORIDADE: string // 'BAIXA', 'MEDIA', 'ALTA', 'URGENTE'
    DATA_CONCLUSAO: string
    HORA_CONCLUSAO: string
    VALOR_SERVICO: number
    VALOR_PECAS: number
    VALOR_TOTAL: number
    FORMA_PAGTO: string
    GARANTIA: number
    OBSERVACOES: string
  }

  equipamentos: {
    CODIGO: number
    COD_CLIENTE: number
    TIPO: string
    MARCA: string
    MODELO: string
    NUMERO_SERIE: string
    PATRIMONIO: string
    DATA_COMPRA: string
    GARANTIA_FABRICANTE: string
    GARANTIA_LOJA: string
    ACESSORIOS: string
    DEFEITO: string
    ESTADO: string
    OBSERVACOES: string
  }

  estoque: {
    CODIGO: number
    COD_PRODUTO: number
    COD_FORNECEDOR: number
    DATA: string
    TIPO: string // 'ENTRADA', 'SAIDA', 'AJUSTE'
    QUANTIDADE: number
    VALOR_UNITARIO: number
    VALOR_TOTAL: number
    DOCUMENTO: string
    NUMERO_NF: number
    SERIE_NF: string
    MOTIVO: string
    COD_OPERADOR: number
    OBSERVACOES: string
  }

  composicao: {
    CODIGO: number
    COD_PRODUTO_PAI: number
    COD_PRODUTO_FILHO: number
    QUANTIDADE: number
    UNIDADE: string
    CUSTO_RATEIO: number
    OBSERVACOES: string
  }

  tabelas_preco: {
    CODIGO: number
    DESCRICAO: string
    DATA_INICIO: string
    DATA_FIM: string
    ATIVO: string
    TIPO_CLIENTE: string
    OBSERVACOES: string
  }

  itens_tabela_preco: {
    CODIGO: number
    COD_TABELA: number
    COD_PRODUTO: number
    PRECO: number
    MARGEM_LUCRO: number
    DESCONTO_MAXIMO: number
    OBSERVACOES: string
  }

  promocoes: {
    CODIGO: number
    DESCRICAO: string
    DATA_INICIO: string
    DATA_FIM: string
    TIPO: string // 'PERCENTUAL', 'VALOR_FIXO', 'LEVE_X_PAGUE_Y'
    VALOR: number
    QUANTIDADE_MINIMA: number
    QUANTIDADE_PAGA: number
    COD_PRODUTO: number
    CATEGORIA: string
    ATIVO: string
    LIMITADO_CLIENTE: string
    QUANTIDADE_CLIENTE: number
    OBSERVACOES: string
  }

  delivery: {
    CODIGO: number
    COD_VENDA: number
    COD_CLIENTE: number
    COD_MOTOBOY: number
    DATA_PEDIDO: string
    HORA_PEDIDO: string
    DATA_ENTREGA: string
    HORA_ENTREGA: string
    ENDERECO_ENTREGA: string
    BAIRRO_ENTREGA: string
    CIDADE_ENTREGA: string
    UF_ENTREGA: string
    CEP_ENTREGA: string
    REFERENCIA: string
    TELEFONE_ENTREGA: string
    VALOR_ENTREGA: number
    KM: number
    STATUS: string // 'PENDENTE', 'EM_ROTA', 'ENTREGUE', 'CANCELADO'
    OBSERVACOES: string
  }

  motoboys: {
    CODIGO: number
    NOME: string
    CPF: string
    TELEFONE: string
    CELULAR: string
    CNH: string
    CATEGORIA_CNH: string
    VALIDADE_CNH: string
    PLACA_MOTO: string
    MODELO_MOTO: string
    COR_MOTO: string
    DATA_ADMISSAO: string
    SALARIO: number
    COMISSAO_ENTREGA: number
    ATIVO: string
    SENHA: string
    OBSERVACOES: string
  }

  mesas: {
    CODIGO: number
    NUMERO: number
    DESCRICAO: string
    CAPACIDADE: number
    STATUS: string // 'LIVRE', 'OCUPADA', 'RESERVADA'
    COD_GARCOM: number
    DATA_ABERTURA: string
    HORA_ABERTURA: string
    TOTAL: number
    OBSERVACOES: string
  }

  comandas: {
    CODIGO: number
    NUMERO: number
    COD_MESA: number
    COD_GARCOM: number
    DATA_ABERTURA: string
    HORA_ABERTURA: string
    DATA_FECHAMENTO: string
    HORA_FECHAMENTO: string
    STATUS: string // 'ABERTA', 'FECHADA', 'CANCELADA'
    TOTAL: number
    CLIENTE: string
    COUVERT: number
    TAXA_SERVICO: number
    OBSERVACOES: string
  }

  itens_comanda: {
    CODIGO: number
    COD_COMANDA: number
    COD_PRODUTO: number
    QUANTIDADE: number
    PRECO_UNITARIO: number
    PRECO_TOTAL: number
    STATUS: string // 'PENDENTE', 'ENVIADO', 'ENTREGUE', 'CANCELADO'
    DATA: string
    HORA: string
    OBSERVACOES: string
  }

  configuracoes: {
    EMPRESA_NOME: string
    EMPRESA_CNPJ: string
    EMPRESA_IE: string
    EMPRESA_ENDERECO: string
    EMPRESA_BAIRRO: string
    EMPRESA_CIDADE: string
    EMPRESA_UF: string
    EMPRESA_CEP: string
    EMPRESA_TELEFONE: string
    EMPRESA_EMAIL: string
    EMPRESA_SITE: string
    LOGOTIPO: string
    MENSAGEM_CUPOM: string
    MENSAGEM_ORCAMENTO: string
    VIA_CUPOM: number
    IMPRESSORA_CUPOM: string
    IMPRESSORA_NFE: string
    IMPRESSORA_ETIQUETA: string
    PORTA_IMPRESSORA: string
    TAXA_SERVICO_PADRAO: number
    COUVERT_ARTISTA: number
    CONTROLA_ESTOQUE: string
    CONTROLA_COMISSAO: string
    CONTROLA_CAIXA: string
    BLOQUEIA_ESTOQUE_NEGATIVO: string
    EXIGE_CPF_NF: string
    CALCULA_ICMS: string
    CALCULA_IPI: string
    CALCULA_PIS_COFINS: string
    AMBIENTE_NFE: string // '1' Produção, '2' Homologação
    CERTIFICADO_DIGITAL: string
    SENHA_CERTIFICADO: string
    TOKEN_SAT: string
    CODIGO_ATIVACAO_SAT: string
    ASSINATURA_AC_SAT: string
    NUMERO_CAIXA: string
    CAMINHO_BACKUP: string
    HORARIO_BACKUP: string
    DIAS_BACKUP: number
    LIMITE_CREDITO_CLIENTE: number
    VALIDADE_ORCAMENTO: number
    ARREDONDAMENTO: string // '00', '01', '05', '10', '25', '50'
    CASAS_DECIMAIS: number
    BLOQUEIA_PRECO_ZERO: string
    EXIBE_IMAGEM_PRODUTO: string
    TAMANHO_IMAGEM: number
    QUALIDADE_IMAGEM: number
    ATUALIZACAO_AUTOMATICA: string
    VERSAO_BANCO: string
    DATA_ULTIMA_ATUALIZACAO: string
    HORA_ULTIMA_ATUALIZACAO: string
  }

  usuarios: {
    CODIGO: number
    NOME: string
    USUARIO: string
    SENHA: string
    NIVEL: string // '1' Admin, '2' Gerente, '3' Operador, '4' Caixa
    PERMISSOES: string
    ATIVO: string
    DATA_CADASTRO: string
    ULTIMO_ACESSO: string
    HORARIO_ACESSO: string
    LIMITE_DESCONTO: number
    LIMITE_ACRESCIMO: number
    PERMITE_CANCELAR: string
    PERMITE_ALTERAR_PRECO: string
    PERMITE_REMOVER_ITEM: string
    PERMITE_ABRIR_CAIXA: string
    PERMITE_FECHAR_CAIXA: string
    PERMITE_SANGRIA: string
    PERMITE_SUPRIMENTO: string
    PERMITE_RELATORIOS: string
    PERMITE_CADASTROS: string
    PERMITE_ESTOQUE: string
    PERMITE_FINANCEIRO: string
    PERMITE_FISCAL: string
    OBSERVACOES: string
  }

  permissoes: {
    CODIGO: number
    DESCRICAO: string
    MODULO: string
    ACAO: string
    NIVEL_MINIMO: number
    ATIVO: string
    OBSERVACOES: string
  }
}

// Mapeamento para implementação no sistema ACR
export const mappingACR = {
  // Módulo Vendas
  vendas: {
    origem: 'vendas',
    destino: 'sales',
    campos: {
      CODIGO: 'id',
      DATA: 'created_at',
      HORA: 'created_at',
      COD_CLIENTE: 'client_id',
      COD_VENDEDOR: 'user_id',
      TOTAL: 'total_amount',
      DESCONTO: 'discount',
      FORMA_PAGTO: 'payment_method',
      SITUACAO: 'status'
    }
  },

  // Módulo Produtos
  produtos: {
    origem: 'produtos',
    destino: 'products',
    campos: {
      CODIGO: 'id',
      DESCRICAO: 'name',
      PRECO_VENDA: 'price',
      PRECO_CUSTO: 'cost_price',
      ESTOQUE: 'stock_quantity',
      ESTOQUE_MINIMO: 'minimum_stock_level',
      CATEGORIA: 'category',
      BARRAS: 'code'
    }
  },

  // Módulo Clientes
  clientes: {
    origem: 'clientes',
    destino: 'clients',
    campos: {
      CODIGO: 'id',
      NOME: 'name',
      CPF_CNPJ: 'cpf_cnpj',
      TELEFONE: 'phone',
      CELULAR: 'phone',
      EMAIL: 'email',
      ENDERECO: 'address',
      BAIRRO: 'address',
      CIDADE: 'address',
      UF: 'address',
      CEP: 'address'
    }
  },

  // Módulo Financeiro
  contas_receber: {
    origem: 'contas_receber',
    destino: 'accounts_receivable',
    campos: {
      CODIGO: 'id',
      COD_CLIENTE: 'client_id',
      DESCRICAO: 'description',
      VALOR: 'amount',
      DATA_VENCIMENTO: 'due_date',
      SITUACAO: 'status'
    }
  },

  // Módulo Estoque
  estoque: {
    origem: 'estoque',
    destino: 'inventory_movements',
    campos: {
      CODIGO: 'id',
      COD_PRODUTO: 'product_id',
      DATA: 'created_at',
      TIPO: 'type',
      QUANTIDADE: 'quantity',
      VALOR_UNITARIO: 'unit_price'
    }
  }
}

// Análise de implementação
export const implementationAnalysis = {
  // Estruturas já existentes no ACR
  existing: [
    'products',
    'clients', 
    'sales',
    'users',
    'profiles'
  ],

  // Estruturas a implementar
  toImplement: [
    'vendedores',
    'fornecedores',
    'contas_receber',
    'contas_pagar',
    'caixa',
    'ordens_servico',
    'estoque',
    'delivery',
    'mesas',
    'comandas',
    'configuracoes',
    'permissoes'
  ],

  // Módulos críticos para PDV
  pdvCritical: [
    'produtos',
    'clientes',
    'vendas',
    'itens_venda',
    'caixa',
    'vendedores',
    'usuarios',
    'configuracoes'
  ],

  // Módulos para restaurant/bar
  restaurantModules: [
    'mesas',
    'comandas',
    'itens_comanda',
    'garcom'
  ],

  // Módulos para delivery
  deliveryModules: [
    'delivery',
    'motoboys',
    'taxa_entrega'
  ],

  // Módulos fiscais
  fiscalModules: [
    'nfe',
    'cte',
    'nfce',
    'sat'
  ]
}
