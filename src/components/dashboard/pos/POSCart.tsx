import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartItem } from '@/components/dashboard/sales/CartView';
import { Minus, Plus, Trash2, ShoppingCart, DollarSign } from 'lucide-react';

interface POSCartProps {
    cart: CartItem[];
    onUpdateQuantity: (id: number, qty: number) => void;
    onRemoveItem: (id: number) => void;
    onFinalize: () => void;
    isLoading?: boolean;
}

export function POSCart({ cart, onUpdateQuantity, onRemoveItem, onFinalize, isLoading }: POSCartProps) {
    const subtotal = cart.reduce((acc, item) => acc + (item.sale_price || 0) * item.quantity, 0);
    const discount = 0; // Future implementation
    const total = subtotal - discount;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-l border-border shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gray-50/50 dark:bg-neutral-900/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Carrinho
                    <span className="ml-auto text-sm font-normal text-muted-foreground bg-white px-2 py-1 rounded-full border">
                        {cart.length} itens
                    </span>
                </h2>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                        <ShoppingCart className="w-16 h-16" />
                        <p>Carrinho vazio</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg group hover:ring-1 hover:ring-primary/20 transition-all">
                                {/* Qty Controls */}
                                <div className="flex flex-col items-center justify-between h-full gap-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-white" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                        <Minus className="w-3 h-3" />
                                    </Button>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <h4 className="font-semibold text-sm truncate" title={item.name}>{item.name}</h4>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-muted-foreground">Unit: R$ {item.sale_price?.toFixed(2)}</span>
                                        <span className="font-bold text-primary">R$ {((item.sale_price || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Remove */}
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemoveItem(item.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Summary & Checkout */}
            <div className="p-6 border-t border-border bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-sm space-y-4">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Descontos</span>
                        <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-black text-foreground pt-2 border-t mt-2">
                        <span>Total</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    size="lg"
                    onClick={onFinalize}
                    disabled={cart.length === 0 || isLoading}
                >
                    <DollarSign className="w-6 h-6 mr-2" />
                    Finalizar Venda (F2)
                </Button>
            </div>
        </div>
    );
}
