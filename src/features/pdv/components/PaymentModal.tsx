import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Banknote, QrCode, Wallet, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { PaymentMethod, SalePayment } from '../types';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    onConfirm: (payments: SalePayment[], deliveryData?: any) => void;
    isLoading?: boolean;
    isDelivery?: boolean;
    defaultCustomerName?: string;
}

export function PaymentModal({
    open,
    onOpenChange,
    total,
    onConfirm,
    isLoading,
    isDelivery,
    defaultCustomerName
}: PaymentModalProps) {
    const [payments, setPayments] = useState<SalePayment[]>([]);
    const [currentAmount, setCurrentAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [deliveryInfo, setDeliveryInfo] = useState({
        customer_name: '',
        customer_phone: '',
        address: ''
    });
    const { toast } = useToast();

    // Reset when opening
    useEffect(() => {
        if (open) {
            setPayments([]);
            setCurrentAmount(total.toFixed(2));
            setSelectedMethod('cash');
            setDeliveryInfo({
                customer_name: defaultCustomerName || '',
                customer_phone: '',
                address: ''
            });
        }
    }, [open, total, defaultCustomerName]);

    const remaining = total - payments.reduce((acc, p) => acc + p.amount, 0);

    const handleAddPayment = () => {
        const amount = parseFloat(currentAmount);
        if (!amount || amount <= 0) return;

        // Allow change ONLY for Cash (dinheiro)
        if (selectedMethod !== 'cash' && amount > remaining + 0.05) {
            toast({
                title: "Valor excede o total",
                description: "Troco disponível apenas para pagamentos em dinheiro.",
                variant: 'destructive'
            });
            return;
        }

        const isChange = amount > remaining;
        const paymentAmount = isChange ? remaining : amount;
        const changeAmount = isChange ? amount - remaining : 0;

        setPayments([...payments, {
            payment_method: selectedMethod,
            amount: paymentAmount,
            received_amount: amount,
            change_amount: changeAmount
        }]);

        // Update next suggestion (if full payment, remaining is 0)
        const nextRemaining = isChange ? 0 : remaining - amount;
        setCurrentAmount(nextRemaining > 0 ? nextRemaining.toFixed(2) : '');
    };

    const handleConfirm = () => {
        console.log("🔘 Confirm Clicked! Remaining:", remaining);

        // Relaxed tolerance to 0.05 to avoid floating point issues
        if (remaining > 0.05) {
            console.warn("❌ Payment incomplete. Remaining:", remaining);
            toast({
                title: "Pagamento incompleto",
                description: `Faltam ${formatCurrency(remaining)}`,
                variant: 'destructive'
            });
            return;
        }

        if (isDelivery && (!deliveryInfo.customer_name || !deliveryInfo.address)) {
            toast({
                title: "Dados de entrega incompletos",
                description: "Informe o nome e o endereço para entrega.",
                variant: 'destructive'
            });
            return;
        }

        console.log("✅ Calling onConfirm with payments:", payments);
        onConfirm(payments, isDelivery ? deliveryInfo : undefined);
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

                    {/* Troco Display */}
                    {payments.some(p => p.change_amount && p.change_amount > 0) && (
                        <div className="bg-green-50 p-3 rounded-md flex justify-between items-center border border-green-200">
                            <span className="text-sm font-medium text-green-700">Troco a Devolver</span>
                            <span className="font-bold text-green-700">
                                {formatCurrency(payments.reduce((acc, p) => acc + (p.change_amount || 0), 0))}
                            </span>
                        </div>
                    )}

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

                    {/* Delivery Details */}
                    {isDelivery && (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3 animate-in slide-in-from-top-2">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 uppercase tracking-wider">
                                <Truck className="h-4 w-4" /> Dados de Entrega
                            </h3>
                            <div className="grid gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Nome do Cliente</Label>
                                    <Input
                                        placeholder="Ex: Alisson Cruz"
                                        value={deliveryInfo.customer_name}
                                        onChange={e => setDeliveryInfo({ ...deliveryInfo, customer_name: e.target.value })}
                                        className="h-9 bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Telefone / WhatsApp</Label>
                                    <Input
                                        placeholder="(00) 00000-0000"
                                        value={deliveryInfo.customer_phone}
                                        onChange={e => setDeliveryInfo({ ...deliveryInfo, customer_phone: e.target.value })}
                                        className="h-9 bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Endereço Completo</Label>
                                    <Input
                                        placeholder="Rua, Número, Bairro, Cidade..."
                                        value={deliveryInfo.address}
                                        onChange={e => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                                        className="h-9 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payments List */}
                    {payments.length > 0 && (
                        <div className="space-y-2 mt-2">
                            <Label>Pagamentos Registrados</Label>
                            <div className="border rounded-md divide-y">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex justify-between p-2 text-sm">
                                        <div className="flex flex-col">
                                            <span className="capitalize font-medium">{p.payment_method}</span>
                                            {p.change_amount && p.change_amount > 0 && (
                                                <span className="text-xs text-green-600">
                                                    (Recebido: {formatCurrency(p.received_amount || 0)} | Troco: {formatCurrency(p.change_amount)})
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="font-bold">{formatCurrency(p.amount)}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
