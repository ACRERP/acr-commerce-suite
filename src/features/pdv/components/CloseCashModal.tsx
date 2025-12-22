import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCloseCash, useCashMovements } from '@/hooks/usePDV';
import { formatCurrency, CashRegister } from '@/lib/pdv';
import { Calculator, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CloseCashModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    register: CashRegister;
}

export function CloseCashModal({ open, onOpenChange, register }: CloseCashModalProps) {
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');

    const { data: movements } = useCashMovements(register.id);
    const closeCashMutation = useCloseCash();

    // Calculate expected balance
    const calculateExpected = () => {
        let balance = register.opening_balance;
        if (!movements) return balance;

        movements.forEach(m => {
            if (m.payment_method === 'dinheiro' || m.payment_method === 'cash') { // Handle both
                if (m.movement_type === 'entrada') {
                    balance += m.amount;
                } else {
                    balance -= m.amount;
                }
            }
        });
        return balance;
    };

    const expectedBalance = calculateExpected();
    const difference = parseFloat(closingBalance || '0') - expectedBalance;

    const handleSubmit = async () => {
        const amount = parseFloat(closingBalance);
        if (isNaN(amount)) return;

        await closeCashMutation.mutateAsync({
            registerId: register.id,
            closingBalance: amount,
            notes
        });

        handleClose();
        // Force page reload or redirect could be handled by parent
        window.location.reload();
    };

    const handleClose = () => {
        setClosingBalance('');
        setNotes('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Fechamento de Caixa</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase">Resumo da Sessão</h3>
                        <div className="flex justify-between text-sm">
                            <span>Abertura:</span>
                            <span>{formatCurrency(register.opening_balance)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span>Saldo Esperado (Dinheiro):</span>
                            <span>{formatCurrency(expectedBalance)}</span>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="space-y-2">
                        <Label htmlFor="closingBalance" className="text-base">Valor em Gaveta (Contagem)</Label>
                        <div className="relative">
                            <Calculator className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                            <Input
                                id="closingBalance"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={closingBalance}
                                onChange={(e) => setClosingBalance(e.target.value)}
                                className="pl-10 text-xl font-bold"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Difference Alert */}
                    {closingBalance && !isNaN(parseFloat(closingBalance)) && (
                        <Alert variant={Math.abs(difference) < 0.05 ? "default" : "destructive"} className={`${Math.abs(difference) < 0.05 ? "border-green-500 bg-green-50" : ""}`}>
                            {Math.abs(difference) < 0.05 ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertTitle>{Math.abs(difference) < 0.05 ? "Caixa Batendo!" : "Diferença Detectada"}</AlertTitle>
                            <AlertDescription className="flex justify-between items-center mt-1">
                                <span>{difference > 0 ? "Sobrando:" : "Faltando:"}</span>
                                <span className="font-bold text-lg">{formatCurrency(Math.abs(difference))}</span>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações do Fechamento</Label>
                        <Textarea
                            id="notes"
                            placeholder="Justificativa de quebras, observações..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={closeCashMutation.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!closingBalance || closeCashMutation.isPending}
                        variant={Math.abs(difference) > 0.05 ? "destructive" : "default"}
                    >
                        {closeCashMutation.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
