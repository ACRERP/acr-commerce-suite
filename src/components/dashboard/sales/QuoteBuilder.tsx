import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateQuote, useUpdateQuote, QuoteItem, Quote } from '@/hooks/useQuotes';
import { ProductSearch } from '@/components/dashboard/sales/ProductSearch';
import { ClientSearch } from '@/components/dashboard/sales/ClientSearch';
import { Product } from '@/lib/products';
import { Client } from '@/components/dashboard/clients/ClientList';
import { Trash2, ShoppingCart, User, Calendar, FileText, ArrowLeft, Save, Settings, Wrench } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { QuoteSettingsDialog, SalesSettings } from './QuoteSettingsDialog';

interface QuoteBuilderProps {
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: Quote | null;
}

const DEFAULT_SETTINGS: SalesSettings = {
    showLabor: true,
    showParts: true,
    showServices: true,
    showShipping: false,
    showDiscountPerItem: true,
};

export function QuoteBuilder({ onCancel, onSuccess, initialData }: QuoteBuilderProps) {
    const [items, setItems] = useState<Partial<QuoteItem>[]>([]);
    const [client, setClient] = useState<Client | null>(null);
    const [validUntil, setValidUntil] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [notes, setNotes] = useState('');
    const [laborCost, setLaborCost] = useState(0);

    const [settings, setSettings] = useState<SalesSettings>(DEFAULT_SETTINGS);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Initialize form with existing data
    useEffect(() => {
        if (initialData) {
            if (initialData.items) {
                setItems(initialData.items.map(i => ({
                    ...i,
                    total: (i.quantity * i.unit_price) - (i.discount_amount || 0)
                })));
            }
            if (initialData.client_id) {
                // We only have ID and name from join, we need full client object usually for ClientSearch
                // But ClientSearch accepts "defaultClient". 
                // We assume we can construct a minimal client object or ClientSearch handles ID only?
                // ClientSearch requires Client object. 
                // Ideally we would fetch client details. For now let's fake it with available data.
                setClient({
                    id: initialData.client_id,
                    name: initialData.client_name || 'Carregando...',
                    cpf_cnpj: '', email: '', phone: ''
                } as Client);
            }
            setValidUntil(initialData.valid_until ? initialData.valid_until.split('T')[0] : '');
            setPaymentTerms(initialData.payment_terms || '');
            setNotes(initialData.notes || '');
            setLaborCost(initialData.labor_cost || 0);

            // Auto-enable labor if value exists
            if (initialData.labor_cost && initialData.labor_cost > 0) {
                setSettings(s => ({ ...s, showLabor: true }));
            }
        }
    }, [initialData]);

    useEffect(() => {
        const loadSettings = () => {
            const saved = localStorage.getItem('acr_sales_settings');
            if (saved) {
                try {
                    // Merge with current to keep auto-enabled flags
                    setSettings(prev => ({ ...prev, ...DEFAULT_SETTINGS, ...JSON.parse(saved) }));
                } catch (e) { }
            }
        };
        loadSettings();
        window.addEventListener('sales-settings-changed', loadSettings);
        return () => window.removeEventListener('sales-settings-changed', loadSettings);
    }, []);

    const createQuote = useCreateQuote();
    const updateQuote = useUpdateQuote();
    const { toast } = useToast();
    const isEditing = !!initialData;
    const isLoading = createQuote.isPending || updateQuote.isPending;

    const handleProductSelect = (product: Product) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: (i.quantity || 0) + 1, total: ((i.quantity || 0) + 1) * (i.unit_price || 0) }
                        : i
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: 1,
                    unit_price: product.sale_price,
                    discount_amount: 0,
                    total: product.sale_price
                }
            ];
        });
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: number) => {
        setItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const updates = { ...item, [field]: value };
                // Recalculate total
                if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount') {
                    updates.total = (updates.quantity || 0) * (updates.unit_price || 0) - (updates.discount_amount || 0);
                }
                return updates;
            })
        );
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const itemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    // Add Labor Cost to final total
    const finalTotal = itemsTotal + (settings.showLabor ? laborCost : 0);

    const handleSave = async () => {
        if (!client) {
            toast({ title: "Selecione um cliente", variant: "destructive" });
            return;
        }
        if (items.length === 0 && !laborCost) {
            toast({ title: "O orçamento está vazio", description: "Adicione produtos ou mão de obra.", variant: "destructive" });
            return;
        }

        try {
            if (isEditing && initialData) {
                await updateQuote.mutateAsync({
                    id: initialData.id,
                    data: {
                        client_id: client.id,
                        total_amount: finalTotal,
                        valid_until: validUntil || undefined,
                        payment_terms: paymentTerms,
                        notes: notes,
                        labor_cost: settings.showLabor ? laborCost : 0,
                    },
                    items
                });
            } else {
                await createQuote.mutateAsync({
                    client_id: client.id,
                    total_amount: finalTotal,
                    valid_until: validUntil || undefined,
                    payment_terms: paymentTerms,
                    notes: notes,
                    items,
                    labor_cost: settings.showLabor ? laborCost : 0
                });
            }
            onSuccess();
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <QuoteSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isEditing ? `Editando Orçamento #${initialData.id}` : 'Novo Orçamento'}
                        </h2>
                        <p className="text-neutral-500">
                            {client ? `Proposta para ${client.name}` : 'Preencha os dados da proposta.'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} title="Configurações">
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave} className="btn-primary gap-2" disabled={isLoading}>
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Salvando...' : 'Salvar Proposta'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form & Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary-600" />
                                Cliente & Condições
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Cliente</Label>
                                {client ? (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-neutral-50 mt-2">
                                        <span className="font-medium">{client.name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => setClient(null)} className="text-red-500 hover:text-red-700">Trocar</Button>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <ClientSearch onClientSelect={setClient} defaultClient={client} />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Validade da Proposta</Label>
                                    <div className="relative mt-2">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <Input
                                            type="date"
                                            className="pl-9"
                                            value={validUntil}
                                            onChange={(e) => setValidUntil(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Condições de Pagamento</Label>
                                    <Input
                                        placeholder="Ex: 30/60/90 Dias"
                                        className="mt-2"
                                        value={paymentTerms}
                                        onChange={(e) => setPaymentTerms(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Observações Internas</Label>
                                <Textarea
                                    placeholder="Notas sobre a negociação..."
                                    className="mt-2"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {settings.showParts && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary-600" />
                                    Itens e Produtos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <ProductSearch onProductSelect={handleProductSelect} />

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-neutral-50 text-neutral-500 font-medium border-b">
                                            <tr>
                                                <th className="p-3">Produto</th>
                                                <th className="p-3 w-24">Qtd</th>
                                                <th className="p-3 w-32">Preço Unit.</th>
                                                {settings.showDiscountPerItem && <th className="p-3 w-32">Desc.</th>}
                                                <th className="p-3 w-32 text-right">Total</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                                                        Nenhum produto adicionado.
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map((item, index) => (
                                                    <tr key={index} className="group hover:bg-neutral-50">
                                                        <td className="p-3 font-medium">{item.product_name}</td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-8 w-20"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                className="h-8 w-28"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                                                            />
                                                        </td>
                                                        {settings.showDiscountPerItem && (
                                                            <td className="p-3">
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="h-8 w-28 text-red-600"
                                                                    value={item.discount_amount}
                                                                    onChange={(e) => updateItem(index, 'discount_amount', Number(e.target.value))}
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="p-3 text-right font-bold text-neutral-900">
                                                            {formatCurrency(item.total || 0)}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-neutral-400 hover:text-red-500"
                                                                onClick={() => removeItem(index)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {settings.showLabor && (
                        <Card className="border-orange-200 bg-orange-50/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-700">
                                    <Wrench className="w-5 h-5" />
                                    Mão de Obra e Serviços
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Label>Valor Total da Mão de Obra</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="mt-2 text-lg font-bold"
                                            value={laborCost}
                                            onChange={(e) => setLaborCost(Number(e.target.value))}
                                        />
                                        <p className="text-xs text-neutral-500 mt-1">Este valor será somado ao total da proposta.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-6 border-primary-100 bg-primary-50/30">
                        <CardHeader>
                            <CardTitle>Resumo do Orçamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {settings.showParts && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Produtos ({items.length})</span>
                                    <span className="font-medium">
                                        {formatCurrency(itemsTotal + items.reduce((acc, i) => acc + (i.discount_amount || 0), 0))}
                                    </span>
                                </div>
                            )}

                            {settings.showDiscountPerItem && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span className="text-red-500">Descontos</span>
                                    <span className="font-medium">
                                        - {formatCurrency(items.reduce((acc, i) => acc + (i.discount_amount || 0), 0))}
                                    </span>
                                </div>
                            )}

                            {settings.showLabor && (
                                <div className="flex justify-between text-sm text-orange-700 font-medium">
                                    <span>Mão de Obra</span>
                                    <span>{formatCurrency(laborCost)}</span>
                                </div>
                            )}

                            <div className="border-t border-primary-200 pt-4 mt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-primary-900">Total</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-extrabold text-primary-600 block leading-none">
                                            {formatCurrency(finalTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full btn-primary h-12 text-lg shadow-lg shadow-primary-500/20" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? (isEditing ? 'Atualizando...' : 'Criando...') : (isEditing ? 'Atualizar Proposta' : 'Salvar Proposta')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
