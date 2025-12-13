import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers } from '@/lib/stock';
import { useProducts } from '@/hooks/useProducts';
import { purchaseService, CreatePurchaseData } from '@/lib/purchases/purchase-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash, Calendar as CalendarIcon, Loader2, Save, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CreatePurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreatePurchaseDialog({ open, onOpenChange }: CreatePurchaseDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<'draft' | 'completed'>('draft');

    // Fetch suppliers
    const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: getSuppliers,
    });

    // Fetch products
    const { data: products, isLoading: loadingProducts } = useProducts();

    const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreatePurchaseData>({
        defaultValues: {
            issue_date: format(new Date(), 'yyyy-MM-dd'),
            entry_date: format(new Date(), 'yyyy-MM-dd'),
            status: 'draft',
            items: [],
            discount_amount: 0,
            additional_costs: 0,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const items = watch('items');
    const discount = watch('discount_amount') || 0;
    const additional = watch('additional_costs') || 0;

    // Calculate totals
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const totalAmount = itemsTotal + Number(additional) - Number(discount);

    // Mutation
    const createMutation = useMutation({
        mutationFn: (data: CreatePurchaseData) => purchaseService.createPurchase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock update
            toast({
                title: status === 'completed' ? 'Compra registrada!' : 'Rascunho salvo',
                description: status === 'completed'
                    ? 'O estoque foi atualizado com sucesso.'
                    : 'A compra foi salva como rascunho.',
                variant: status === 'completed' ? 'default' : 'secondary',
            });
            reset();
            onOpenChange(false);
        },
        onError: (error) => {
            toast({
                title: 'Erro ao registrar compra',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        }
    });

    const onSubmit = (data: CreatePurchaseData) => {
        // Validate items if completing
        if (status === 'completed' && data.items.length === 0) {
            toast({
                title: 'Adicione itens',
                description: 'Não é possível finalizar uma compra sem itens.',
                variant: 'destructive',
            });
            return;
        }

        createMutation.mutate({ ...data, status });
    };

    const handleProductSelect = (index: number, productIdString: string) => {
        const productId = parseInt(productIdString);
        const product = products?.find(p => p.id === productId);
        if (product) {
            setValue(`items.${index}.product_id`, productId);
            setValue(`items.${index}.unit_cost`, product.cost_price || 0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Compra</DialogTitle>
                    <DialogDescription>
                        Registre uma nova entrada de mercadorias.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <Label>Fornecedor *</Label>
                            <Controller
                                control={control}
                                name="supplier_id"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingSuppliers ? (
                                                <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                            ) : (
                                                suppliers?.map((s: any) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.supplier_id && <span className="text-xs text-red-500">Obrigatório</span>}
                        </div>

                        <div>
                            <Label>Número da Nota *</Label>
                            <Input {...register('invoice_number', { required: true })} placeholder="Ex: 12345" />
                        </div>

                        <div>
                            <Label>Série</Label>
                            <Input {...register('invoice_series')} placeholder="Ex: 1" />
                        </div>

                        <div>
                            <Label>Data de Emissão</Label>
                            <Input type="date" {...register('issue_date')} />
                        </div>

                        <div>
                            <Label>Data de Entrada</Label>
                            <Input type="date" {...register('entry_date')} />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Itens da Nota</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ product_id: 0, quantity: 1, unit_cost: 0 })}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Item
                            </Button>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Produto</TableHead>
                                    <TableHead className="w-[15%]">Qtd</TableHead>
                                    <TableHead className="w-[20%]">Custo Unit.</TableHead>
                                    <TableHead className="w-[20%]">Total</TableHead>
                                    <TableHead className="w-[5%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const qty = watch(`items.${index}.quantity`) || 0;
                                    const cost = watch(`items.${index}.unit_cost`) || 0;
                                    const total = qty * cost;

                                    // Create a string key for the Select value to avoid type errors
                                    const currentProductId = watch(`items.${index}.product_id`)?.toString() || "";

                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Controller
                                                    control={control}
                                                    name={`items.${index}.product_id`}
                                                    rules={{ required: true, min: 1 }}
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={(val) => handleProductSelect(index, val)}
                                                            value={currentProductId} // Bind to the watched string value
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Produto..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {loadingProducts ? (
                                                                    <SelectItem value="0" disabled>Carregando...</SelectItem>
                                                                ) : (
                                                                    products?.map((p: any) => (
                                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                                            {p.name}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 0.001 })}
                                                    step="0.001"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    {...register(`items.${index}.unit_cost`, { valueAsNumber: true, min: 0 })}
                                                    step="0.01"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {fields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            Nenhum item adicionado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totals Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label>Observações</Label>
                            <Input {...register('notes')} placeholder="Detalhes adicionais..." />
                        </div>
                        <div className="bg-secondary/20 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span>Subtotal Itens:</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemsTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Custos Adicionais:</span>
                                <Input
                                    className="w-32 h-8 text-right"
                                    type="number"
                                    {...register('additional_costs', { valueAsNumber: true })}
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Desconto:</span>
                                <Input
                                    className="w-32 h-8 text-right text-red-600"
                                    type="number"
                                    {...register('discount_amount', { valueAsNumber: true })}
                                    step="0.01"
                                />
                            </div>
                            <div className="border-t pt-2 flex justify-between items-center font-bold text-lg">
                                <span>Total Final:</span>
                                <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            onClick={() => setStatus('draft')}
                            disabled={createMutation.isPending}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Rascunho
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => setStatus('completed')}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <BadgeCheck className="w-4 h-4 mr-2" />
                            )}
                            Confirmar Entrada
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
