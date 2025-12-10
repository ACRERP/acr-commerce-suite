import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, PlusCircle, Search, X, Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';


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

  // Calcular estatísticas
  const total = products?.length || 0;
  const active = products?.filter(p => p.stock > 0).length || 0;
  const lowStock = products?.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 5)).length || 0;
  const totalValue = products?.reduce((sum, p) => sum + (p.price * p.stock), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Produtos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button onClick={handleNewProduct} className="hover:scale-105 transition-transform">
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Dashboard - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Produtos
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Produtos Ativos
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {active}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Estoque Baixo
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {lowStock}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valor Total
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, código, código de barras..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário em Dialog/Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? `Editar Produto: ${selectedProduct.name}` : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct || undefined}
            onSubmit={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

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
