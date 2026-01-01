import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Box,
    Wand2,
    Check,
    Upload,
    Loader2,
    Trash2,
    Layers,
    Hash
} from "lucide-react";
import { generateEAN13 } from "@/lib/product-utils";
import { useToast } from "@/hooks/use-toast";
import { createBatch } from "@/lib/products";
import { FeatureGuard } from "@/components/auth/Guards";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useCreateProduct } from "@/hooks/useProducts";
import { useLicenseLimits } from "@/hooks/useLicenseLimits";

interface CreateProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CreateProductDialog = ({ open, onOpenChange }: CreateProductDialogProps) => {
    const { toast } = useToast();
    const { currentOrganization } = useOrganization();
    const { checkLimit } = useLicenseLimits();
    const createProductMutation = useCreateProduct();

    const [generatedCode, setGeneratedCode] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        price: "",      // sale_price
        cost: "",       // cost_price
        stock: "",      // stock_quantity
        description: "",
        min_stock: "5"  // minimum_stock_level
    });

    const [variations, setVariations] = useState<any[]>([]);
    const [newVariation, setNewVariation] = useState({ color: "", size: "" });

    const [batches, setBatches] = useState<any[]>([]);
    const [newBatch, setNewBatch] = useState({ number: "", expiry: "", quantity: "" });

    // Reset form when closed/opened
    useEffect(() => {
        if (!open) {
            // Optional: don't reset immediately to allow accidental closes? 
            // User style typically prefers reset on success, keep state on cancel. 
            // But standard dialog usually resets or keeps. Let's keep it simple.
        }
    }, [open]);

    const handleGenerateCode = () => {
        const ean = generateEAN13();
        setFormData(prev => ({ ...prev, sku: ean }));
        setGeneratedCode(ean);

        toast({
            title: "Código Gerado! 🏷️",
            description: `EAN-13 válido gerado: ${ean}`,
            duration: 3000,
        });
    };

    const handleSave = async () => {
        try {
            // Dupla verificação no save
            const { canCreate } = await checkLimit('products');
            if (!canCreate) {
                toast({ title: "Limite atingido", description: "Adquira uma licença para criar mais produtos.", variant: "destructive" });
                return;
            }

            const payload = {
                name: formData.name,
                code: formData.sku || generatedCode || `SKU-${Date.now()}`,
                sku: formData.sku,
                description: formData.description,
                unit: 'UN', // Default
                stock_quantity: Number(formData.stock) || 0,
                minimum_stock_level: Number(formData.min_stock) || 5,
                sale_price: Number(formData.price) || 0,
                cost_price: Number(formData.cost) || 0,
                // category_id: null // TODO: Add category selector
                variations: variations.map(v => ({
                    name: `${formData.name} - ${v.color} ${v.size}`.trim(),
                    sku: `${formData.sku || 'SKU'}-${v.color}-${v.size}`,
                    stock_quantity: Number(formData.stock) / (variations.length || 1) || 0, // Split stock or handle individually
                    attributes: { color: v.color, size: v.size }
                }))
            };

            const product = await createProductMutation.mutateAsync({
                productData: payload,
                organizationId: currentOrganization?.id
            });

            // Handle batches separately
            if (batches.length > 0) {
                await Promise.all(batches.map(batch =>
                    createBatch({
                        product_id: product.id,
                        batch_number: batch.number,
                        expiry_date: batch.expiry,
                        quantity: Number(batch.quantity) || 0
                    })
                ));
            }

            onOpenChange(false);

            // Reset form
            setFormData({
                name: "", sku: "", price: "", cost: "", stock: "", description: "", min_stock: "5"
            });
            setVariations([]);
            setBatches([]);

        } catch (e) {
            // Error handling is done in mutation hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl glass-window glass-window-compact !p-0">
                <DialogHeader className="p-5 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 text-white backdrop-blur-md border-b border-white/10">
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Box className="w-4 h-4 text-white" />
                        </div>
                        Novo Produto
                    </DialogTitle>
                    <p className="text-white/50 text-[10px] font-black uppercase tracking-[2px] mt-0.5">Cadastre itens para o catálogo oficial</p>
                </DialogHeader>

                <div className="max-h-[75vh] overflow-y-auto px-6 py-5 bg-white/5 backdrop-blur-sm space-y-6">
                    <div className="grid grid-cols-12 gap-6">
                        {/* Imagem */}
                        <div className="col-span-12 md:col-span-3">
                            <div className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center bg-black/20 hover:bg-black/30 transition-all cursor-pointer group backdrop-blur-md overflow-hidden relative">
                                <div className="p-3 rounded-full bg-white/5 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5 text-white/40" />
                                </div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Imagem</p>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Detalhes Prinicpais */}
                        <div className="col-span-12 md:col-span-9 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {/* Nome */}
                                <div className="col-span-2 space-y-1">
                                    <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Nome do Produto</Label>
                                    <Input
                                        placeholder="Ex: Smartphone Samsung Galaxy..."
                                        className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 transition-all input-compact font-bold"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* SKU/Código */}
                                <div className="col-span-1 space-y-1">
                                    <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">SKU/EAN</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Gerar..."
                                            className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 font-mono text-[11px] input-compact"
                                            value={formData.sku}
                                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-10 w-10 shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                            onClick={handleGenerateCode}
                                        >
                                            <Wand2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Preço */}
                                <div className="col-span-1 space-y-1">
                                    <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Preço Venda</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                                        <Input
                                            type="number"
                                            placeholder="0,00"
                                            className="h-10 pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Estoque */}
                        <div className="col-span-1 space-y-1">
                            <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Estoque</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                            />
                        </div>

                        {/* Custo */}
                        <div className="col-span-1 space-y-1">
                            <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Custo</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    className="h-10 pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                                    value={formData.cost}
                                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="col-span-2 space-y-1">
                            <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Descrição</Label>
                            <Textarea
                                placeholder="..."
                                className="min-h-[60px] bg-black/20 border-white/10 text-white placeholder:text-white/20 text-xs rounded-xl focus:bg-black/40 transition-all font-medium"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Seções Especializadas via FeatureGuard */}
                    <div className="col-span-2 space-y-6 pt-4 border-t border-white/10">
                        {/* Grade de Variantes (Moda/Beleza) */}
                        <FeatureGuard feature={['variants_grid', 'color_variation']}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Layers className="w-4 h-4" />
                                    <h4 className="font-black uppercase text-[10px] tracking-widest">Grade de Variantes</h4>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Configure tamanhos, cores ou modelos.</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Input
                                            placeholder="Cor"
                                            className="h-9 bg-black/20 border-white/10 text-white text-xs"
                                            value={newVariation.color}
                                            onChange={e => setNewVariation({ ...newVariation, color: e.target.value })}
                                        />
                                        <Input
                                            placeholder="Tam"
                                            className="h-9 bg-black/20 border-white/10 text-white text-xs"
                                            value={newVariation.size}
                                            onChange={e => setNewVariation({ ...newVariation, size: e.target.value })}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 bg-white/10 border-white/10 text-white hover:bg-white/20"
                                            onClick={() => {
                                                if (newVariation.color || newVariation.size) {
                                                    setVariations([...variations, newVariation]);
                                                    setNewVariation({ color: "", size: "" });
                                                }
                                            }}
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>

                                    {variations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {variations.map((v, i) => (
                                                <Badge key={i} variant="secondary" className="flex gap-1 items-center px-2 py-1 bg-white/10 text-white border-white/5">
                                                    {v.color} {v.size}
                                                    <Trash2
                                                        className="w-3 h-3 cursor-pointer hover:text-red-400"
                                                        onClick={() => setVariations(variations.filter((_, idx) => idx !== i))}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FeatureGuard>

                        {/* Controle de Lotes (Farmácia) */}
                        <FeatureGuard feature="batch_control">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Hash className="w-4 h-4" />
                                    <h4 className="font-black uppercase text-[10px] tracking-widest">Controle de Lotes</h4>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black text-white/30 uppercase">Nº do Lote</Label>
                                            <Input
                                                placeholder="LOTE123X"
                                                className="bg-black/20 h-9 border-white/10 text-white text-xs"
                                                value={newBatch.number}
                                                onChange={e => setNewBatch({ ...newBatch, number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black text-white/30 uppercase">Validade</Label>
                                            <Input
                                                type="date"
                                                className="bg-black/20 h-9 border-white/10 text-white text-xs"
                                                value={newBatch.expiry}
                                                onChange={e => setNewBatch({ ...newBatch, expiry: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 flex gap-2">
                                            <Input
                                                placeholder="Qtd"
                                                type="number"
                                                className="bg-black/20 h-9 w-20 border-white/10 text-white text-xs"
                                                value={newBatch.quantity}
                                                onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 flex-1 bg-white/10 border-white/10 text-white hover:bg-white/20"
                                                onClick={() => {
                                                    if (newBatch.number && newBatch.expiry) {
                                                        setBatches([...batches, newBatch]);
                                                        setNewBatch({ number: "", expiry: "", quantity: "" });
                                                    }
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Registrar Lote
                                            </Button>
                                        </div>
                                    </div>

                                    {batches.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {batches.map((b, i) => (
                                                <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 text-[10px] text-white/70">
                                                    <span>Lote: <strong>{b.number}</strong> (Val: {b.expiry})</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] border-white/10">{b.quantity} un</Badge>
                                                        <Trash2
                                                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                                                            onClick={() => setBatches(batches.filter((_, idx) => idx !== i))}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FeatureGuard>
                    </div>
                </div>

                <DialogFooter className="p-5 bg-black/20 dark:bg-black/40 border-t border-white/5 flex justify-between gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 text-white/50 hover:text-white hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="h-11 px-8 btn-primary hover-lift shadow-lg shadow-primary-500/20 text-xs font-black uppercase tracking-wider"
                        disabled={createProductMutation.isPending}
                    >
                        {createProductMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Salvar Produto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
