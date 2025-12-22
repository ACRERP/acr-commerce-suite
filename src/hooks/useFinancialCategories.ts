import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export interface FinancialCategory {
  id: string;
  name: string;
  description?: string;
  type: 'revenue' | 'expense' | 'asset' | 'liability';
  parent_id?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  company_id: string;
  children?: FinancialCategory[];
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  type: 'revenue' | 'expense' | 'asset' | 'liability';
  parent_id?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
  is_active?: boolean;
}

export function useFinancialCategories() {
  const queryClient = useQueryClient();

  // Fetch all categories
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financial-categories'],
    queryFn: async (): Promise<FinancialCategory[]> => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Build hierarchical structure
      const categoryMap = new Map<string, FinancialCategory>();
      const rootCategories: FinancialCategory[] = [];

      // First pass: create map
      (data || []).forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // Second pass: build hierarchy
      (data || []).forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!;
        
        if (category.parent_id && categoryMap.has(category.parent_id)) {
          const parent = categoryMap.get(category.parent_id)!;
          parent.children!.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      return rootCategories;
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert({
          ...categoryData,
          color: categoryData.color || '#6B7280',
          icon: categoryData.icon || 'folder',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Categoria Criada',
        description: 'A categoria financeira foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Criar Categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateCategoryData) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Categoria Atualizada',
        description: 'A categoria financeira foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Atualizar Categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if category has children
      const { data: children } = await supabase
        .from('financial_categories')
        .select('id')
        .eq('parent_id', id);

      if (children && children.length > 0) {
        throw new Error('Não é possível excluir categorias com subcategorias');
      }

      // Check if category is used in transactions
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (transactions && transactions.length > 0) {
        throw new Error('Não é possível excluir categorias utilizadas em transações');
      }

      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Categoria Excluída',
        description: 'A categoria financeira foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Excluir Categoria',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast({
        title: 'Status Atualizado',
        description: 'O status da categoria foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Atualizar Status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get categories by type
  const getCategoriesByType = (type: FinancialCategory['type']) => {
    const filterByType = (categories: FinancialCategory[]): FinancialCategory[] => {
      return categories
        .filter(cat => cat.type === type)
        .map(cat => ({
          ...cat,
          children: cat.children ? filterByType(cat.children) : []
        }));
    };
    
    return filterByType(categories);
  };

  // Get flat list of all categories
  const getFlatCategories = (categories: FinancialCategory[] = []): FinancialCategory[] => {
    const flat: FinancialCategory[] = [];
    
    const flatten = (cats: FinancialCategory[]) => {
      cats.forEach(cat => {
        flat.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };
    
    flatten(categories);
    return flat;
  };

  // Get category by id
  const getCategoryById = (id: string, categories: FinancialCategory[] = []): FinancialCategory | null => {
    const flat = getFlatCategories(categories);
    return flat.find(cat => cat.id === id) || null;
  };

  // Get parent categories (categories without parent)
  const getParentCategories = (type?: FinancialCategory['type']) => {
    const flat = getFlatCategories(categories);
    return flat.filter(cat => !cat.parent_id && (!type || cat.type === type));
  };

  // Get category path (breadcrumb)
  const getCategoryPath = (categoryId: string, categories: FinancialCategory[] = []): string[] => {
    const flat = getFlatCategories(categories);
    const path: string[] = [];
    
    const buildPath = (id: string) => {
      const category = flat.find(cat => cat.id === id);
      if (category) {
        path.unshift(category.name);
        if (category.parent_id) {
          buildPath(category.parent_id);
        }
      }
    };
    
    buildPath(categoryId);
    return path;
  };

  return {
    // Data
    categories,
    isLoading,
    error,
    
    // Mutations
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,
    
    // Computed values
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
    
    // Helper functions
    getCategoriesByType,
    getFlatCategories,
    getCategoryById,
    getParentCategories,
    getCategoryPath,
  };
}

// Hook for category statistics
export function useCategoryStats() {
  const { categories = [] } = useFinancialCategories();

  return useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const stats = {
        total: categories.length,
        byType: {
          revenue: 0,
          expense: 0,
          asset: 0,
          liability: 0,
        },
        active: 0,
        inactive: 0,
        withChildren: 0,
        withoutChildren: 0,
      };

      const countCategories = (cats: FinancialCategory[]) => {
        cats.forEach(cat => {
          stats.byType[cat.type]++;
          if (cat.is_active) stats.active++;
          else stats.inactive++;
          
          if (cat.children && cat.children.length > 0) {
            stats.withChildren++;
            countCategories(cat.children);
          } else {
            stats.withoutChildren++;
          }
        });
      };

      countCategories(categories);

      return stats;
    },
    enabled: categories.length > 0,
  });
}
