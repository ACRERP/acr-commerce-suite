import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  DollarSign, 
  TrendingUp, 
  Package, 
  CreditCard,
  Plus,
  X
} from 'lucide-react';
import { useFinancialCategories, CreateCategoryData, UpdateCategoryData } from '@/hooks/useFinancialCategories';
import { FinancialCategory } from '@/hooks/useFinancialCategories';

interface CategoryFormProps {
  category?: FinancialCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORY_TYPES = [
  { value: 'revenue', label: 'Receita', icon: TrendingUp, color: 'text-green-600' },
  { value: 'expense', label: 'Despesa', icon: DollarSign, color: 'text-red-600' },
  { value: 'asset', label: 'Ativo', icon: Package, color: 'text-blue-600' },
  { value: 'liability', label: 'Passivo', icon: CreditCard, color: 'text-purple-600' },
];

const ICONS = [
  'folder', 'dollar-sign', 'trending-up', 'package', 'credit-card', 'briefcase', 'shopping-cart',
  'home', 'users', 'wrench', 'file-text', 'megaphone', 'truck', 'zap', 'paperclip', 'arrow-down-left',
  'arrow-up-right', 'piggy-bank', 'calculator', 'chart-bar', 'pie-chart', 'receipt', 'banknote'
];

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#64748B', '#475569', '#1E293B'
];

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const { createCategory, updateCategory, getParentCategories, isCreating, isUpdating } = useFinancialCategories();
  
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    description: '',
    type: 'expense',
    parent_id: undefined,
    color: '#6B7280',
    icon: 'folder',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Load parent categories
  const parentCategories = getParentCategories(category?.type);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        type: category.type,
        parent_id: category.parent_id || undefined,
        color: category.color,
        icon: category.icon,
      });
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nome deve ter no máximo 100 caracteres';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (formData.parent_id === category?.id) {
      newErrors.parent_id = 'Uma categoria não pode ser própria subcategoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (category) {
        await updateCategory({ id: category.id, ...formData } as UpdateCategoryData);
      } else {
        await createCategory(formData);
      }
      
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: keyof CreateCategoryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const currentTypeConfig = CATEGORY_TYPES.find(t => t.value === formData.type);
  const IconComponent = currentTypeConfig?.icon || Folder;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className={`w-5 h-5 ${currentTypeConfig?.color}`} />
          {category ? 'Editar Categoria' : 'Nova Categoria'}
        </CardTitle>
        <CardDescription>
          {category ? 'Atualize as informações da categoria financeira' : 'Crie uma nova categoria financeira'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Categoria</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange('type', value as 'revenue' | 'expense' | 'asset' | 'liability')}
              disabled={!!category}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPES.map(type => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Aluguel, Salários, Vendas"
              maxLength={100}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva detalhes sobre esta categoria"
              rows={3}
              maxLength={500}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Parent Category */}
          {parentCategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_id">Categoria Pai (opcional)</Label>
              <Select 
                value={formData.parent_id} 
                onValueChange={(value) => handleInputChange('parent_id', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma (categoria raiz)</SelectItem>
                  {parentCategories
                    .filter(cat => cat.id !== category?.id)
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.parent_id && <p className="text-sm text-red-500">{errors.parent_id}</p>}
            </div>
          )}

          {/* Icon and Color */}
          <div className="grid grid-cols-2 gap-4">
            {/* Icon Picker */}
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">{formData.icon}</span>
                  {showIconPicker ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
                <div 
                  className="w-8 h-8 rounded border flex items-center justify-center"
                  style={{ backgroundColor: formData.color }}
                >
                  <span className="text-white text-sm">{formData.icon.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              
              {showIconPicker && (
                <div className="p-3 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-6 gap-2">
                    {ICONS.map(icon => (
                      <Button
                        key={icon}
                        type="button"
                        variant={formData.icon === icon ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          handleInputChange('icon', icon);
                          setShowIconPicker(false);
                        }}
                        className="text-lg"
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center gap-2"
                >
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: formData.color }}
                  />
                  {showColorPicker ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
                <span className="text-sm text-gray-600">{formData.color}</span>
              </div>
              
              {showColorPicker && (
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-10 gap-2">
                    {COLORS.map(color => (
                      <Button
                        key={color}
                        type="button"
                        variant={formData.color === color ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          handleInputChange('color', color);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 p-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <Label className="text-sm text-gray-600 mb-2 block">Preview</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formData.color }}
              >
                <span className="text-white font-bold">{formData.icon.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div className="font-medium">{formData.name || 'Nome da Categoria'}</div>
                <div className="text-sm text-gray-600">{formData.description || 'Descrição da categoria'}</div>
                <Badge variant="outline" className="mt-1">
                  {currentTypeConfig?.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Salvando...' : (category ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
