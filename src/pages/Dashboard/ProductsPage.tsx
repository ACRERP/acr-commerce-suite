import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { ProductList, Product } from '@/components/dashboard/products/ProductList';
import { ProductForm } from '@/components/dashboard/products/ProductForm';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';


export function ProductsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();
  
  // Usando hooks personalizados
  const { data: products, isLoading, error } = useProducts();
  const deleteMutation = useDeleteProduct();

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsSheetOpen(true);
  };

    const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
      setIsAlertOpen(false);
    }
  };

  const handleFormSuccess = () => {
    setIsSheetOpen(false);
    setSelectedProduct(null);
  };

  const handleFormCancel = () => {
    setIsSheetOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os produtos do seu catálogo.
          </p>
        </div>
        <Button onClick={handleNewProduct}>Novo Produto</Button>
      </div>

      <ProductList 
        onEditProduct={handleEditProduct} 
        onDeleteProduct={handleDeleteProduct} 
        products={products || []}
        isLoading={isLoading}
        error={error}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedProduct && !isAlertOpen ? 'Editar Produto' : 'Adicionar Novo Produto'}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ProductForm
              product={selectedProduct}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto
              <span className="font-bold"> {selectedProduct?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
