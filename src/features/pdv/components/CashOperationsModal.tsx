import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupply, useWithdrawal } from '@/hooks/usePDV';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';

interface CashOperationsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    registerId: number;
}

export function CashOperationsModal({ open, onOpenChange, registerId }: CashOperationsModalProps) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [activeTab, setActiveTab] = useState('suprimento');

    const supplyMutation = useSupply();
    const withdrawalMutation = useWithdrawal();

    const handleSubmit = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) return;

        if (activeTab === 'suprimento') {
            await supplyMutation.mutateAsync({
                registerId,
                amount: numAmount,
                description: description || 'Suprimento de Caixa',
                category: 'reforco'
            });
        } else {
            await withdrawalMutation.mutateAsync({
                registerId,
                amount: numAmount,
                description: description || 'Sangria de Caixa',
                category: 'sangria'
            });
        }

        handleClose();
    };

    const handleClose = () => {
        setAmount('');
        setDescription('');
        onOpenChange(false);
    };

    const isLoading = supplyMutation.isPending || withdrawalMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gestão de Caixa</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="suprimento" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                            <ArrowDownCircle className="w-4 h-4 mr-2" />
                            Suprimento (Entrada)
                        </TabsTrigger>
                        <TabsTrigger value="sangria" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                            <ArrowUpCircle className="w-4 h-4 mr-2" />
                            Sangria (Saída)
                        </TabsTrigger>
                    </TabsList>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Valor {activeTab === 'suprimento' ? 'da Entrada' : 'da Saída'}</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="text-xl font-bold"
                                autoFocus
                            />
                            {amount && !isNaN(parseFloat(amount)) && (
                                <p className={`text-sm font-medium ${activeTab === 'suprimento' ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(parseFloat(amount))} será {activeTab === 'suprimento' ? 'adicionado ao' : 'removido do'} caixa.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Motivo / Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder={activeTab === 'suprimento' ? "Ex: Troco inicial, Aporte..." : "Ex: Pagto Fornecedor, Sangria para cofre..."}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                        className={activeTab === 'suprimento' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    >
                        {isLoading ? 'Registrando...' : activeTab === 'suprimento' ? 'Confirmar Entrada' : 'Confirmar Saída'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
