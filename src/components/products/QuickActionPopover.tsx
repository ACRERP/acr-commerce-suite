
import { useState } from "react";
import { Product } from "@/lib/products";
import { useUpdateProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Zap, Save, Minus, Plus, DollarSign, Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionPopoverProps {
    product: Product;
}

export function QuickActionPopover({ product }: QuickActionPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const updateProductMutation = useUpdateProduct();

    // Local state for edits
    const [stock, setStock] = useState(product.stock_quantity.toString());
    const [price, setPrice] = useState(product.sale_price.toString());

    const handleStockUpdate = async (newStock: number) => {
        if (newStock < 0) return; // Prevent negative stock if desired, or allow it

        // Optimistic UI update could be done here, but React Query handles it via invalidation
        try {
            await updateProductMutation.mutateAsync({
                ...product,
                stock_quantity: newStock
            });
            setStock(newStock.toString());
            setIsOpen(false); // Close on success? Or keep open? Maybe keep open for multiple edits.
            // Let's close to be snappy.
        } catch (e) {
            console.error("Failed to update stock", e);
        }
    };

    const handlePriceUpdate = async () => {
        const newPrice = parseFloat(price.replace(',', '.')); // Handle basic formatting
        if (isNaN(newPrice)) return;

        try {
            await updateProductMutation.mutateAsync({
                ...product,
                sale_price: newPrice
            });
            setIsOpen(false);
        } catch (e) {
            console.error("Failed to update price", e);
        }
    };

    const adjustStock = (delta: number) => {
        const current = Number(stock) || 0;
        const next = current + delta;
        setStock(next.toString());
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0 rounded-lg border-2 transition-all hover:scale-110 shadow-sm",
                        isOpen ? "border-amber-500 bg-amber-50 text-amber-600" : "border-amber-200 text-amber-500 hover:border-amber-400 hover:bg-amber-50"
                    )}
                    title="Ação Rápida (Estoque/Preço)"
                >
                    <Zap className={cn("w-4 h-4 fill-current", isOpen && "animate-pulse")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden shadow-xl border-amber-200" align="end">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3 text-white flex items-center justify-between">
                    <span className="font-bold text-sm truncate pr-4">{product.name}</span>
                    <Zap className="w-4 h-4 text-white/80" />
                </div>

                <Tabs defaultValue="stock" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 rounded-none bg-amber-50/50 p-1">
                        <TabsTrigger value="stock" className="data-[state=active]:bg-white data-[state=active]:text-amber-600">
                            <Package className="w-3.5 h-3.5 mr-2" />
                            Estoque
                        </TabsTrigger>
                        <TabsTrigger value="price" className="data-[state=active]:bg-white data-[state=active]:text-green-600">
                            <DollarSign className="w-3.5 h-3.5 mr-2" />
                            Preço
                        </TabsTrigger>
                    </TabsList>

                    {/* STOCK TAB */}
                    <TabsContent value="stock" className="p-4 space-y-4 focus-visible:outline-none ring-0">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Estoque Atual</Label>
                            <span className={cn(
                                "text-lg font-bold font-mono",
                                Number(stock) <= (product.minimum_stock_level || 5) ? "text-red-500" : "text-slate-700"
                            )}>
                                {stock} un
                            </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <Button variant="outline" size="sm" onClick={() => adjustStock(-10)} className="text-xs text-red-500 h-8">-10</Button>
                            <Button variant="outline" size="sm" onClick={() => adjustStock(-1)} className="text-xs text-red-500 h-8">-1</Button>
                            <Button variant="outline" size="sm" onClick={() => adjustStock(+1)} className="text-xs text-green-600 h-8">+1</Button>
                            <Button variant="outline" size="sm" onClick={() => adjustStock(+10)} className="text-xs text-green-600 h-8">+10</Button>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="h-9 text-center font-bold"
                                />
                            </div>
                            <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                onClick={() => handleStockUpdate(Number(stock))}
                                disabled={updateProductMutation.isPending}
                            >
                                {updateProductMutation.isPending ? "..." : <Save className="w-4 h-4" />}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* PRICE TAB */}
                    <TabsContent value="price" className="p-4 space-y-4 focus-visible:outline-none ring-0">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground uppercase font-bold">Preço Atual</Label>
                            <span className="text-lg font-bold font-mono text-green-600">
                                R$ {product.sale_price.toFixed(2)}
                            </span>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                                <Input
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="pl-9 font-mono text-lg h-11"
                                />
                            </div>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={handlePriceUpdate}
                                disabled={updateProductMutation.isPending}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Atualizar Preço
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer Hint */}
                <div className="bg-slate-50 p-2 text-[10px] text-center text-slate-400 border-t">
                    Alterações são salvas imediatamente no catálogo.
                </div>
            </PopoverContent>
        </Popover>
    );
}
