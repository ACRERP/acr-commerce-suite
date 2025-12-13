import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { PaymentMethod, SalePayment } from '../types';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    onConfirm: (payments: SalePayment[]) => void;
    isLoading?: boolean;
}

export function PaymentModal({
    open,
    onOpenChange,
    total,
    onConfirm,
    isLoading
}: PaymentModalProps) {
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [currentAmount, setCurrentAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const { toast } = useToast();

    // Reset when opening
    useEffect(() => {
        if (open) {
            setPayments([]);
            setCurrentAmount(total.toFixed(2));
            setSelectedMethod('cash');
        }
    }, [open, total]);

    const remaining = total - payments.reduce((acc, p) => acc + p.amount, 0);

    const handleAddPayment = () => {
        const amount = parseFloat(currentAmount);
        if (!amount || amount <= 0) return;

        if (amount > remaining + 0.01) { // 0.01 tolerance
            toast({
                title: "Valor excede o total",
                variant: 'destructive'
            });
            return;
        }

        setPayments([...payments, { method: selectedMethod, amount }]);

        // Update next suggestion
        const nextRemaining = remaining - amount;
        setCurrentAmount(nextRemaining > 0 ? nextRemaining.toFixed(2) : '');
    };

    const handleConfirm = () => {
        if (remaining > 0.01) {
            toast({
                title: "Pagamento incompleto",
                description: `Faltam ${formatCurrency(remaining)}`,
                variant: 'destructive'
            });
            return;
        }
        onConfirm(payments);
    };

    const paymentMethods = [
        { id: 'cash', label: 'Dinheiro', icon: Banknote },
        { id: 'credit', label: 'Crédito', icon: CreditCard },
        { id: 'debit', label: 'Débito', icon: Wallet },
        { id: 'pix', label: 'PIX', icon: QrCode },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pagamento</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Total Display */}
                    <div className="flex justify-between items-end border-b pb-4">
                        <div className="text-sm text-gray-500">Total a pagar</div>
                        <div className="text-3xl font-bold text-primary">
                            {formatCurrency(total)}
                        </div>
                    </div>

                    {/* Pending Amount */}
                    <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                        <span className="text-sm font-medium">Restante</span>
                        <span className={`font-bold ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(Math.max(0, remaining))}
                        </span>
                    </div>

                    {/* Method Selection */}
                    <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((m) => (
                            <Button
                                key={m.id}
                                variant={selectedMethod === m.id ? 'default' : 'outline'}
                                className="justify-start gap-2"
                                onClick={() => {
                                    setSelectedMethod(m.id as PaymentMethod);
                                    // Auto-focus input?
                                }}
                            >
                                <m.icon className="h-4 w-4" />
                                {m.label}
                            </Button>
                        ))}
                    </div>

                    {/* Amount Input */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Label>Valor do Pagamento</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={currentAmount}
                                onChange={e => setCurrentAmount(e.target.value)}
                                className="text-lg font-bold"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleAddPayment();
                                }}
                                autoFocus
                            />
                        </div>
                        <Button onClick={handleAddPayment} disabled={remaining <= 0}>
                            Adicionar
                        </Button>
                    </div>

                    {/* Payments List */}
                    {payments.length > 0 && (
                        <div className="space-y-2 mt-2">
                            <Label>Pagamentos Registrados</Label>
                            <div className="border rounded-md divide-y">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex justify-between p-2 text-sm">
                                        <span className="capitalize">{p.method}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className="font-medium">{formatCurrency(p.amount)}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-500"
                                                onClick={() => {
                                                    const newPayments = [...payments];
                                                    newPayments.splice(idx, 1);
                                                    setPayments(newPayments);
                                                    setCurrentAmount((p.amount + remaining).toFixed(2));
                                                }}
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || remaining > 0.01}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                    >
                        Finalizar Venda (Enter)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
