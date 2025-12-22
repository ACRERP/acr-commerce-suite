import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/products';
import { X, Plus, Minus, Tag, Check } from 'lucide-react';

export interface CartItem extends Product {
  quantity: number;
}

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onUpdatePrice?: (productId: number, newPrice: number) => void;
  onRemoveItem: (productId: number) => void;
}

export function CartView({ cart, onUpdateQuantity, onUpdatePrice, onRemoveItem }: CartViewProps) {
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const startEditing = (id: number, currentPrice: number) => {
    setEditingPriceId(id);
    setTempPrice(currentPrice.toString());
  };

  const savePrice = (id: number) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0 && onUpdatePrice) {
      onUpdatePrice(id, newPrice);
    }
    setEditingPriceId(null);
  };

  if (cart.length === 0) {
    return <div className="text-center text-muted-foreground py-8">O carrinho está vazio.</div>;
  }

  return (
    <div className="space-y-4">
      {cart.map((item) => (
        <div key={item.id} className="flex items-center gap-4 border-b pb-4">
          <div className="flex-grow">
            <p className="font-medium">{item.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {editingPriceId === item.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-7 w-20 px-1 text-sm"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                    onClick={() => savePrice(item.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-sm text-muted-foreground">
                    Preço: <span className="font-medium text-neutral-900">R$ {item.sale_price?.toFixed(2) ?? 'N/A'}</span>
                  </p>
                  {onUpdatePrice && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity hover:text-primary hover:bg-primary/10"
                      onClick={() => startEditing(item.id, item.sale_price || 0)}
                      title="Aplicar desconto / Alterar preço"
                    >
                      <Tag className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              className="h-8 w-16 text-center"
              value={item.quantity}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value, 10);
                if (!isNaN(newQuantity) && newQuantity > 0) {
                  onUpdateQuantity(item.id, newQuantity);
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => onRemoveItem(item.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
