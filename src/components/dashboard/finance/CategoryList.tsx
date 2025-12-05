import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ChevronRight,
  ChevronDown,
  Folder,
  DollarSign,
  TrendingUp,
  Package,
  CreditCard
} from 'lucide-react';
import { useFinancialCategories, FinancialCategory } from '@/hooks/useFinancialCategories';
import { CategoryForm } from './CategoryForm';

const TYPE_CONFIG = {
  revenue: { label: 'Receita', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  expense: { label: 'Despesa', icon: DollarSign, color: 'text-red-600', bgColor: 'bg-red-50' },
  asset: { label: 'Ativo', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  liability: { label: 'Passivo', icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-50' },
};

interface CategoryListProps {
  onEditCategory?: (category: FinancialCategory) => void;
}

export function CategoryList({ onEditCategory }: CategoryListProps) {
  const {
    categories,
    isLoading,
    deleteCategory,
    toggleActive,
    isDeleting,
    isToggling,
    getCategoriesByType,
    getFlatCategories,
    getCategoryPath,
  } = useFinancialCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | FinancialCategory['type']>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filterInactive = useCallback((cats: FinancialCategory[]): FinancialCategory[] => {
    return cats
      .filter(cat => cat.is_active)
      .map(cat => ({
        ...cat,
        children: cat.children ? filterInactive(cat.children) : []
      }));
  }, []);

  const filterBySearch = useCallback((cats: FinancialCategory[], term: string): FinancialCategory[] => {
    const lowerTerm = term.toLowerCase();
    
    return cats
      .filter(cat => 
        cat.name.toLowerCase().includes(lowerTerm) ||
        cat.description?.toLowerCase().includes(lowerTerm)
      )
      .map(cat => ({
        ...cat,
        children: cat.children ? filterBySearch(cat.children, term) : []
      }));
  }, []);

  // Filter categories
  const filteredCategories = React.useMemo(() => {
    let filtered = filterType === 'all' ? categories : getCategoriesByType(filterType);
    
    if (!showInactive) {
      filtered = filterInactive(filtered);
    }
    
    if (searchTerm) {
      filtered = filterBySearch(filtered, searchTerm);
    }
    
    return filtered;
  }, [categories, filterType, showInactive, searchTerm, getCategoriesByType, filterInactive, filterBySearch]);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEdit = (category: FinancialCategory) => {
    setSelectedCategory(category);
    setShowEditDialog(true);
    onEditCategory?.(category);
  };

  const handleDelete = (category: FinancialCategory) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleToggleActive = (category: FinancialCategory) => {
    toggleActive({ id: category.id, is_active: !category.is_active });
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteCategory(selectedCategory.id);
      setShowDeleteDialog(false);
      setSelectedCategory(null);
    }
  };

  const CategoryItem = ({ category, level = 0 }: { category: FinancialCategory; level?: number }) => {
    const typeConfig = TYPE_CONFIG[category.type];
    const TypeIcon = typeConfig.icon;
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div className="border rounded-lg overflow-hidden">
        <div 
          className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
            !category.is_active ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Expand/Collapse button */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(category.id)}
                className="w-8 h-8 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            )}
            
            {!hasChildren && <div className="w-8" />}
            
            {/* Category icon and color */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: category.color }}
            >
              <span className="text-white font-bold text-sm">
                {category.icon.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Category info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{category.name}</span>
                <Badge variant="outline" className={typeConfig.bgColor}>
                  <TypeIcon className={`w-3 h-3 mr-1 ${typeConfig.color}`} />
                  {typeConfig.label}
                </Badge>
                {!category.is_active && (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
              {level > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {getCategoryPath(category.id).join(' > ')}
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleActive(category)}
              disabled={isToggling}
              title={category.is_active ? 'Desativar' : 'Ativar'}
            >
              {category.is_active ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category)}
              disabled={isDeleting}
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-t">
            {category.children!.map(child => (
              <CategoryItem key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categorias Financeiras</h2>
          <p className="text-gray-600">
            Organize suas transações por categorias
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={(value: 'all' | 'revenue' | 'expense' | 'asset' | 'liability') => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className={`w-4 h-4 ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showInactive" className="text-sm">
                Mostrar inativas
              </label>
            </div>
            
            <div className="text-sm text-gray-600">
              {filteredCategories.length} categorias
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria ainda'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Tente ajustar os filtros ou busca'
                  : 'Crie sua primeira categoria para começar a organizar suas finanças'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map(category => (
            <CategoryItem key={category.id} category={category} />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <CategoryForm
            onSuccess={() => setShowCreateDialog(false)}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <CategoryForm
            category={selectedCategory || undefined}
            onSuccess={() => setShowEditDialog(false)}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{selectedCategory?.name}"?
              {selectedCategory?.children && selectedCategory.children.length > 0 && (
                <span className="block mt-2 text-red-600">
                  <strong>Atenção:</strong> Esta categoria possui {selectedCategory.children.length} subcategoria(s) que também serão excluídas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
