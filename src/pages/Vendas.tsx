import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Plus, ShoppingCart, FileText, Target, Percent, Users, Search } from "lucide-react";
import { celebrateCompleteSale } from "@/lib/celebrations";

const cardBgColorClasses: Record<string, string> = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
};

const cardTextColorClasses: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_qty: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const Vendas = () => {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [showChart, setShowChart] = useState(true);

  const {
    data: customers,
    isLoading: loadingCustomers,
    error: customersError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });

  const {
    data: products,
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, sale_price, stock_qty")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = useMemo(
    () =>
      (products ?? []).filter((p) =>
        productSearch
          ? p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.sku ?? "").toLowerCase().includes(productSearch.toLowerCase())
          : true,
      ),
    [products, productSearch],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [cart],
  );

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) {
        throw new Error("Selecione um cliente para a venda.");
      }
      if (cart.length === 0) {
        throw new Error("Adicione ao menos um produto ao carrinho.");
      }

      const totalAmount = cartTotal;

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          customer_id: selectedCustomerId,
          total_amount: totalAmount,
          discount_amount: 0,
          channel: "loja",
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      const saleId = sale.id as string;

      const { error: itemsError } = await supabase.from("sale_items").insert(
        cart.map((item) => ({
          sale_id: saleId,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.sale_price,
          discount: 0,
          total_price: item.product.sale_price * item.quantity,
        })),
      );

      if (itemsError) throw itemsError;

      const { data: method, error: methodError } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("code", paymentMethod)
        .maybeSingle();

      if (methodError) throw methodError;

      if (method) {
        const { error: payError } = await supabase.from("sale_payments").insert({
          sale_id: saleId,
          method_id: method.id,
          amount: totalAmount,
        });
        if (payError) throw payError;
      }

      return saleId;
    },
    onSuccess: () => {
      // 🎉 CELEBRAÇÃO PREMIUM!
      const saleAmount = cartTotal;
      celebrateCompleteSale(saleAmount);

      // Limpar carrinho
      setCart([]);
      setPaymentMethod("dinheiro");

      // Toast premium com emoji baseado no valor
      const emoji = saleAmount > 5000 ? "🎊" : saleAmount > 1000 ? "🎉" : "✅";
      const message = saleAmount > 5000
        ? "Venda VIP registrada com sucesso!"
        : saleAmount > 1000
          ? "Ótima venda registrada!"
          : "Venda registrada com sucesso!";

      toast({
        title: `${emoji} ${message}`,
        description: `Valor total: ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(saleAmount)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar venda",
        description: error?.message ?? "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">

        {/* Header Section Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Vendas & PDV
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Gerencie vendas e orçamentos com agilidade
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="btn-secondary gap-2 hover-lift"
              onClick={() => setShowChart(!showChart)}
            >
              <Target className="w-4 h-4" />
              {showChart ? "Ocultar Gráficos" : "Ver Métricas"}
            </Button>
            <Button variant="outline" className="btn-secondary gap-2 hover-lift">
              <FileText className="w-4 h-4" />
              Orçamentos
            </Button>
            <Button
              className="btn-primary hover-lift gap-2"
              onClick={() => {
                if (cart.length > 0) {
                  if (confirm("Iniciar uma nova venda? O carrinho atual será limpo.")) {
                    setCart([]);
                    setSelectedCustomerId(undefined);
                    toast({ title: "Nova venda iniciada" });
                  }
                } else {
                  setCart([]);
                  setSelectedCustomerId(undefined);
                  toast({ title: "Nova venda pronta" });
                  // Focus search input logic could go here
                }
              }}
            >
              <Plus className="w-4 h-4" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Stats Grid - Controlled by showChart */}
        {showChart && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-down">
            <div className="card-premium hover-lift group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">PDV Ativo</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Caixa Aberto</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="card-premium hover-lift group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Orçamentos</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">5 pendentes</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="card-premium hover-lift group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Ticket Médio</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">R$ 145,00</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="card-premium hover-lift group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Comissões</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">R$ 1.250,00</p>
                </div>
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Sale Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Payment Card */}
            <div className="card-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary-500/50 to-success-500/50"></div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary-500" />
                Dados da Venda
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cliente</label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={(value) => setSelectedCustomerId(value)}
                  >
                    <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-primary/20">
                      <SelectValue placeholder={loadingCustomers ? "Carregando..." : "Selecione o cliente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.phone ? `• ${customer.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pagamento</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value)}
                  >
                    <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                      <SelectItem value="pix">💠 PIX</SelectItem>
                      <SelectItem value="cartao">💳 Cartão</SelectItem>
                      <SelectItem value="fiado">📝 Fiado (A Prazo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Product Search & List */}
            <div className="card-premium p-0 overflow-hidden">
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-primary-500" />
                  Catálogo de Produtos
                </h3>
                <div className="flex-1 md:max-w-md relative">
                  {/* Search Icon inside Input */}
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar por nome, código ou SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {loadingProducts ? "..." : filteredProducts.length}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Produto</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-gray-700 dark:text-gray-300">SKU</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Estoque</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.slice(0, 10).map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-primary/5 transition-colors group"
                        onClick={() => addToCart(product)}
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                          {product.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {product.sku || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.stock_qty <= 5
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                            {product.stock_qty} un
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(product.sale_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Cart Sidebar - Styled like a Receipt */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col h-[calc(100vh-140px)] sticky top-24">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  Cesta de Compras
                </h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
                  {cart.length} itens
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="text-center text-sm font-medium">Sua cesta está vazia</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.product.sale_price)} un
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-500 -mt-1 -mr-1"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <span className="sr-only">Remover</span>
                        &times;
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-8">
                        <button
                          className="px-2 text-gray-500 hover:text-primary transition-colors text-lg leading-none"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >-</button>
                        <span className="px-2 text-sm font-semibold min-w-[1.5rem] text-center">{item.quantity}</span>
                        <button
                          className="px-2 text-gray-500 hover:text-primary transition-colors text-lg leading-none"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >+</button>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.product.sale_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Descontos</span>
                  <span>R$ 0,00</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Total a Pagar</span>
                <span className="text-2xl font-extrabold text-primary">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cartTotal)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  className="col-span-1 h-12 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                  title="Enviar Orçamento no WhatsApp"
                  onClick={() => {
                    const itemsList = cart.map(i => `${i.quantity}x ${i.product.name}`).join('\n');
                    const total = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cartTotal);
                    const text = `*Novo Pedido*\n\n${itemsList}\n\n*Total: ${total}*`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  disabled={cart.length === 0}
                >
                  <Users className="w-5 h-5" />
                </Button>
                <Button
                  className="col-span-3 h-12 text-lg font-bold btn-primary hover-lift"
                  onClick={() => createSaleMutation.mutate()}
                  disabled={createSaleMutation.isPending || cart.length === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {createSaleMutation.isPending ? "Processando..." : "Finalizar Venda"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Vendas;
