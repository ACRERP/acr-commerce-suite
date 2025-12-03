import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartItem } from './CartView';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'fiado';

interface PaymentProps {
  cart: CartItem[];
  onFinalizeSale: (paymentMethod: PaymentMethod) => void;
  isLoading: boolean;
}

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'fiado', label: 'Fiado' },
];

export function Payment({ cart, onFinalizeSale, isLoading }: PaymentProps) {
  const totalAmount = cart.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  const handleFinalize = () => {
    const selectedMethod = (document.querySelector('[data-radix-select-trigger]') as HTMLElement)?.innerText.toLowerCase().replace(' ', '_') as PaymentMethod;
    if (selectedMethod) {
      onFinalizeSale(selectedMethod);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold flex justify-between">
        <span>Total:</span>
        <span>R$ {totalAmount.toFixed(2)}</span>
      </div>

      <Select defaultValue="dinheiro">
        <SelectTrigger>
          <SelectValue placeholder="Forma de Pagamento" />
        </SelectTrigger>
        <SelectContent>
          {paymentOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        className="w-full" 
        size="lg" 
        onClick={handleFinalize} 
        disabled={isLoading || cart.length === 0}
      >
        {isLoading ? 'Finalizando...' : 'Finalizar Venda'}
      </Button>
    </div>
  );
}
