import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Product } from '@/lib/products';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, Barcode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface POSProductGridProps {
    onProductSelect: (product: Product) => void;
}

export function POSProductGrid({ onProductSelect }: POSProductGridProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ['pos-products'], // Cache key
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        }
    });

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.includes(searchTerm)
    ) || [];

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-neutral-900/20">
            {/* Search Bar - Big & Focused */}
            <div className="p-6 pb-2">
                <div className="w-full relative shadow-lg rounded-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/50" />
                    <Input
                        placeholder="Escanear código de barras ou buscar produto (F1)..."
                        className="h-16 pl-14 text-lg bg-white border-0 ring-1 ring-black/5 focus-visible:ring-primary shadow-sm rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">ENTER</Badge>
                    </div>
                </div>
            </div>

            {/* Visual Grid */}
            <ScrollArea className="flex-1 p-6">
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => onProductSelect(product)}
                                className="group relative flex flex-col items-start p-4 bg-white dark:bg-neutral-900 border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 transition-all rounded-xl text-left bg-gradient-to-br from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-900 overflow-hidden"
                            >
                                {/* Stock Badge */}
                                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${(product.stock_quantity || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {product.stock_quantity || 0} un
                                </div>

                                {/* Icon/Image Placeholder */}
                                <div className="w-10 h-10 mb-3 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Package className="w-5 h-5" />
                                </div>

                                <div className="space-y-1 w-full">
                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-muted-foreground truncate max-w-[50%]">
                                            {product.code || '-'}
                                        </p>
                                        <p className="font-bold text-lg text-primary">
                                            R$ {(product.sale_price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
