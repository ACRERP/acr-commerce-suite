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
import { Plus, ShoppingCart, FileText, Target, Percent } from "lucide-react";

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
      setCart([]);
      setPaymentMethod("dinheiro");
      toast({
        title: "Venda registrada",
        description: "A venda foi salva com sucesso.",
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Vendas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas vendas, orçamentos e metas
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Venda
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "PDV", desc: "Ponto de Venda", icon: ShoppingCart, color: "primary" },
            { title: "Orçamentos", desc: "Criar e gerenciar", icon: FileText, color: "accent" },
            { title: "Metas", desc: "Controle de metas", icon: Target, color: "success" },
            { title: "Comissões", desc: "Gestão de comissões", icon: Percent, color: "warning" },
          ].map((item, index) => (
            <button
              key={item.title}
              className={`stat-card text-left hover:border-primary/30 transition-all duration-200 animate-fade-in ${index === 0 ? 'animation-delay-100' : index === 1 ? 'animation-delay-200' : index === 2 ? 'animation-delay-300' : 'animation-delay-400'}`}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${cardBgColorClasses[item.color]}`}>
                <item.icon className={`w-6 h-6 ${cardTextColorClasses[item.color]}`} />
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDV / Formulário de venda */}
          <div className="lg:col-span-2 stat-card">
            <h3 className="section-title mb-4">Nova Venda</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Cliente</p>
                <Select
                  value={selectedCustomerId}
                  onValueChange={(value) => setSelectedCustomerId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCustomers ? "Carregando clientes..." : "Selecione um cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone ? `• ${customer.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customersError && (
                  <p className="text-xs text-destructive">Erro ao carregar clientes.</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Forma de pagamento</p>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="fiado">Fiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar produto por nome ou SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {loadingProducts
                    ? "Carregando produtos..."
                    : `${filteredProducts.length} produtos`}
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="hidden md:table-cell">SKU</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer hover:bg-secondary/40"
                        onClick={() => addToCart(product)}
                      >
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.stock_qty}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(product.sale_price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Carrinho / Resumo da venda */}
          <div className="stat-card">
            <h3 className="section-title mb-4">Carrinho</h3>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-60" />
                <p>Nenhum item no carrinho</p>
                <p className="text-xs mt-1">Clique em um produto para adicioná-lo</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-start justify-between gap-3 rounded-lg bg-secondary/30 px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.product.sale_price)}
                          {" • "}Qtd:
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.product.id,
                                Number(e.target.value) || 1,
                              )
                            }
                            className="inline-flex h-7 w-16 ml-1 text-xs"
                          />
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-semibold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.product.sale_price * item.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(cartTotal)}
                  </span>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => createSaleMutation.mutate()}
                  disabled={createSaleMutation.isPending || cart.length === 0}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {createSaleMutation.isPending ? "Registrando venda..." : "Registrar Venda"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Vendas;
