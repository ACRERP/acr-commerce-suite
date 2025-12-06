import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ImageIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/lib/products';


interface ProductListProps {
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  products: Product[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ProductList({ onEditProduct, onDeleteProduct, products, isLoading, error }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Erro ao carregar produtos: {error.message}</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagem</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Código</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded-md bg-gray-100"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.stock_quantity}</TableCell>
              <TableCell>{product.code}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEditProduct(product)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteProduct(product)} className="text-red-500">
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
