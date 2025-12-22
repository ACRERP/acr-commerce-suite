import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CartItem } from './CartView';
import { CreditCard, Banknote, QrCode, Wallet, StickyNote } from 'lucide-react';
import { cn } from "@/lib/utils";

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'fiado';

interface PaymentProps {
  cart: CartItem[];
  onFinalizeSale: (paymentMethod: PaymentMethod) => void;
  isLoading: boolean;
}

const paymentOptions = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao_credito', label: 'Crédito', icon: CreditCard },
  { value: 'cartao_debito', label: 'Débito', icon: CreditCard },
  { value: 'fiado', label: 'Fiado', icon: StickyNote },
];

export function Payment({ cart, onFinalizeSale, isLoading }: PaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('dinheiro');
  const totalAmount = cart.reduce((acc, item) => acc + (item.sale_price || 0) * item.quantity, 0);

  const handleFinalize = () => {
    if (selectedMethod) {
      onFinalizeSale(selectedMethod);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold flex justify-between bg-neutral-100 p-4 rounded-lg">
        <span>Total a Pagar:</span>
        <span className="text-primary font-bold">R$ {totalAmount.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-neutral-500">Selecione o métod de pagamento:</span>
        <div className="grid grid-cols-3 gap-3">
          {paymentOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMethod === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setSelectedMethod(option.value as PaymentMethod)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:bg-neutral-50",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                <Icon className={cn("h-6 w-6", isSelected ? "text-primary" : "text-neutral-400")} />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Button
        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        size="lg"
        onClick={handleFinalize}
        disabled={isLoading || cart.length === 0}
      >
        {isLoading ? 'Processando...' : 'Confirmar Pagamento'}
      </Button>
    </div>
  );
}
