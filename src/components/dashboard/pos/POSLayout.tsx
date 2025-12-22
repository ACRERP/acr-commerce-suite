import { useState } from 'react';
import { POSProductGrid } from './POSProductGrid';
import { POSCart } from './POSCart';
import { Product } from '@/lib/products';
import { CartItem } from '@/components/dashboard/sales/CartView';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { PaymentMethod } from '@/components/dashboard/sales/Payment';

export function POSLayout() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Cart Handlers
    const handleProductSelect = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast({ title: "Adicionado", description: `${product.name} adicionado ao carrinho.` });
    };

    const handleUpdateQuantity = (id: number, qty: number) => {
        if (qty <= 0) {
            handleRemoveItem(id);
            return;
        }
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
    };

    const handleRemoveItem = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleNewSale = () => {
        if (cart.length > 0 && !confirm("Limpar venda atual?")) return;
        setCart([]);
    };

    // Sale Mutation (Simplified for now - can be expanded)
    const saleMutation = useMutation({
        mutationFn: async (paymentMethod: PaymentMethod = 'dinheiro') => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario não logado');

            const total = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);

            // 1. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    user_id: user.id,
                    total_amount: total,
                    payment_method: paymentMethod,
                    status: 'concluida'
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Items
            const items = cart.map(item => ({
                sale_id: sale.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.sale_price
            }));

            const { error: itemsError } = await supabase.from('sale_items').insert(items);
            if (itemsError) throw itemsError;

            return sale;
        },
        onSuccess: () => {
            toast({ title: "Venda Finalizada!", description: "Venda registrada com sucesso." });
            setCart([]);
            setIsFinalizing(false);
            queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
        },
        onError: (err) => {
            toast({ variant: "destructive", title: "Erro", description: err.message });
        }
    });

    return (
        <div className="flex h-[calc(100vh-140px)] gap-0 overflow-hidden rounded-xl border border-border shadow-2xl bg-white dark:bg-neutral-900">
            {/* Left 65%: Catalog */}
            <div className="w-[65%] h-full relative">
                <POSProductGrid onProductSelect={handleProductSelect} />
            </div>

            {/* Right 35%: Cart */}
            <div className="w-[35%] h-full z-10">
                <POSCart
                    cart={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onFinalize={() => {
                        // For now just quick finalize
                        if (confirm("Confirmar finalização em DINHEIRO?")) {
                            saleMutation.mutate('dinheiro');
                        }
                    }}
                    isLoading={saleMutation.isPending}
                />
            </div>
        </div>
    );
}
