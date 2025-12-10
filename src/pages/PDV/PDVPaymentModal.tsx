import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { usePDVStore, PaymentMethod } from '@/stores/pdv-store';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    DollarSign,
    CreditCard,
    Smartphone,
    Wallet,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
    { id: 'debito', label: 'Débito', icon: CreditCard },
    { id: 'credito', label: 'Crédito', icon: CreditCard },
    { id: 'pix', label: 'Pix', icon: Smartphone },
    { id: 'vale', label: 'Vale', icon: Wallet },
];

export function PDVPaymentModal() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);

    const {
        cart,
        total,
        customer,
        paymentMethod,
        setPaymentMethod,
        amountPaid,
        setAmountPaid,
        change,
        isPaymentModalOpen,
        setPaymentModalOpen,
        clearCart,
    } = usePDVStore();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Mutation para registrar venda
    const registerSaleMutation = useMutation({
        mutationFn: async () => {
            // Validar pagamento
            if (paymentMethod === 'dinheiro' && amountPaid < total) {
                throw new Error('Valor pago insuficiente!');
            }

            // Registrar venda
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([
                    {
                        customer_id: customer?.id || null,
                        total_amount: total,
                        payment_method: paymentMethod,
                        amount_paid: amountPaid,
                        change: change,
                        status: 'completed',
                    }
                ])
                .select()
                .single();

            if (saleError) throw saleError;

            // Registrar itens da venda
            const saleItems = cart.map(item => ({
                sale_id: sale.id,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_price: item.product.price,
                subtotal: item.subtotal,
                discount: item.discount,
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) throw itemsError;

            // Atualizar estoque
            for (const item of cart) {
                const { error: stockError } = await supabase
                    .from('products')
                    .update({
                        stock_quantity: item.product.stock_quantity - item.quantity
                    })
                    .eq('id', item.product.id);

                if (stockError) throw stockError;
            }

            // Registrar transação financeira
            const { error: transactionError } = await supabase
                .from('financial_transactions')
                .insert([
                    {
                        type: 'receita',
                        category: 'Vendas',
                        description: `Venda #${sale.id}`,
                        amount: total,
                        payment_method: paymentMethod,
                        status: 'pago',
                        due_date: new Date().toISOString(),
                    }
                ]);

            if (transactionError) throw transactionError;

            return sale;
        },
        onSuccess: (sale) => {
            toast({
                title: 'Venda finalizada!',
                description: `Venda #${sale.id} registrada com sucesso.`,
            });

            // Invalidar queries
            queryClient.invalidateQueries({ queryKey: ['pdv-products'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['financial_summary'] });

            // Limpar carrinho
            clearCart();
            setPaymentModalOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Erro ao finalizar venda',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleConfirmPayment = async () => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            await registerSaleMutation.mutateAsync();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setPaymentModalOpen(false);
        setAmountPaid(0);
    };

    return (
        <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-green-600" />
                        Finalizar Venda
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Total */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                        <p className="text-4xl font-bold text-green-600">
                            {formatCurrency(total)}
                        </p>
                    </div>

                    {/* Formas de Pagamento */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">
                            Forma de Pagamento
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                const isSelected = paymentMethod === method.id;
                                return (
                                    <Button
                                        key={method.id}
                                        variant={isSelected ? "default" : "outline"}
                                        className={cn(
                                            "h-20 flex flex-col gap-2 transition-all",
                                            isSelected && "bg-green-600 hover:bg-green-700 shadow-lg scale-105"
                                        )}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <Icon className="h-6 w-6" />
                                        <span className="text-xs font-semibold">{method.label}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Valor Pago (apenas para dinheiro) */}
                    {paymentMethod === 'dinheiro' && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="amount-paid" className="text-base font-semibold">
                                    Valor Recebido
                                </Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={amountPaid || ''}
                                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                    className="text-2xl font-bold h-14 mt-2"
                                    autoFocus
                                />
                            </div>

                            {/* Troco */}
                            {amountPaid > 0 && (
                                <div className={cn(
                                    "p-4 rounded-lg border-2",
                                    change >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
                                )}>
                                    <p className="text-sm text-gray-600 mb-1">Troco</p>
                                    <p className={cn(
                                        "text-3xl font-bold",
                                        change >= 0 ? "text-blue-600" : "text-red-600"
                                    )}>
                                        {formatCurrency(Math.abs(change))}
                                    </p>
                                    {change < 0 && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Valor insuficiente!
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="h-14 text-red-600 border-red-600 hover:bg-red-50"
                        >
                            <XCircle className="h-5 w-5 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            size="lg"
                            onClick={handleConfirmPayment}
                            disabled={
                                isProcessing ||
                                (paymentMethod === 'dinheiro' && amountPaid < total)
                            }
                            className="h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Confirmar Pagamento
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
