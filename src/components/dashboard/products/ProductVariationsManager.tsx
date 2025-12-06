import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Trash2,
    Loader2,
    Save,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    ProductVariation,
    createVariation,
    getProductVariations,
    deleteVariation
} from '@/lib/products';

interface Props {
    productId: number;
}

export function ProductVariationsManager({ productId }: Props) {
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newVariation, setNewVariation] = useState({
        name: '',
        sku: '',
        stock_quantity: 0,
        price: 0,
        attributes: {} // For now simple manual entry, later color/size selectors
    });
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadVariations();
    }, [productId]);

    async function loadVariations() {
        try {
            const data = await getProductVariations(productId);
            setVariations(data || []);
        } catch (error) {
            console.error('Error loading variations:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as variações.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAddVariation() {
        if (!newVariation.name) {
            toast({ title: 'Erro', description: 'O nome da variação é obrigatório.', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            await createVariation({
                product_id: productId,
                ...newVariation
            });

            toast({ title: 'Sucesso', description: 'Variação adicionada!' });
            setNewVariation({ name: '', sku: '', stock_quantity: 0, price: 0, attributes: {} });
            loadVariations();
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao criar variação.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Tem certeza que deseja remover esta variação?')) return;

        try {
            await deleteVariation(id);
            toast({ title: 'Sucesso', description: 'Variação removida.' });
            loadVariations();
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao remover variação.', variant: 'destructive' });
        }
    }

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                    Variações do Produto
                    <span className="text-sm font-normal text-muted-foreground">{variations.length} cadastradas</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Add Form */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/20 p-4 rounded-lg border">
                    <div className="md:col-span-4 space-y-2">
                        <Label>Nome (ex: Azul P)</Label>
                        <Input
                            value={newVariation.name}
                            onChange={e => setNewVariation({ ...newVariation, name: e.target.value })}
                            placeholder="Cor / Tamanho"
                        />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <Label>SKU (Opcional)</Label>
                        <Input
                            value={newVariation.sku}
                            onChange={e => setNewVariation({ ...newVariation, sku: e.target.value })}
                            placeholder="COD-AZ-P"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Estoque</Label>
                        <Input
                            type="number"
                            value={newVariation.stock_quantity}
                            onChange={e => setNewVariation({ ...newVariation, stock_quantity: Number(e.target.value) })}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input
                            type="number"
                            value={newVariation.price}
                            onChange={e => setNewVariation({ ...newVariation, price: Number(e.target.value) })}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleAddVariation}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {/* List */}
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Estoque</TableHead>
                                <TableHead className="text-right">Preço</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {variations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        Nenhuma variação cadastrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                variations.map((variation) => (
                                    <TableRow key={variation.id}>
                                        <TableCell className="font-medium">{variation.name}</TableCell>
                                        <TableCell>{variation.sku || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            {variation.stock_quantity > 0 ? (
                                                <span className="text-green-600 font-medium">{variation.stock_quantity}</span>
                                            ) : (
                                                <span className="text-red-500">Sem estoque</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {variation.price ? `R$ ${variation.price.toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(variation.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
