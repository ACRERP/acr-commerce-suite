import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { usePDVStore, Product } from '@/stores/pdv-store';
import { PDVPaymentModal } from './PDVPaymentModal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Store,
    Search,
    ShoppingCart,
    User,
    Clock,
    Plus,
    Minus,
    X,
    CreditCard,
    DollarSign,
    Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    'TODOS',
    'BEBIDAS',
    'LANCHES',
    'REFEIÇÕES',
    'SOBREMESAS',
    'OUTROS'
];

export function PDVPage() {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Zustand store
    const {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        subtotal,
        totalDiscount,
        total,
        customer,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        setPaymentModalOpen,
        clearCart,
    } = usePDVStore();

    // Atualizar relógio
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Buscar produtos
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['pdv-products', selectedCategory, searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select('*')
                .gt('stock_quantity', 0)
                .order('name');

            if (selectedCategory !== 'TODOS') {
                query = query.eq('category', selectedCategory);
            }

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query.limit(100);
            if (error) throw error;
            return data as Product[];
        },
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleFinalizeSale = () => {
        if (cart.length === 0) return;
        setPaymentModalOpen(true);
    };

    const handleCancelSale = () => {
        if (cart.length === 0) return;
        if (confirm('Deseja realmente cancelar a venda?')) {
            clearCart();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header Premium */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5">
                            <Store className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">ACR PDV</h1>
                            <p className="text-xs text-blue-100">Frente de Caixa</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <Clock className="h-4 w-4" />
                            <span className="font-semibold">
                                {format(currentTime, "HH:mm:ss", { locale: ptBR })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <div className="text-right">
                                <p className="text-sm font-semibold">Operador</p>
                                <p className="text-xs text-blue-100">Caixa 1</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Busca */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Buscar produto por nome ou código de barras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 text-lg"
                        />
                    </div>

                    {/* Categorias */}
                    <div className="flex gap-2">
                        {CATEGORIES.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                                className={cn(
                                    "font-semibold transition-all",
                                    selectedCategory === category && "shadow-md"
                                )}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Grid de Produtos */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Package className="h-16 w-16 mb-4" />
                            <p className="text-lg font-semibold">Nenhum produto encontrado</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4">
                            {products.map((product) => (
                                <Card
                                    key={product.id}
                                    className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 hover:border-blue-500"
                                    onClick={() => addToCart(product)}
                                >
                                    <CardContent className="p-4">
                                        {/* Imagem */}
                                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-12 w-12 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Nome */}
                                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">
                                            {product.name}
                                        </h3>

                                        {/* Preço */}
                                        <p className="text-2xl font-bold text-green-600 mb-2">
                                            {formatCurrency(product.price)}
                                        </p>

                                        {/* Estoque */}
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Estoque: {product.stock_quantity}</span>
                                            {product.stock_quantity < 10 && (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    Baixo
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Carrinho Lateral */}
                <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl">
                    {/* Header do Carrinho */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingCart className="h-5 w-5" />
                            <h2 className="text-lg font-bold">CARRINHO</h2>
                            <Badge className="ml-auto bg-white/20">{cart.length}</Badge>
                        </div>
                        {customer && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="text-sm">{customer.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Lista de Itens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingCart className="h-16 w-16 mb-4" />
                                <p className="text-sm font-semibold">Carrinho vazio</p>
                                <p className="text-xs">Adicione produtos para iniciar</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <Card key={item.product.id} className="border-2">
                                    <CardContent className="p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-sm mb-1">
                                                    {item.product.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    {formatCurrency(item.product.price)} x {item.quantity}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="font-bold text-lg w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 w-7 p-0"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600 mb-2">
                                                    {formatCurrency(item.subtotal)}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeFromCart(item.product.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Totais */}
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Desconto:</span>
                                    <span className="font-semibold text-red-600">
                                        -{formatCurrency(totalDiscount)}
                                    </span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-lg font-bold">TOTAL:</span>
                                <span className="text-3xl font-bold text-green-600">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        </div>

                        {/* Botões de Ação */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="h-14 text-red-600 border-red-600 hover:bg-red-50"
                                onClick={handleCancelSale}
                                disabled={cart.length === 0}
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                className="h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                                onClick={handleFinalizeSale}
                                disabled={cart.length === 0}
                            >
                                <CreditCard className="h-5 w-5 mr-2" />
                                Finalizar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
