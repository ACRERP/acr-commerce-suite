export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export interface KnowledgeCategory {
  category: string;
  icon: string;
  articles: KnowledgeArticle[];
}

export const knowledgeBase: KnowledgeCategory[] = [
  {
    category: 'Licenciamento',
    icon: '🔐',
    articles: [
      {
        id: 'ativar-licenca',
        title: 'Como ativar minha licença?',
        content: `
# Como ativar minha licença

1. Acesse o menu **Configurações** > **Licença**
2. Clique em **"Ativar Licença"**
3. Digite sua chave no formato: XXXX-XXXX-XXXX-XXXX
4. Clique em **"Validar e Ativar"**

Sua licença será validada e o sistema será desbloqueado imediatamente!

**Onde encontrar minha chave?**
- Email de confirmação da compra
- Área do cliente (se comprou pelo site)
- Contate o suporte: (11) 98842-5669
        `,
        tags: ['licença', 'ativação', 'chave'],
      },
      {
        id: 'demo-vs-completa',
        title: 'Diferenças entre DEMO e versão completa',
        content: `
# DEMO vs Versão Completa

## Modo DEMO (Gratuito)
- ✅ 14 dias de teste
- ✅ Máximo 50 produtos
- ✅ Máximo 20 vendas
- ✅ 1 usuário
- ✅ Módulos básicos (Dashboard, Produtos, PDV)

## Versão Completa (Paga)
- ✅ Sem limitações de tempo
- ✅ Produtos ilimitados
- ✅ Vendas ilimitadas
- ✅ Usuários ilimitados
- ✅ Todos os módulos (CRM, Fiscal, Delivery, etc.)
- ✅ Suporte prioritário
        `,
        tags: ['demo', 'licença', 'diferenças'],
      },
    ],
  },
  {
    category: 'Primeiros Passos',
    icon: '🚀',
    articles: [
      {
        id: 'cadastrar-produtos',
        title: 'Como cadastrar produtos?',
        content: `
# Como cadastrar produtos

1. Acesse **Produtos** no menu lateral
2. Clique em **"+ Novo Produto"**
3. Preencha os dados:
   - Nome do produto
   - Código/SKU
   - Preço de venda
   - Preço de custo
   - Estoque inicial
4. Clique em **"Salvar"**

**Dica:** Você pode importar produtos em massa via Excel/CSV!
        `,
        tags: ['produtos', 'cadastro', 'estoque'],
      },
      {
        id: 'primeira-venda',
        title: 'Como fazer minha primeira venda?',
        content: `
# Como fazer minha primeira venda

1. Acesse **PDV** no menu lateral
2. Adicione produtos ao carrinho:
   - Busque pelo nome ou código
   - Clique em "Adicionar"
3. Selecione a forma de pagamento
4. Clique em **"Finalizar Venda"**
5. Imprima o recibo (opcional)

Pronto! Sua venda foi registrada no sistema.
        `,
        tags: ['venda', 'pdv', 'caixa'],
      },
    ],
  },
  {
    category: 'Problemas Comuns',
    icon: '⚠️',
    articles: [
      {
        id: 'sistema-lento',
        title: 'Sistema está lento, o que fazer?',
        content: `
# Sistema lento - Soluções

## Verifique sua conexão
- O ACR ERP precisa de internet estável
- Teste sua velocidade em: speedtest.net

## Limpe o cache do navegador
1. Pressione Ctrl + Shift + Delete
2. Selecione "Cache" e "Cookies"
3. Clique em "Limpar dados"
4. Recarregue a página (F5)

## Ainda está lento?
Entre em contato com o suporte:
📞 (11) 98842-5669
        `,
        tags: ['lentidão', 'performance', 'cache'],
      },
    ],
  },
];
