import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
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
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  category: z.string().optional(),
  brand: z.string().optional(),
  code: z.string().optional(),
  stock_quantity: z.coerce.number().int().min(0, { message: 'O estoque não pode ser negativo.' }),
  minimum_stock_level: z.coerce.number().int().min(0, { message: 'O estoque mínimo não pode ser negativo.' }),
});

// API Functions
async function addProduct(product: z.infer<typeof formSchema>) {
  const { data, error } = await supabase.from('products').insert([product]).select();
  if (error) throw new Error(error.message);
  return data;
}

async function updateProduct({ id, ...product }: { id: number } & z.infer<typeof formSchema>) {
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function ProductsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sucesso!', description: 'Produto adicionado com sucesso.' });
      setIsSheetOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erro!', description: `Não foi possível adicionar o produto. ${error.message}`, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sucesso!', description: 'Produto atualizado com sucesso.' });
      setIsSheetOpen(false);
    },
        onError: (error) => {
      toast({ title: 'Erro!', description: `Não foi possível atualizar o produto. ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Sucesso!', description: 'Produto excluído com sucesso.' });
      setIsAlertOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erro!', description: `Não foi possível excluir o produto. ${error.message}`, variant: 'destructive' });
    },
  });

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

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, ...values });
    } else {
      addMutation.mutate(values);
    }
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

      <ProductList onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedProduct && !isAlertOpen ? 'Editar Produto' : 'Adicionar Novo Produto'}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ProductForm
              onSubmit={handleSubmit}
              isLoading={addMutation.isPending || updateMutation.isPending}
              product={selectedProduct}
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
            <AlertDialogAction onClick={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
