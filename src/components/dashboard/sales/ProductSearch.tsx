import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Product } from '@/lib/products';

async function searchProducts(searchTerm: string) {
  if (!searchTerm) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
}

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products, isLoading } = useQuery<Product[], Error>({
    queryKey: ['productSearch', searchTerm],
    queryFn: () => searchProducts(searchTerm),
    enabled: searchTerm.length > 1, // Only search when user types at least 2 chars
  });

  return (
    <div className="relative">
      <Input
        placeholder="Digite o nome ou código do produto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
          <ScrollArea className="h-48">
            {isLoading && <div className="p-4 text-sm text-muted-foreground">Buscando...</div>}
            {products && products.length === 0 && !isLoading && (
              <div className="p-4 text-sm text-muted-foreground">Nenhum produto encontrado.</div>
            )}
            {products?.map((product) => (
              <div
                key={product.id}
                className="p-2 hover:bg-muted cursor-pointer"
                onClick={() => {
                  onProductSelect(product);
                  setSearchTerm('');
                }}
              >
                {product.name}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
