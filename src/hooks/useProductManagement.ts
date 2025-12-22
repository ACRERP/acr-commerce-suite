import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Types for enhanced product management
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: ProductCategory[];
}

export interface BulkOperation {
  id: string;
  operation_type: 'price_update' | 'category_change' | 'stock_update' | 'import' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_message?: string;
  file_path?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: number;
  old_price?: number;
  new_price: number;
  change_reason?: string;
  changed_by?: string;
  created_at: string;
}

export interface BulkPriceUpdate {
  product_ids: number[];
  new_price: number;
  change_reason?: string;
}

export interface BulkCategoryUpdate {
  product_ids: number[];
  category_id: string;
}

export interface BulkStockUpdate {
  product_ids: number[];
  stock_adjustment: number; // Can be positive or negative
  adjustment_type: 'set' | 'add' | 'subtract';
}

// Query keys
export const productManagementKeys = {
  all: ['product-management'] as const,
  categories: () => [...productManagementKeys.all, 'categories'] as const,
  category: (id: string) => [...productManagementKeys.categories(), id] as const,
  bulkOperations: () => [...productManagementKeys.all, 'bulk-operations'] as const,
  bulkOperation: (id: string) => [...productManagementKeys.bulkOperations(), id] as const,
  priceHistory: (productId: number) => [...productManagementKeys.all, 'price-history', productId] as const,
};

// Get product categories
export function useProductCategories() {
  return useQuery({
    queryKey: productManagementKeys.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return data as ProductCategory[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get hierarchical categories
export function useHierarchicalCategories() {
  const { data: categories = [] } = useProductCategories();

  return useQuery({
    queryKey: ['hierarchical-categories'],
    queryFn: async () => {
      const categoryMap = new Map<string, ProductCategory>();
      const rootCategories: ProductCategory[] = [];

      // First pass: create map and identify root categories
      categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // Second pass: build hierarchy
      categories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!;
        
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      return rootCategories;
    },
    enabled: categories.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data as ProductCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productManagementKeys.categories() });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProductCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productManagementKeys.categories() });
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productManagementKeys.categories() });
      toast({
        title: "Categoria desativada",
        description: "A categoria foi desativada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao desativar categoria",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get bulk operations
export function useBulkOperations() {
  return useQuery({
    queryKey: productManagementKeys.bulkOperations(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BulkOperation[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Start bulk price update
export function useBulkPriceUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ product_ids, new_price, change_reason }: BulkPriceUpdate) => {
      // Start bulk operation
      const { data: operationId, error: operationError } = await supabase
        .rpc('start_bulk_operation', {
          operation_type_param: 'price_update',
          total_records_param: product_ids.length
        });

      if (operationError) throw operationError;

      // Update products in batch
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          sale_price: new_price,
          updated_at: new Date().toISOString()
        })
        .in('id', product_ids);

      if (updateError) throw updateError;

      // Update operation status
      await supabase.rpc('update_bulk_operation_progress', {
        operation_id_param: operationId,
        processed_param: product_ids.length,
        status_param: 'completed'
      });

      return operationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: productManagementKeys.bulkOperations() });
      toast({
        title: "Atualização em lote concluída",
        description: "Os preços foram atualizados com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na atualização em lote",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Start bulk category update
export function useBulkCategoryUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ product_ids, category_id }: BulkCategoryUpdate) => {
      // Start bulk operation
      const { data: operationId, error: operationError } = await supabase
        .rpc('start_bulk_operation', {
          operation_type_param: 'category_change',
          total_records_param: product_ids.length
        });

      if (operationError) throw operationError;

      // Update products
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id })
        .in('id', product_ids);

      if (updateError) throw updateError;

      // Update operation status
      await supabase.rpc('update_bulk_operation_progress', {
        operation_id_param: operationId,
        processed_param: product_ids.length,
        status_param: 'completed'
      });

      return operationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: productManagementKeys.bulkOperations() });
      toast({
        title: "Categorias atualizadas",
        description: "As categorias dos produtos foram atualizadas com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categorias",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Start bulk stock update
export function useBulkStockUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ product_ids, stock_adjustment, adjustment_type }: BulkStockUpdate) => {
      // Start bulk operation
      const { data: operationId, error: operationError } = await supabase
        .rpc('start_bulk_operation', {
          operation_type_param: 'stock_update',
          total_records_param: product_ids.length
        });

      if (operationError) throw operationError;

      // Update stock based on adjustment type
      let updateQuery;
      if (adjustment_type === 'set') {
        updateQuery = supabase
          .from('products')
          .update({ stock_quantity: stock_adjustment })
          .in('id', product_ids);
      } else if (adjustment_type === 'add') {
        updateQuery = supabase.rpc('bulk_add_stock', {
          product_ids_param: product_ids,
          amount_param: stock_adjustment
        });
      } else { // subtract
        updateQuery = supabase.rpc('bulk_subtract_stock', {
          product_ids_param: product_ids,
          amount_param: stock_adjustment
        });
      }

      const { error: updateError } = await updateQuery;
      if (updateError) throw updateError;

      // Update operation status
      await supabase.rpc('update_bulk_operation_progress', {
        operation_id_param: operationId,
        processed_param: product_ids.length,
        status_param: 'completed'
      });

      return operationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: productManagementKeys.bulkOperations() });
      toast({
        title: "Estoque atualizado",
        description: "O estoque foi atualizado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get product price history
export function useProductPriceHistory(productId: number) {
  return useQuery({
    queryKey: productManagementKeys.priceHistory(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_price_history')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProductPriceHistory[];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

// Export products to CSV
export function useExportProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (filters?: { category_id?: string; active_only?: boolean }) => {
      // Start bulk operation
      const { data: operationId, error: operationError } = await supabase
        .rpc('start_bulk_operation', {
          operation_type_param: 'export'
        });

      if (operationError) throw operationError;

      let query = supabase
        .from('products')
        .select(`
          id, name, description, code, sku, barcode, unit,
          stock_quantity, minimum_stock_level, sale_price, cost_price,
          category_id, created_at, updated_at,
          product_categories:category_id (name)
        `);

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.active_only) {
        query = query.gte('stock_quantity', 0);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Convert to CSV
      const csv = [
        ['ID', 'Nome', 'Descrição', 'Código', 'SKU', 'Código de Barras', 
         'Unidade', 'Estoque', 'Estoque Mínimo', 'Preço Venda', 'Preço Custo', 'Categoria'],
        ...data.map(product => [
          product.id,
          product.name,
          product.description || '',
          product.code,
          product.sku || '',
          product.barcode || '',
          product.unit,
          product.stock_quantity,
          product.minimum_stock_level,
          product.sale_price,
          product.cost_price || '',
          product.product_categories?.name || ''
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Update operation status
      await supabase.rpc('update_bulk_operation_progress', {
        operation_id_param: operationId,
        processed_param: data.length,
        status_param: 'completed'
      });

      return csv;
    },
    onSuccess: (csv) => {
      queryClient.invalidateQueries({ queryKey: productManagementKeys.bulkOperations() });
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída",
        description: "Os produtos foram exportados com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}
