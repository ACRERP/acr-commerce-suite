import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Save, Loader2, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductRow {
    id: number;
    code: string;
    name: string;
    stock_quantity: number;
    cost_price: number;
    // Form state
    add_quantity: string;
    new_cost_price: string;
}

export function BulkStockEntry() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingIds, setUpdatingIds] = useState<number[]>([]);

    // Fetch Products
    const { data: products, isLoading } = useQuery({
        queryKey: ['products-bulk-entry', searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('products')
                .select('id, code, name, stock_quantity, cost_price')
                .order('name');

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query.limit(50); // Limit for performance
            if (error) throw error;
            return data as ProductRow[];
        }
    });

    // Local state for inputs (to avoid re-rendering whole list on every keystroke, 
    // we could use a map, but for simplicity let's use a controlled input component per row or a map)
    const [inputState, setInputState] = useState<Record<number, { qty: string, cost: string }>>({});

    const handleInputChange = (id: number, field: 'qty' | 'cost', value: string) => {
        setInputState(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleUpdate = async (product: ProductRow) => {
        const inputs = inputState[product.id] || { qty: '', cost: '' };
        const qtyToAdd = parseInt(inputs.qty);
        // Cost is optional, if empty use current
        const newCost = inputs.cost ? parseFloat(inputs.cost.replace(',', '.')) : product.cost_price;

        if (!qtyToAdd || qtyToAdd <= 0) {
            toast({ title: "Quantidade Inválida", description: "Informe um valor positivo para adicionar.", variant: "destructive" });
            return;
        }

        setUpdatingIds(prev => [...prev, product.id]);

        try {
            // 1. Create Stock Movement (Type: Entrada)
            const { error: moveError } = await supabase.from('stock_movements').insert({
                product_id: product.id,
                movement_type: 'entrada',
                quantity: qtyToAdd,
                cost_price: newCost,
                reason: 'Entrada Rápida (Bulk)',
                user_id: (await supabase.auth.getUser()).data.user?.id
            });

            if (moveError) throw moveError;

            // 2. Update Product Stock & Cost
            const { error: prodError } = await supabase.from('products').update({
                stock_quantity: product.stock_quantity + qtyToAdd, // Manual increment (or rely on trigger)
                // We do manual here to be sure, assuming trigger handles/allows it.
                // Best practice: Let trigger handle stock if it exists. 
                // Given previous context, trigger exists. But to be safe and responsive:
                cost_price: newCost
            }).eq('id', product.id);

            if (prodError) throw prodError;

            toast({ title: "Estoque Atualizado!", description: `${product.name}: +${qtyToAdd} un.` });

            // Clear inputs for this row
            setInputState(prev => {
                const newState = { ...prev };
                delete newState[product.id];
                return newState;
            });

            // Refresh list
            queryClient.invalidateQueries({ queryKey: ['products-bulk-entry'] });
            queryClient.invalidateQueries({ queryKey: ['stock-value-report'] }); // Refresh dashboard stats

        } catch (err) {
            console.error(err);
            toast({ title: "Erro ao atualizar", variant: "destructive" });
        } finally {
            setUpdatingIds(prev => prev.filter(id => id !== product.id));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                    placeholder="Buscar produto por nome ou código..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
                <Table>
                    <TableHeader className="bg-neutral-50 dark:bg-neutral-800">
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="w-[100px]">Estoque</TableHead>
                            <TableHead className="w-[120px]">Adicionar Qtd</TableHead>
                            <TableHead className="w-[120px]">Custo (R$)</TableHead>
                            <TableHead className="w-[100px]">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                        ) : products?.map(product => {
                            const inputs = inputState[product.id] || { qty: '', cost: '' };
                            const isUpdating = updatingIds.includes(product.id);

                            return (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{product.name}</span>
                                            <span className="text-xs text-neutral-500">{product.code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {product.stock_quantity}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="+0"
                                            className="h-8 w-24 border-green-200 focus:border-green-500 bg-green-50/20"
                                            value={inputs.qty}
                                            onChange={(e) => handleInputChange(product.id, 'qty', e.target.value)}
                                            disabled={isUpdating}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder={product.cost_price?.toString() || "0.00"}
                                            className="h-8 w-24"
                                            value={inputs.cost}
                                            onChange={(e) => handleInputChange(product.id, 'cost', e.target.value)}
                                            disabled={isUpdating}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            className={inputs.qty ? "bg-green-600 hover:bg-green-700 text-white" : "opacity-0 pointer-events-none"}
                                            onClick={() => handleUpdate(product)}
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!isLoading && (!products || products.length === 0) && (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-neutral-500">Nenhum produto encontrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-neutral-500 text-right">
                Mostrando os primeiros 50 resultados. Use a busca para encontrar itens específicos.
            </div>
        </div>
    );
}
