import { Minus, Plus, ShoppingCart as CartIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '@/lib/pdv';

export function ShoppingCart() {
    const { items, updateQuantity, removeItem, itemCount } = useCart();

    return (
        <Card className="flex-1 overflow-hidden flex flex-col h-full border-none shadow-none rounded-none">
            <CardHeader className="pb-2 bg-white border-b">
                <CardTitle className="text-base flex items-center gap-2">
                    <CartIcon className="h-4 w-4" />
                    Itens da Venda ({itemCount()})
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0 bg-gray-50/50">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                        <CartIcon className="h-16 w-16 mb-4 opacity-20" />
                        <p className="font-medium">Carrinho vazio</p>
                        <p className="text-sm opacity-70">Busque um produto (F2)</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((item) => (
                            <div
                                key={item.product_id}
                                className="flex items-center justify-between p-4 bg-white hover:bg-blue-50/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="font-medium text-gray-900 truncate">{item.name}</div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                        <span className="font-mono bg-gray-100 px-1 rounded text-xs">{item.code || '---'}</span>
                                        <span>{formatCurrency(item.unit_price)} unid.</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded-md bg-white shadow-sm">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-gray-100 rounded-l-md"
                                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-10 text-center font-bold text-sm bg-gray-50 h-8 flex items-center justify-center border-x">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-gray-100 rounded-r-md disabled:opacity-30"
                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock_quantity}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="w-24 text-right">
                                        <div className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => removeItem(item.product_id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
