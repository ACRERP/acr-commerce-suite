import { useMemo, useState } from "react";
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
import { Plus, ShoppingCart, Users, Search, Package, CreditCard, Sparkles, X, ArrowLeft } from "lucide-react";
import { celebrateCompleteSale } from "@/lib/celebrations";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";
import { useCreateSale } from "@/hooks/useSales";
import { Product } from "@/lib/products";

type CartItem = {
    product: Product;
    quantity: number;
};

interface SalesPDVProps {
    onBack?: () => void;
}

export const SalesPDV = ({ onBack }: SalesPDVProps) => {
    const { toast } = useToast();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
    const [productSearch, setProductSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");

    const { data: products = [], isLoading: loadingProducts } = useProducts();
    const { data: customers = [], isLoading: loadingCustomers } = useClients();
    const createSaleMutation = useCreateSale();

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

    const updateQuantity = (productId: number, quantity: number) => {
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

    const removeFromCart = (productId: number) => {
        setCart((current) => current.filter((item) => item.product.id !== productId));
    };

    const handleCheckout = async () => {
        if (!selectedCustomerId) {
            toast({
                title: "Atenção",
                description: "Selecione um cliente para finalizar a venda.",
                variant: "destructive",
            });
            return;
        }

        if (cart.length === 0) {
            toast({
                title: "Atenção",
                description: "Adicione itens ao carrinho primeiro.",
                variant: "destructive",
            });
            return;
        }

        const saleData = {
            client_id: Number(selectedCustomerId),
            total_amount: cartTotal,
            payment_method: paymentMethod as any,
            items: cart.map(item => ({
                product_id: Number(item.product.id),
                quantity: item.quantity,
                price: item.product.sale_price
            }))
        };

        try {
            await createSaleMutation.mutateAsync(saleData);

            celebrateCompleteSale(cartTotal);
            setCart([]);
            setSelectedCustomerId(undefined);

            if (onBack) onBack();

        } catch (error) {
            console.error("Sale error:", error);
        }
    };

    return (
        <div className="animate-fade-in-up space-y-6">
            {/* Header for PDV Mode */}
            <div className="flex items-center gap-4 mb-4">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-12 w-12 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                )}
                <div>
                    <h2 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        Nova Venda
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full uppercase tracking-wider font-bold">PDV Ativo</span>
                    </h2>
                    <p className="text-neutral-500">Selecione produtos e finalize o pedido</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Sale Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Payment Card */}
                    <div className="card-premium relative overflow-hidden border-none shadow-xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                Identificação do Pedido
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 ml-1">Cliente / Parceiro</label>
                                <Select
                                    value={selectedCustomerId}
                                    onValueChange={(value) => setSelectedCustomerId(value)}
                                >
                                    <SelectTrigger className="h-12 bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700/50 rounded-xl focus:ring-primary/20 transition-all hover:border-primary-300">
                                        <SelectValue placeholder={loadingCustomers ? "Carregando..." : "Selecione o cliente"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-neutral-200 shadow-2xl">
                                        {customers?.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()} className="rounded-lg my-1">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{customer.name}</span>
                                                    {customer.phone && <span className="text-[10px] opacity-70 italic">{customer.phone}</span>}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 ml-1">Método de Pagamento</label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(value) => setPaymentMethod(value)}
                                >
                                    <SelectTrigger className="h-12 bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700/50 rounded-xl focus:ring-primary/20 transition-all hover:border-primary-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-neutral-200 shadow-2xl">
                                        <SelectItem value="dinheiro" className="rounded-lg my-1 font-medium">💵 Dinheiro vivo</SelectItem>
                                        <SelectItem value="pix" className="rounded-lg my-1 font-medium">💠 Transferência PIX</SelectItem>
                                        <SelectItem value="cartao_credito" className="rounded-lg my-1 font-medium">💳 Cartão de Crédito</SelectItem>
                                        <SelectItem value="cartao_debito" className="rounded-lg my-1 font-medium">💳 Cartão de Débito</SelectItem>
                                        <SelectItem value="fiado" className="rounded-lg my-1 font-medium italic text-orange-600">📝 Venda a Prazo (Carteira)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Product Search & List */}
                    <div className="card-premium p-0 border-none shadow-2xl bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-900/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    Portfólio de Itens
                                </h3>
                            </div>

                            <div className="flex-1 md:max-w-md relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                                <Input
                                    placeholder="Pesquisar por Código, Nome ou SKU..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-12 h-14 bg-white/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700/50 rounded-2xl focus:bg-white dark:focus:bg-neutral-800 shadow-sm transition-all text-lg font-medium ring-0 focus-visible:ring-2 focus-visible:ring-primary-500/20"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-100 dark:border-neutral-800">
                                        <TableHead className="py-5 px-8 font-black uppercase tracking-tighter text-neutral-400 text-xs">Informações do Produto</TableHead>
                                        <TableHead className="hidden md:table-cell font-black uppercase tracking-tighter text-neutral-400 text-xs">SKU</TableHead>
                                        <TableHead className="text-right font-black uppercase tracking-tighter text-neutral-400 text-xs">Estoque</TableHead>
                                        <TableHead className="text-right py-5 px-8 font-black uppercase tracking-tighter text-neutral-400 text-xs">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.slice(0, 8).map((product) => (
                                        <TableRow
                                            key={product.id}
                                            className="cursor-pointer hover:bg-primary-500/5 dark:hover:bg-primary-500/10 transition-all border-neutral-50 dark:border-neutral-800 group"
                                            onClick={() => addToCart(product)}
                                        >
                                            <TableCell className="py-6 px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-primary-600 transition-colors">{product.name}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <code className="text-[10px] font-black bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500 tracking-widest">{product.sku || 'N/A'}</code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`text-sm font-black ${product.stock_quantity <= 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {product.stock_quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right py-6 px-8 font-black text-lg text-neutral-950 dark:text-white tabular-nums">
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

                {/* Cart Sidebar */}
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[2.5rem] border-none shadow-2xl flex flex-col h-[calc(100vh-140px)] sticky top-24 overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <div className="p-8 pb-6 border-b border-dashed border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-600">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <Badge variant="outline" className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 border-none font-black text-[10px] uppercase tracking-widest text-neutral-500">
                                {cart.reduce((s, i) => s + i.quantity, 0)} itens
                            </Badge>
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">Cesta de Compras</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-40">
                                <ShoppingCart className="w-10 h-10 text-neutral-300" />
                                <p className="text-xs font-medium text-neutral-400 mt-2">Adicione produtos do catálogo ao lado</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.product.id} className="flex flex-col gap-3 p-5 rounded-3xl bg-neutral-50/50 dark:bg-neutral-800/30 border border-transparent hover:border-primary-500/20 hover:bg-white dark:hover:bg-neutral-800 transition-all duration-300">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="text-sm font-black">{item.product.name}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-300 hover:text-rose-500 hover:bg-rose-500/10" onClick={() => removeFromCart(item.product.id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center bg-white dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-700 p-1 shadow-sm">
                                            <button className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                                            <span className="px-3 text-xs font-black min-w-[2rem] text-center tabular-nums">{item.quantity}</span>
                                            <button className="w-7 h-7 flex items-center justify-center rounded-full text-primary-600 hover:bg-primary-50" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                                        </div>
                                        <p className="font-black text-lg tabular-nums tracking-tighter">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.product.sale_price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-8 pt-4 bg-white/50 dark:bg-neutral-900/50 border-t border-dashed border-neutral-200 dark:border-neutral-700">
                        <div className="flex flex-col mb-8 p-6 rounded-3xl bg-neutral-900 dark:bg-neutral-950 text-white shadow-2xl relative overflow-hidden group">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Total a Liquidar</span>
                            <span className="text-4xl font-black tabular-nums tracking-tighter">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cartTotal)}
                            </span>
                        </div>
                        <Button
                            className="w-full h-16 text-lg font-black rounded-2xl btn-primary hover-lift shadow-xl shadow-primary-500/20 group relative overflow-hidden"
                            onClick={handleCheckout}
                            disabled={createSaleMutation.isPending || cart.length === 0}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            <ShoppingCart className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                            {createSaleMutation.isPending ? "Processando..." : "Finalizar Pedido"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
