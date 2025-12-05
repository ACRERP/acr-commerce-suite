import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useCategoriesWithProductCount, useDeleteCategory, useCategoryHasProducts } from '@/hooks/useProductCategories';
import { ProductCategory } from '@/lib/productCategories';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Folder, 
  FolderOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

interface CategoryListProps {
  onEditCategory: (category: ProductCategory) => void;
  onCreateCategory: () => void;
}

export function CategoryList({ onEditCategory, onCreateCategory }: CategoryListProps) {
  const { data: categories, isLoading } = useCategoriesWithProductCount();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDeleteCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCategory) {
      try {
        deleteCategory.mutate(selectedCategory.id);
      } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes('violates foreign key constraint')) {
          toast({
            title: 'Erro ao excluir',
            description: 'Esta categoria possui produtos associados. Exclua ou mova os produtos primeiro.',
            variant: 'destructive',
          });
        }
      }
    }
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const expandAll = () => {
    const allCategoryIds = categories?.map(cat => cat.id) || [];
    setExpandedCategories(new Set(allCategoryIds));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const getProfitColor = (margin?: number) => {
    if (!margin) return 'text-gray-500';
    if (margin >= 50) return 'text-green-600';
    if (margin >= 20) return 'text-yellow-600';
    if (margin > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProfitIcon = (margin?: number) => {
    if (!margin) return DollarSign;
    if (margin >= 20) return TrendingUp;
    if (margin > 0) return TrendingDown;
    return DollarSign;
  };

  const renderCategory = (category: ProductCategory, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const indent = level * 24;

    return (
      <div key={category.id}>
        <div
          className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${16 + indent}px` }} // Required for dynamic indentation
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategoryExpansion(category.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: category.color }} // Required for dynamic hex colors
              >
                {category.icon ? category.icon.charAt(0).toUpperCase() : category.name.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{category.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {category.code}
                  </Badge>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-500">{category.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{category.product_count || 0}</span>
                <span className="text-sm text-gray-500">produtos</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditCategory(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteCategory(category)}
                disabled={deleteCategory.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Categorias</p>
                <p className="text-2xl font-bold">{categories?.length || 0}</p>
              </div>
              <Folder className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorias com Produtos</p>
                <p className="text-2xl font-bold">
                  {categories?.filter(cat => (cat.product_count || 0) > 0).length || 0}
                </p>
              </div>
              <Package className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold">
                  {categories?.reduce((sum, cat) => sum + (cat.product_count || 0), 0) || 0}
                </p>
              </div>
              <Package className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Categorias de Produtos</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir Todos
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Recolher Todos
              </Button>
              <Button onClick={onCreateCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, código ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Nenhuma categoria encontrada com os filtros aplicados.'
                  : 'Nenhuma categoria cadastrada.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={onCreateCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          ) : (
            <div>
              {filteredCategories.map(category => renderCategory(category))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{selectedCategory?.name}"? 
              {selectedCategory && (selectedCategory.product_count || 0) > 0 && (
                <span className="text-red-600 font-medium">
                  {' '}Esta categoria possui {selectedCategory.product_count} produtos associados.
                </span>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={selectedCategory && (selectedCategory.product_count || 0) > 0}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
