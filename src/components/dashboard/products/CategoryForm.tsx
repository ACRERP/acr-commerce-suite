import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useHierarchicalCategories, useCreateCategory, useUpdateCategory } from '@/hooks/useProductCategories';
import { ProductCategory, CreateCategoryData, generateCategoryCode, validateCategoryData } from '@/lib/productCategories';
import { z } from 'zod';
import { Palette, Folder, Hash, ArrowUpDown } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  code: z.string().min(2, 'Código deve ter pelo menos 2 caracteres').max(20, 'Código muito longo'),
  parent_id: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato #RRGGBB'),
  sort_order: z.string().transform(Number).pipe(z.number().int().min(0)),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: ProductCategory;
  onSubmit: (data: CreateCategoryData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const commonIcons = [
  { name: 'laptop', label: 'Eletrônicos' },
  { name: 'shirt', label: 'Vestuário' },
  { name: 'utensils', label: 'Alimentos' },
  { name: 'coffee', label: 'Bebidas' },
  { name: 'spray-can', label: 'Limpeza' },
  { name: 'home', label: 'Móveis' },
  { name: 'dumbbell', label: 'Esportes' },
  { name: 'book', label: 'Livros' },
  { name: 'gamepad', label: 'Brinquedos' },
  { name: 'heart', label: 'Saúde' },
  { name: 'car', label: 'Automotivo' },
  { name: 'package', label: 'Outros' },
];

const commonColors = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Lima', value: '#84CC16' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Índigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cinza', value: '#6B7280' },
];

export function CategoryForm({ 
  category, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CategoryFormProps) {
  const { toast } = useToast();
  const { data: hierarchicalCategories } = useHierarchicalCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      code: category?.code || '',
      parent_id: category?.parent_id || '',
      icon: category?.icon || '',
      color: category?.color || '#6366F1',
      sort_order: category?.sort_order?.toString() || '0',
    },
  });

  const name = form.watch('name');
  const selectedIcon = form.watch('icon');
  const selectedColor = form.watch('color');

  // Auto-generate code from name
  const generateCode = () => {
    if (name) {
      const code = generateCategoryCode(name);
      form.setValue('code', code);
    }
  };

  useEffect(() => {
    if (name && !category) {
      const code = generateCategoryCode(name);
      form.setValue('code', code);
    }
  }, [name, category, form]);

  const handleSubmit = (data: CategoryFormData) => {
    // Validate category data
    const categoryData: CreateCategoryData = {
      name: data.name,
      description: data.description,
      code: data.code,
      parent_id: data.parent_id || undefined,
      icon: data.icon,
      color: data.color,
      sort_order: data.sort_order,
    };

    const errors = validateCategoryData(categoryData);
    if (errors.length > 0) {
      toast({
        title: 'Erro de validação',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    if (category) {
      updateCategory.mutate({ ...categoryData, id: category.id });
    } else {
      createCategory.mutate(categoryData);
    }
  };

  const getCategorySelectOptions = (categories: ProductCategory[], level = 0): { value: string; label: string }[] => {
    const options: { value: string; label: string }[] = [];
    
    categories.forEach(cat => {
      if (category?.id !== cat.id) { // Prevent self-selection
        const indent = '  '.repeat(level);
        options.push({
          value: cat.id,
          label: `${indent}${cat.name}`,
        });
        
        if (cat.children && cat.children.length > 0) {
          options.push(...getCategorySelectOptions(cat.children, level + 1));
        }
      }
    });
    
    return options;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {category ? 'Editar Categoria' : 'Nova Categoria'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Código" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateCode}
                        disabled={!name}
                      >
                        <Hash className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da categoria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Category */}
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Pai</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (Categoria raiz)</SelectItem>
                      {hierarchicalCategories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      {hierarchicalCategories?.map((cat) => 
                        getCategorySelectOptions(cat.children || []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visual Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Configuração Visual
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonIcons.map((icon) => (
                            <SelectItem key={icon.name} value={icon.name}>
                              <div className="flex items-center">
                                <span className="mr-2">{icon.name}</span>
                                <span className="text-sm text-gray-500">{icon.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cor">
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded mr-2"
                                  style={{ backgroundColor: field.value }} // Required for dynamic hex colors
                                />
                                {field.value}
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {commonColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded mr-2"
                                  style={{ backgroundColor: color.value }} // Required for dynamic hex colors
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              {(selectedIcon || selectedColor) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Visualização</h4>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: selectedColor }} // Required for dynamic hex colors
                    >
                      {selectedIcon ? selectedIcon.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <p className="font-medium">{name || 'Nome da Categoria'}</p>
                      <p className="text-sm text-gray-500">
                        {selectedIcon && `Ícone: ${selectedIcon}`}
                        {selectedIcon && selectedColor && ' • '}
                        {selectedColor && `Cor: ${selectedColor}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Order */}
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Exibição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || createCategory.isPending || updateCategory.isPending}>
                {isLoading || createCategory.isPending || updateCategory.isPending 
                  ? 'Salvando...' 
                  : category 
                    ? 'Atualizar' 
                    : 'Cadastrar'
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
