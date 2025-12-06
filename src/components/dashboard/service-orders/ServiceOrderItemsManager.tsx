
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash, Wrench, Package } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';

// Simplified Product Type
interface Product {
    id: number;
    name: string;
    price: number;
    stock_quantity: number;
}

export interface ServiceOrderItem {
    id?: number; // Optional because new items don't have ID yet
    item_type: 'service' | 'part';
    product_id?: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface ServiceOrderItemsManagerProps {
    items: ServiceOrderItem[];
    onItemsChange: (items: ServiceOrderItem[]) => void;
}

export function ServiceOrderItemsManager({ items, onItemsChange }: ServiceOrderItemsManagerProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [newItem, setNewItem] = useState<ServiceOrderItem>({
        item_type: 'service',
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        const { data } = await supabase.from('products').select('id, name, price, stock_quantity');
        if (data) setProducts(data);
    }

    const handleAddItem = () => {
        if (!newItem.description) return;
        const itemToAdd = { ...newItem, total_price: newItem.quantity * newItem.unit_price };
        onItemsChange([...items, itemToAdd]);
        setNewItem({
            item_type: 'service',
            description: '',
            quantity: 1,
            unit_price: 0,
            total_price: 0,
            product_id: null
        });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onItemsChange(newItems);
    };

    const handleProductSelect = (productId: string) => {
        const product = products.find(p => p.id.toString() === productId);
        if (product) {
            setNewItem({
                ...newItem,
                item_type: 'part',
                product_id: product.id,
                description: product.name,
                unit_price: product.price,
                total_price: product.price * newItem.quantity
            });
        }
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + item.total_price, 0);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 items-end border p-4 rounded-lg bg-gray-50">
                <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">Tipo</label>
                    <Select
                        value={newItem.item_type}
                        onValueChange={(val: 'service' | 'part') => setNewItem({ ...newItem, item_type: val })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="service"><div className="flex items-center"><Wrench className="w-3 h-3 mr-2" /> Serviço</div></SelectItem>
                            <SelectItem value="part"><div className="flex items-center"><Package className="w-3 h-3 mr-2" /> Peça/Produto</div></SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {newItem.item_type === 'part' && (
                    <div className="col-span-3">
                        <label className="text-xs font-medium text-gray-500">Buscar Produto</label>
                        <Select onValueChange={handleProductSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name} (Estoque: {p.stock_quantity})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className={newItem.item_type === 'part' ? "col-span-3" : "col-span-6"}>
                    <label className="text-xs font-medium text-gray-500">Descrição</label>
                    <Input
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Ex: Troca de Tela / Display iPhone X"
                    />
                </div>

                <div className="col-span-1">
                    <label className="text-xs font-medium text-gray-500">Qtd</label>
                    <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    />
                </div>

                <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">Valor Unit.</label>
                    <Input
                        type="number"
                        step="0.01"
                        value={newItem.unit_price}
                        onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                    />
                </div>

                <div className="col-span-1">
                    <Button onClick={handleAddItem} size="icon" className="w-full">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-20">Qtd</TableHead>
                        <TableHead className="w-24">Unitário</TableHead>
                        <TableHead className="w-24">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                {item.item_type === 'service' ? <Wrench className="w-4 h-4 text-blue-500" /> : <Package className="w-4 h-4 text-orange-500" />}
                            </TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                            <TableCell className="font-bold">R$ {item.total_price.toFixed(2)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                                    <Trash className="w-4 h-4 text-red-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-400 py-8">Nenhum item adicionado</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                    <span className="text-gray-500 mr-4">Total da OS:</span>
                    <span className="text-2xl font-bold">R$ {calculateTotal().toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
