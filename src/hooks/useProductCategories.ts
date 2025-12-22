import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getCategories,
  getCategoryById,
  getCategoryByCode,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithProductCount,
  buildCategoryTree,
  flattenCategoryTree,
  categoryHasProducts,
  getCategoryStatistics,
  ProductCategory,
  CreateCategoryData,
  UpdateCategoryData,
} from '@/lib/productCategories';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...categoryKeys.lists(), includeInactive] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  code: (code: string) => [...categoryKeys.details(), 'code', code] as const,
  withCount: ['categories', 'with-count'] as const,
  statistics: (id: string) => ['categories', 'statistics', id] as const,
};

// Get all categories
export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: categoryKeys.list(includeInactive),
    queryFn: () => getCategories(includeInactive),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get hierarchical categories
export function useHierarchicalCategories(includeInactive = false) {
  return useQuery({
    queryKey: [...categoryKeys.list(includeInactive), 'hierarchical'],
    queryFn: async () => {
      const categories = await getCategories(includeInactive);
      return buildCategoryTree(categories);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get categories with product count
export function useCategoriesWithProductCount() {
  return useQuery({
    queryKey: categoryKeys.withCount,
    queryFn: getCategoriesWithProductCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single category by ID
export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get category by code
export function useCategoryByCode(code: string) {
  return useQuery({
    queryKey: categoryKeys.code(code),
    queryFn: () => getCategoryByCode(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get category statistics
export function useCategoryStatistics(categoryId: string) {
  return useQuery({
    queryKey: categoryKeys.statistics(categoryId),
    queryFn: () => getCategoryStatistics(categoryId),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create category mutation
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: categoryKeys.withCount,
      });
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update category mutation
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateCategoryData) => updateCategory(data),
    onSuccess: (updatedCategory) => {
      // Invalidate category lists
      queryClient.invalidateQueries({
        queryKey: categoryKeys.lists(),
      });
      
      // Invalidate specific category cache
      queryClient.invalidateQueries({
        queryKey: categoryKeys.detail(updatedCategory.id),
      });
      
      // Invalidate categories with count
      queryClient.invalidateQueries({
        queryKey: categoryKeys.withCount,
      });
      
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete category mutation
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({
        queryKey: categoryKeys.all,
      });
      
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Check if category has products
export function useCategoryHasProducts(categoryId: string) {
  return useQuery({
    queryKey: ['category-has-products', categoryId],
    queryFn: () => categoryHasProducts(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Combined hook for category management
export function useCategoryManager() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: hierarchicalCategories, isLoading: hierarchicalLoading } = useHierarchicalCategories();
  const { data: categoriesWithCount, isLoading: countLoading } = useCategoriesWithProductCount();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const isLoading = categoriesLoading || hierarchicalLoading || countLoading;
  const isMutating = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending;
  
  return {
    categories: categories || [],
    hierarchicalCategories: hierarchicalCategories || [],
    categoriesWithCount: categoriesWithCount || [],
    isLoading,
    isMutating,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

// Hook for category form state
export function useCategoryForm(initialCategory?: ProductCategory) {
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: initialCategory?.name || '',
    description: initialCategory?.description || '',
    code: initialCategory?.code || '',
    parent_id: initialCategory?.parent_id || undefined,
    icon: initialCategory?.icon || '',
    color: initialCategory?.color || '#6366F1',
    sort_order: initialCategory?.sort_order || 0,
  });
  
  const updateField = (field: keyof CreateCategoryData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const reset = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      parent_id: undefined,
      icon: '',
      color: '#6366F1',
      sort_order: 0,
    });
  };
  
  return {
    formData,
    updateField,
    reset,
  };
}

// Hook for category selection
export function useCategorySelection() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
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
  
  const expandAll = (categoryIds: string[]) => {
    setExpandedCategories(new Set(categoryIds));
  };
  
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };
  
  return {
    selectedCategoryId,
    setSelectedCategoryId,
    expandedCategories,
    toggleCategoryExpansion,
    expandAll,
    collapseAll,
  };
}
