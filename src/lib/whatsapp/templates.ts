// Templates de mensagens WhatsApp por módulo

export interface MessageTemplate {
  tipo: string;
  titulo: string;
  template: string;
  variaveis: string[];
}

// ============ MÓDULO OS ============

export const osTemplates: MessageTemplate[] = [
  {
    tipo: 'os_recebida',
    titulo: 'OS Recebida',
    template: `✅ *Equipamento Recebido!*

Olá {cliente_nome}!

Recebemos seu equipamento:
📱 {equipamento}
🔢 OS: *{numero_os}*
📅 Prazo: {prazo_entrega}

Você pode acompanhar o status pelo link:
{link_acompanhamento}

Qualquer dúvida, estamos à disposição!`,
    variaveis: ['cliente_nome', 'equipamento', 'numero_os', 'prazo_entrega', 'link_acompanhamento']
  },
  {
    tipo: 'os_em_analise',
    titulo: 'OS em Análise',
    template: `🔍 *Equipamento em Análise*

Olá {cliente_nome}!

Estamos analisando seu equipamento.
🔢 OS: *{numero_os}*

Em breve enviaremos o orçamento.

Aguarde nosso contato!`,
    variaveis: ['cliente_nome', 'numero_os']
  },
  {
    tipo: 'orcamento_pronto',
    titulo: 'Orçamento Pronto',
    template: `💰 *Orçamento Disponível*

Olá {cliente_nome}!

O orçamento do seu equipamento está pronto:

📱 {equipamento}
🔧 Serviço: {servico}
💵 Valor: *R$ {valor}*
⏱️ Prazo: {prazo}

Para aprovar, responda:
✅ SIM - Aprovar
❌ NÃO - Recusar

OS: {numero_os}`,
    variaveis: ['cliente_nome', 'equipamento', 'servico', 'valor', 'prazo', 'numero_os']
  },
  {
    tipo: 'os_em_reparo',
    titulo: 'OS em Reparo',
    template: `🔧 *Reparo Iniciado!*

Olá {cliente_nome}!

Iniciamos o reparo do seu equipamento.
🔢 OS: *{numero_os}*
📅 Previsão: {prazo_entrega}

Você receberá uma notificação quando estiver pronto!`,
    variaveis: ['cliente_nome', 'numero_os', 'prazo_entrega']
  },
  {
    tipo: 'os_concluida',
    titulo: 'OS Concluída',
    template: `🎉 *Equipamento Pronto!*

Olá {cliente_nome}!

Seu equipamento está pronto para retirada!

📱 {equipamento}
🔢 OS: *{numero_os}*
💵 Valor: R$ {valor}

📍 Endereço: {endereco}
🕐 Horário: {horario_funcionamento}

Aguardamos você!`,
    variaveis: ['cliente_nome', 'equipamento', 'numero_os', 'valor', 'endereco', 'horario_funcionamento']
  },
  {
    tipo: 'os_entregue',
    titulo: 'OS Entregue',
    template: `✨ *Obrigado pela Preferência!*

Olá {cliente_nome}!

Agradecemos por confiar em nossos serviços!

Como foi sua experiência?
⭐⭐⭐⭐⭐

Sua avaliação é muito importante para nós!

OS: {numero_os}`,
    variaveis: ['cliente_nome', 'numero_os']
  },
  {
    tipo: 'lembrete_retirada',
    titulo: 'Lembrete de Retirada',
    template: `⏰ *Lembrete: Equipamento Aguardando Retirada*

Olá {cliente_nome}!

Seu equipamento está pronto há {dias_aguardando} dias.

🔢 OS: *{numero_os}*
📱 {equipamento}

Por favor, retire o quanto antes para evitar taxas de armazenamento.

📍 {endereco}
🕐 {horario_funcionamento}`,
    variaveis: ['cliente_nome', 'dias_aguardando', 'numero_os', 'equipamento', 'endereco', 'horario_funcionamento']
  }
];

// ============ MÓDULO VENDAS ============

export const vendasTemplates: MessageTemplate[] = [
  {
    tipo: 'venda_confirmada',
    titulo: 'Venda Confirmada',
    template: `✅ *Pedido Confirmado!*

Olá {cliente_nome}!

Seu pedido foi confirmado:

🛒 Pedido: *#{numero_pedido}*
💵 Total: R$ {valor_total}
📦 Itens: {quantidade_itens}

{forma_pagamento}

Obrigado pela compra!`,
    variaveis: ['cliente_nome', 'numero_pedido', 'valor_total', 'quantidade_itens', 'forma_pagamento']
  },
  {
    tipo: 'nota_fiscal',
    titulo: 'Nota Fiscal Emitida',
    template: `📄 *Nota Fiscal Emitida*

Olá {cliente_nome}!

A nota fiscal do seu pedido foi emitida:

🛒 Pedido: #{numero_pedido}
📄 NF-e: {numero_nfe}
🔑 Chave: {chave_nfe}

Você pode consultar em:
{link_nfe}`,
    variaveis: ['cliente_nome', 'numero_pedido', 'numero_nfe', 'chave_nfe', 'link_nfe']
  },
  {
    tipo: 'promocao',
    titulo: 'Promoção',
    template: `🎁 *Promoção Especial!*

Olá {cliente_nome}!

Temos uma oferta especial para você:

{descricao_promocao}

💰 De: ~~R$ {preco_original}~~
💵 Por: *R$ {preco_promocional}*

Válido até: {data_validade}

Aproveite!`,
    variaveis: ['cliente_nome', 'descricao_promocao', 'preco_original', 'preco_promocional', 'data_validade']
  }
];

// ============ MÓDULO DELIVERY ============

export const deliveryTemplates: MessageTemplate[] = [
  {
    tipo: 'pedido_saiu_entrega',
    titulo: 'Pedido Saiu para Entrega',
    template: `🚚 *Pedido Saiu para Entrega!*

Olá {cliente_nome}!

Seu pedido saiu para entrega:

📦 Pedido: *#{numero_pedido}*
🚴 Entregador: {entregador_nome}
📍 Endereço: {endereco_entrega}
⏱️ Previsão: {tempo_estimado}

Acompanhe em tempo real:
{link_rastreamento}`,
    variaveis: ['cliente_nome', 'numero_pedido', 'entregador_nome', 'endereco_entrega', 'tempo_estimado', 'link_rastreamento']
  },
  {
    tipo: 'entregador_proximo',
    titulo: 'Entregador Próximo',
    template: `📍 *Entregador Chegando!*

Olá {cliente_nome}!

O entregador está próximo do seu endereço!

🚴 {entregador_nome}
📦 Pedido: #{numero_pedido}
⏱️ Chegada em: ~{minutos} minutos

Prepare-se para receber!`,
    variaveis: ['cliente_nome', 'entregador_nome', 'numero_pedido', 'minutos']
  },
  {
    tipo: 'pedido_entregue',
    titulo: 'Pedido Entregue',
    template: `✅ *Pedido Entregue!*

Olá {cliente_nome}!

Seu pedido foi entregue com sucesso!

📦 Pedido: #{numero_pedido}
🕐 Horário: {horario_entrega}

Bom apetite! 😋

Como foi a entrega?
⭐⭐⭐⭐⭐`,
    variaveis: ['cliente_nome', 'numero_pedido', 'horario_entrega']
  }
];

// ============ MÓDULO FINANCEIRO ============

export const financeiroTemplates: MessageTemplate[] = [
  {
    tipo: 'cobranca_vencimento',
    titulo: 'Lembrete de Vencimento',
    template: `💰 *Lembrete de Vencimento*

Olá {cliente_nome}!

Você tem uma conta vencendo em breve:

📄 Descrição: {descricao}
💵 Valor: R$ {valor}
📅 Vencimento: {data_vencimento}

Para evitar juros, efetue o pagamento até a data.

Dúvidas? Entre em contato!`,
    variaveis: ['cliente_nome', 'descricao', 'valor', 'data_vencimento']
  },
  {
    tipo: 'cobranca_vencida',
    titulo: 'Conta Vencida',
    template: `⚠️ *Conta Vencida*

Olá {cliente_nome}!

Identificamos uma conta vencida:

📄 Descrição: {descricao}
💵 Valor Original: R$ {valor_original}
💸 Valor com Juros: R$ {valor_com_juros}
📅 Vencimento: {data_vencimento}
⏰ Dias em Atraso: {dias_atraso}

Por favor, regularize sua situação.

Precisa de ajuda? Fale conosco!`,
    variaveis: ['cliente_nome', 'descricao', 'valor_original', 'valor_com_juros', 'data_vencimento', 'dias_atraso']
  },
  {
    tipo: 'pagamento_confirmado',
    titulo: 'Pagamento Confirmado',
    template: `✅ *Pagamento Confirmado!*

Olá {cliente_nome}!

Confirmamos o recebimento do seu pagamento:

📄 Descrição: {descricao}
💵 Valor: R$ {valor}
📅 Data: {data_pagamento}

Obrigado!`,
    variaveis: ['cliente_nome', 'descricao', 'valor', 'data_pagamento']
  }
];

// ============ MÓDULO MARKETING ============

export const marketingTemplates: MessageTemplate[] = [
  {
    tipo: 'boas_vindas',
    titulo: 'Boas-Vindas',
    template: `👋 *Bem-vindo(a)!*

Olá {cliente_nome}!

Seja bem-vindo(a) à {nome_empresa}!

Estamos felizes em tê-lo(a) conosco! 🎉

{mensagem_personalizada}

Qualquer dúvida, estamos à disposição!`,
    variaveis: ['cliente_nome', 'nome_empresa', 'mensagem_personalizada']
  },
  {
    tipo: 'aniversario',
    titulo: 'Aniversário',
    template: `🎂 *Feliz Aniversário!*

Olá {cliente_nome}!

Hoje é um dia especial! 🎉

Parabéns pelos seus {idade} anos!

Como presente, preparamos um cupom especial:

🎁 Código: *{codigo_cupom}*
💰 Desconto: {percentual_desconto}%

Válido até: {data_validade}

Aproveite!`,
    variaveis: ['cliente_nome', 'idade', 'codigo_cupom', 'percentual_desconto', 'data_validade']
  },
  {
    tipo: 'cliente_inativo',
    titulo: 'Cliente Inativo',
    template: `😢 *Sentimos sua Falta!*

Olá {cliente_nome}!

Faz tempo que não nos vemos...

Última compra: {data_ultima_compra}

Preparamos uma oferta especial para você voltar:

🎁 {oferta_especial}

Esperamos você!`,
    variaveis: ['cliente_nome', 'data_ultima_compra', 'oferta_especial']
  },
  {
    tipo: 'feedback',
    titulo: 'Solicitação de Feedback',
    template: `⭐ *Sua Opinião é Importante!*

Olá {cliente_nome}!

Como foi sua experiência conosco?

{contexto}

Avalie de 1 a 5:
⭐ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐ ⭐⭐⭐⭐⭐

Seu feedback nos ajuda a melhorar!`,
    variaveis: ['cliente_nome', 'contexto']
  }
];

// ============ FUNÇÃO AUXILIAR ============

export function formatTemplate(template: string, variables: Record<string, any>): string {
  let formatted = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    formatted = formatted.replace(regex, String(value || ''));
  });
  
  return formatted;
}

// ============ EXPORTAR TODOS ============

export const allTemplates = {
  os: osTemplates,
  vendas: vendasTemplates,
  delivery: deliveryTemplates,
  financeiro: financeiroTemplates,
  marketing: marketingTemplates
};

export function getTemplateByTipo(modulo: string, tipo: string): MessageTemplate | undefined {
  const templates = allTemplates[modulo as keyof typeof allTemplates];
  return templates?.find(t => t.tipo === tipo);
}
