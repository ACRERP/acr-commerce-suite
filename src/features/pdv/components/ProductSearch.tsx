import { useEffect, useRef, useState } from 'react';
import { Search, ScanBarcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '../hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/pdv';

interface ProductSearchProps {
    onFocus?: () => void;
}

// Simple beep sound setup
const playBeep = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime); // High pitch like a scanner
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.error("Audio beep failed", e);
    }
};

export function ProductSearch({ onFocus }: ProductSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: products = [] } = useProducts();
    const { addItem } = useCart();

    // Auto-focus logic aggressive
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current) inputRef.current.focus();
        };

        focusInput();
        const interval = setInterval(focusInput, 2000); // Keep bringing focus back if lost (kiosk mode style)

        // Cleanup
        return () => clearInterval(interval);
    }, []);

    // Also trigger on props change
    useEffect(() => {
        if (onFocus && inputRef.current) inputRef.current.focus();
    }, [onFocus]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // 1. Try exact match first (Barcode/SKU)
            const exactMatch = products.find(p =>
                (p.barcode && p.barcode === searchTerm) ||
                (p.code && p.code === searchTerm)
            );

            if (exactMatch) {
                addItem(exactMatch);
                playBeep();
                setSearchTerm('');
            } else {
                // 2. If single result in search, select it
                if (filteredProducts.length === 1) {
                    addItem(filteredProducts[0]);
                    playBeep();
                    setSearchTerm('');
                }
            }
        }
    };

    // Filter for list display (visual search)
    const filteredProducts = searchTerm.length > 1
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 8)
        : [];

    const handleProductSelect = (product: any) => {
        addItem(product);
        playBeep();
        setSearchTerm('');
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col gap-2 relative z-50 w-full">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 group-focus-within:text-primary transition-colors">
                    <ScanBarcode className="h-6 w-6" />
                </div>

                <Input
                    ref={inputRef}
                    placeholder="Bipe o produto ou digite..."
                    className="pl-14 h-16 text-2xl font-bold bg-white shadow-lg border-gray-200 focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {searchTerm && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            ENTER para confirmar
                        </span>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {searchTerm.length > 1 && filteredProducts.length > 0 && (
                <Card className="absolute top-20 left-0 right-0 max-h-[60vh] overflow-auto shadow-2xl border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                    <CardContent className="p-2">
                        <div className="space-y-1">
                            {filteredProducts.map((product, index) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    // Highlight first item as "Enter will select this"
                                    className={`w-full text-left p-3 rounded-lg transition-all flex justify-between items-center group
                                        ${index === 0 ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-gray-900 text-lg group-hover:text-primary">
                                            {product.name}
                                        </div>
                                        <div className="text-sm text-gray-500 flex gap-3">
                                            <span className="font-mono bg-gray-100 px-1.5 rounded text-xs border">
                                                {product.sku || product.barcode || 'S/ COD'}
                                            </span>
                                            <span className={`${(!product.stock_quantity || product.stock_quantity <= 0) ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                                {product.stock_quantity || 0} unid.
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right pl-4">
                                        <div className="font-bold text-xl text-primary">
                                            {formatCurrency(product.sale_price)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
