import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Tag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Archive,
  FolderTree,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProducts } from '@/hooks/useProducts';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/products';

export function EnhancedProductManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'Package', color: 'blue' });
  
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useProductManagement();
  const bulkPriceUpdate = useBulkPriceUpdate();
  const bulkCategoryUpdate = useBulkCategoryUpdate();
  const bulkStockUpdate = useBulkStockUpdate();
  const exportProducts = useExportProducts();
  const createCategory = useCreateCategory();
  const { toast } = useToast();

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle product selection
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // Handle bulk operations
  const handleBulkPriceUpdate = (newPrice: number) => {
    if (selectedProducts.length === 0) {
      toast({ title: "Nenhum produto selecionado", variant: "destructive" });
      return;
    }
    
    bulkPriceUpdate.mutate({
      product_ids: selectedProducts,
      new_price: newPrice,
      change_reason: 'Atualização em lote'
    });
  };

  const handleBulkCategoryUpdate = (categoryId: string) => {
    if (selectedProducts.length === 0) {
      toast({ title: "Nenhum produto selecionado", variant: "destructive" });
      return;
    }
    
    bulkCategoryUpdate.mutate({
      product_ids: selectedProducts,
      category_id: categoryId
    });
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({ title: "Nome da categoria é obrigatório", variant: "destructive" });
      return;
    }
    
    createCategory.mutate({
      name: newCategory.name,
      description: newCategory.description,
      icon: newCategory.icon,
      color: newCategory.color,
      sort_order: categories.length + 1,
      is_active: true
    });
    
    setNewCategory({ name: '', description: '', icon: 'Package', color: 'blue' });
    setShowCategoryDialog(false);
  };

  const getCategoryIcon = (icon: string) => {
    // Simple icon mapping - you can expand this
    const icons: Record<string, React.ReactNode> = {
      'Package': <Package className="w-4 h-4" />,
      'Smartphone': <Package className="w-4 h-4" />,
      'Coffee': <Package className="w-4 h-4" />,
      'ShoppingBag': <Package className="w-4 h-4" />,
      'Sparkles': <Package className="w-4 h-4" />,
      'Home': <Package className="w-4 h-4" />,
      'Book': <Package className="w-4 h-4" />,
      'Dumbbell': <Package className="w-4 h-4" />,
      'Gamepad': <Package className="w-4 h-4" />
    };
    return icons[icon] || <Package className="w-4 h-4" />;
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'cyan': 'bg-cyan-500',
      'orange': 'bg-orange-500',
      'indigo': 'bg-indigo-500',
      'red': 'bg-red-500',
      'pink': 'bg-pink-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Produtos</h1>
          <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderTree className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nome</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da categoria"
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Descrição</Label>
                  <Textarea
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da categoria"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ícone</Label>
                    <Select value={newCategory.icon} onValueChange={(value) => setNewCategory(prev => ({ ...prev, icon: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Package">Pacote</SelectItem>
                        <SelectItem value="Smartphone">Celular</SelectItem>
                        <SelectItem value="Coffee">Café</SelectItem>
                        <SelectItem value="ShoppingBag">Sacola</SelectItem>
                        <SelectItem value="Sparkles">Brilho</SelectItem>
                        <SelectItem value="Home">Casa</SelectItem>
                        <SelectItem value="Book">Livro</SelectItem>
                        <SelectItem value="Dumbbell">Halter</SelectItem>
                        <SelectItem value="Gamepad">Gamepad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Select value={newCategory.color} onValueChange={(value) => setNewCategory(prev => ({ ...prev, color: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="purple">Roxo</SelectItem>
                        <SelectItem value="cyan">Ciano</SelectItem>
                        <SelectItem value="orange">Laranja</SelectItem>
                        <SelectItem value="indigo">Índigo</SelectItem>
                        <SelectItem value="red">Vermelho</SelectItem>
                        <SelectItem value="pink">Rosa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCategory} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Categoria
                  </Button>
                  <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => exportProducts.mutate()}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos por nome ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.icon)}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProducts.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedProducts.length} selecionados
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Operações em Lote</h3>
                <p className="text-sm text-gray-600">
                  {selectedProducts.length} produtos selecionados
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Limpar Seleção
                </Button>
                <Dialog open={showBulkOperations} onOpenChange={setShowBulkOperations}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      Operações
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Operações em Lote</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Atualizar Preço</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="number"
                            placeholder="Novo preço"
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => {
                              const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                              handleBulkPriceUpdate(parseFloat(input.value) || 0);
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Atualizar
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Alterar Categoria</Label>
                        <div className="flex gap-2 mt-2">
                          <Select onValueChange={handleBulkCategoryUpdate}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(category.icon)}
                                    {category.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Ajustar Estoque</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="number"
                            placeholder="Quantidade"
                            className="flex-1"
                          />
                          <Select>
                            <SelectTrigger className="w-24">
                              <SelectValue defaultValue="set" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="set">Definir</SelectItem>
                              <SelectItem value="add">Adicionar</SelectItem>
                              <SelectItem value="subtract">Remover</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button>
                            <Archive className="w-4 h-4 mr-2" />
                            Ajustar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos
              <Badge variant="secondary">{filteredProducts.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllProducts}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Selecionar Tudo
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category_id);
              const isSelected = selectedProducts.includes(product.id);
              const isLowStock = product.stock_quantity <= product.minimum_stock_level;
              
              return (
                <Card 
                  key={product.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.code}</p>
                      </div>
                      
                      {category && (
                        <div className="flex items-center gap-1">
                          <div className={cn("w-3 h-3 rounded-full", getCategoryColor(category.color))} />
                          <span className="text-xs text-gray-600">{category.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-600">
                          {format(product.sale_price, 'R$ ##,##0.00', { locale: ptBR })}
                        </span>
                        <Badge 
                          variant={isLowStock ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          Estoque: {product.stock_quantity}
                        </Badge>
                      </div>
                      
                      {isLowStock && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="text-xs">Estoque baixo</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2" />
              <p>Nenhum produto encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou adicionar novos produtos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
