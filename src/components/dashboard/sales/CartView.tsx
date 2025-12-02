import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '../products/ProductList';
import { X, Plus, Minus } from 'lucide-react';

export interface CartItem extends Product {
  quantity: number;
}

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

export function CartView({ cart, onUpdateQuantity, onRemoveItem }: CartViewProps) {
  if (cart.length === 0) {
    return <div className="text-center text-muted-foreground py-8">O carrinho está vazio.</div>;
  }

  return (
    <div className="space-y-4">
      {cart.map((item) => (
        <div key={item.id} className="flex items-center gap-4 border-b pb-4">
          <div className="flex-grow">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              Preço: R$ {item.price?.toFixed(2) ?? 'N/A'}
            </p>
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
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
            onClick={() => onRemoveItem(item.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
