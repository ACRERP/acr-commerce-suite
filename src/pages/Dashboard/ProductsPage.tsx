import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { ProductList } from '@/components/dashboard/products/ProductList';
import { Product } from '@/lib/products';
import { ProductForm } from '@/components/dashboard/products/ProductForm';
import { BulkProductImport } from '@/components/dashboard/products/BulkProductImport';
import { ABCAnalysis } from '@/components/dashboard/products/ABCAnalysis';
import { CategoryManagement } from '@/components/dashboard/products/CategoryManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Upload, PlusCircle, Search, X } from 'lucide-react';


interface ProductsPageProps {
  openForm?: boolean;
  defaultTab?: string;
}

export function ProductsPage({ openForm = false, defaultTab = "products" }: ProductsPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(openForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Usando hooks personalizados
  const { data: products, isLoading, error } = useProducts();
  const deleteMutation = useDeleteProduct();

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
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
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  // Filter products by search term
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Top Bar Horizontal Menu */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-bold border-r pr-4 mr-2">Produtos</h1>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, código, código de barras..."
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button onClick={handleNewProduct} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Horizontal Collapsible Form */}
      <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
        <CollapsibleContent className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedProduct ? `✏️ Editar Produto: ${selectedProduct.name}` : '➕ Novo Produto'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            <ProductForm
              product={selectedProduct || undefined}
              onSubmit={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Content Tabs */}
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="products">Catálogo</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="abc">Análise ABC</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="flex-1 overflow-auto">
          <ProductList
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            products={filteredProducts}
            isLoading={isLoading}
            error={error}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="abc">
          <ABCAnalysis />
        </TabsContent>
      </Tabs>

      {/* Delete Alert Dialog */}
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

      {/* Bulk Import Dialog */}
      <BulkProductImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />
    </div>
  );
}
