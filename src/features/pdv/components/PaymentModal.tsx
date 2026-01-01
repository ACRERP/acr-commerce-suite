import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Banknote, QrCode, Wallet, Truck, Trash2, Plus, Check } from 'lucide-react';
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
        if (remaining > 0.05) {
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

        onConfirm(payments, isDelivery ? deliveryInfo : undefined);
    };

    const paymentMethods = [
        { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'bg-green-500' },
        { id: 'credit', label: 'Crédito', icon: CreditCard, color: 'bg-blue-500' },
        { id: 'debit', label: 'Débito', icon: Wallet, color: 'bg-purple-500' },
        { id: 'pix', label: 'PIX', icon: QrCode, color: 'bg-teal-500' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-3xl border-0 shadow-2xl glass-window">
                <DialogHeader className="p-6 bg-neutral-900 text-white border-b border-white/10">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
                        <Wallet className="h-6 w-6 text-primary" />
                        Finalizar Venda
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Coluna Esquerda: Entrada de Dados */}
                    <div className="p-6 space-y-6 bg-white">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total da Venda</Label>
                                <span className="text-2xl font-black text-neutral-900">{formatCurrency(total)}</span>
                            </div>

                            <div className={`p-4 rounded-2xl flex justify-between items-center transition-all ${remaining > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Saldo Restante</span>
                                <span className={`text-xl font-black ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(Math.max(0, remaining))}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Forma de Pagamento</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {paymentMethods.map((m) => (
                                    <Button
                                        key={m.id}
                                        variant={selectedMethod === m.id ? 'default' : 'outline'}
                                        className={`h-12 justify-start gap-3 rounded-xl border-neutral-200 transition-all ${selectedMethod === m.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-neutral-50'}`}
                                        onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                                    >
                                        <div className={`p-1.5 rounded-lg ${selectedMethod === m.id ? 'bg-white/20' : m.color + '/10'}`}>
                                            <m.icon className={`h-4 w-4 ${selectedMethod === m.id ? 'text-white' : 'text-' + m.color.split('-')[1] + '-600'}`} />
                                        </div>
                                        <span className="font-bold text-xs">{m.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Valor Recebido</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">R$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={currentAmount}
                                        onChange={e => setCurrentAmount(e.target.value)}
                                        className="h-14 pl-12 text-xl font-black rounded-2xl border-neutral-200 focus:ring-primary focus:border-primary"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleAddPayment();
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    onClick={handleAddPayment}
                                    disabled={remaining <= 0}
                                    className="h-14 w-14 rounded-2xl bg-neutral-900 hover:bg-black text-white"
                                >
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Resumo e Pagamentos */}
                    <div className="p-6 bg-neutral-50 border-l border-neutral-100 flex flex-col gap-6">
                        <div className="flex-1 space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Pagamentos Adicionados</Label>

                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {payments.length === 0 ? (
                                    <div className="h-32 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 gap-2">
                                        <CreditCard className="h-8 w-8 opacity-20" />
                                        <span className="text-xs font-medium">Nenhum pagamento</span>
                                    </div>
                                ) : (
                                    payments.map((p, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm flex justify-between items-center animate-in slide-in-from-right-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                                                    {(() => {
                                                        const m = paymentMethods.find(method => method.id === p.payment_method);
                                                        const Icon = m?.icon || Banknote;
                                                        return <Icon className="h-4 w-4 text-neutral-600" />;
                                                    })()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{p.payment_method}</span>
                                                    <span className="text-sm font-black">{formatCurrency(p.amount)}</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => {
                                                    const newPayments = [...payments];
                                                    const removed = newPayments.splice(idx, 1)[0];
                                                    setPayments(newPayments);
                                                    setCurrentAmount((removed.amount + remaining).toFixed(2));
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Troco em destaque */}
                        {payments.some(p => p.change_amount && p.change_amount > 0) && (
                            <div className="p-4 rounded-2xl bg-black text-white border border-white/10 shadow-xl flex flex-col gap-1 items-center justify-center animate-in zoom-in-95">
                                <span className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Troco a Devolver</span>
                                <span className="text-3xl font-black text-primary">
                                    {formatCurrency(payments.reduce((acc, p) => acc + (p.change_amount || 0), 0))}
                                </span>
                            </div>
                        )}

                        {/* Botão Finalizar */}
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading || remaining > 0.05}
                            className="h-16 rounded-2xl bg-primary hover:bg-primary-600 text-white font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            {remaining <= 0.05 ? <Check className="h-6 w-6" /> : null}
                            {isLoading ? "Processando..." : remaining > 0.05 ? "Aguardando Pagto" : "Finalizar Venda"}
                        </Button>
                    </div>
                </div>

                {isDelivery && (
                    <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Modo Delivery Ativo</span>
                                <span className="text-sm font-bold truncate max-w-[200px]">{deliveryInfo.customer_name || 'Cliente não identificado'}</span>
                            </div>
                        </div>
                        <Button variant="outline" className="h-8 rounded-lg border-white/20 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest text-white/40">
                            Editar Dados
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
