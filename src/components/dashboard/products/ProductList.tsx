import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ImageIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductListProps {
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  products: Product[];
  isLoading?: boolean;
  error?: Error | null;
  // External Pagination Props
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function ProductList({
  onEditProduct,
  onDeleteProduct,
  products,
  isLoading,
  error,
  currentPage,
  itemsPerPage,
  totalCount,
  onPageChange,
  onLimitChange
}: ProductListProps) {

  // Pagination Logic (Server-side: products is current page data)
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  // Use products directly as they are the chunk for the current page
  const currentProducts = products;

  const getStockStatus = (quantity: number, minStock: number = 5) => {
    if (quantity <= 0) return { label: 'Sem Estoque', color: 'bg-red-100 text-red-700 border-red-200' };
    if (quantity <= minStock) return { label: 'Baixo', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { label: 'Disponível', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const PaginationControls = () => (
    <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-x border-b border-gray-200 dark:border-neutral-800 rounded-b-xl bg-white dark:bg-neutral-900 shadow-sm">
      <div className="text-sm text-muted-foreground w-full sm:w-auto text-center sm:text-left">
        Mostrando {startIndex + 1} até {endIndex} de {totalCount} registros
      </div>

      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Linhas por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(val) => onLimitChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 30, 50].map(size => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-24 text-center">
            Página {currentPage} de {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 text-red-600 p-4 rounded-lg border border-red-200">
        Erro ao carregar produtos: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <div className="flex-1 overflow-y-auto border rounded-t-xl shadow-sm bg-white dark:bg-neutral-900 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              currentProducts.map((product) => {
                const status = getStockStatus(product.stock_quantity, product.minimum_stock_level);
                return (
                  <TableRow key={product.id} className="group hover:bg-neutral-50 transition-colors">
                    <TableCell>
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-neutral-100 dark:bg-neutral-800">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{product.name}</span>
                        <span className="text-xs text-neutral-500 font-mono">{product.code || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs bg-neutral-50">
                        {product.category || 'Geral'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] px-2 py-0.5 border shadow-none ${status.color}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium font-mono">
                      {product.stock_quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEditProduct(product)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteProduct(product)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed Bottom Pagination */}
      <PaginationControls />
    </div>
  );
}
