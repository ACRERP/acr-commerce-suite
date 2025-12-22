import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';

export function StockAdjustmentDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [search, setSearch] = useState('');

    const [formData, setFormData] = useState({
        type: 'ajuste',
        quantity: '',
        reason: '',
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 1. Search Products
    const { data: products } = useQuery({
        queryKey: ['products-search', search],
        queryFn: async () => {
            if (search.length < 2) return [];
            const { data } = await supabase
                .from('products')
                .select('id, name, code, stock_quantity')
                .ilike('name', `%${search}%`)
                .limit(5);
            return data || [];
        },
        enabled: search.length >= 2
    });

    // 2. Submit Mutation
    const adjustStockMutation = useMutation({
        mutationFn: async () => {
            const user = (await supabase.auth.getUser()).data.user;

            const { error } = await supabase.from('stock_movements').insert({
                product_id: selectedProduct.id,
                movement_type: formData.type,
                quantity: parseFloat(formData.quantity.replace(',', '.')),
                reason: formData.reason,
                reference_type: 'manual',
                user_id: user?.id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Estoque Atualizado', description: 'Movimentação registrada com sucesso.' });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
            setIsOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        }
    });

    const resetForm = () => {
        setStep(1);
        setSelectedProduct(null);
        setFormData({ type: 'ajuste', quantity: '', reason: '' });
        setSearch('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
                <Button className="btn-primary gap-2">
                    <PlusCircle className="w-4 h-4" /> Nova Movimentação
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajuste Manual de Estoque</DialogTitle>
                </DialogHeader>

                {step === 1 ? (
                    <div className="space-y-4 py-4">
                        <Label>Buscar Produto</Label>
                        <Input
                            placeholder="Digite nome ou código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                            {products?.map(prod => (
                                <div
                                    key={prod.id}
                                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                                    onClick={() => { setSelectedProduct(prod); setStep(2); }}
                                >
                                    <div>
                                        <p className="font-medium">{prod.name}</p>
                                        <p className="text-xs text-muted-foreground">{prod.code}</p>
                                    </div>
                                    <div className="text-sm font-bold">
                                        {prod.stock_quantity} UN
                                    </div>
                                </div>
                            ))}
                            {search.length >= 2 && products?.length === 0 && (
                                <p className="text-sm text-center text-muted-foreground py-2">Nenhum produto encontrado.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                            <span className="font-bold">{selectedProduct.name}</span>
                            <p className="text-muted-foreground">Estoque Atual: {selectedProduct.stock_quantity}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrada">Entrada (Compra)</SelectItem>
                                        <SelectItem value="ajuste">Ajuste (Correção)</SelectItem>
                                        <SelectItem value="saida">Saída (Uso)</SelectItem>
                                        <SelectItem value="perda">Perda / Quebra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantidade</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Motivo / Observação <span className="text-red-500">*</span></Label>
                            <Textarea
                                placeholder="Ex: Contagem mensal, Quebra no transporte..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {step === 2 && (
                        <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                    )}
                    {step === 2 && (
                        <Button onClick={() => adjustStockMutation.mutate()} disabled={adjustStockMutation.isPending || !formData.quantity || !formData.reason}>
                            {adjustStockMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Confirmar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
