import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  searchProducts,
  getProductsByCategory,
  getLowStockProducts,
  Product,
  CreateProductData,
  UpdateProductData
} from '@/lib/products';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
  category: (category: string) => [...productKeys.all, 'category', category] as const,
  lowStock: () => [...productKeys.all, 'low-stock'] as const,
};

// Get all products (paginated)
export function usePaginatedProducts({ page = 1, limit = 10, search = '', organizationId }: { page?: number; limit?: number; search?: string; organizationId?: string } = {}) {
  return useQuery({
    queryKey: productKeys.list(JSON.stringify({ page, limit, search, organizationId })),
    queryFn: () => getProducts({ page, limit, search, organizationId }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    enabled: !!organizationId, // Prevent fetch without org
  });
}

// Legacy hook for backward compatibility (returns simple array)
export function useProducts(organizationId?: string) {
  return useQuery({
    queryKey: [...productKeys.lists(), { organizationId }],
    queryFn: async () => {
      if (!organizationId) return []; // Double safety
      const { data } = await getProducts({ all: true, organizationId });
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!organizationId,
  });
}

// Get product by ID
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Search products
export function useProductSearch(query: string, organizationId?: string) {
  return useQuery({
    queryKey: [...productKeys.search(query), { organizationId }],
    queryFn: () => searchProducts(query, organizationId),
    enabled: query.length > 0 && !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get products by category
export function useProductsByCategory(category: string, organizationId?: string) {
  return useQuery({
    queryKey: [...productKeys.category(category), { organizationId }],
    queryFn: () => getProductsByCategory(category, organizationId),
    enabled: !!category && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get low stock products
export function useLowStockProducts(organizationId?: string) {
  return useQuery({
    queryKey: [...productKeys.lowStock(), { organizationId }],
    queryFn: () => getLowStockProducts(organizationId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!organizationId,
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ productData, organizationId }: { productData: CreateProductData, organizationId?: string }) => createProduct(productData, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast({
        title: 'Sucesso',
        description: 'Produto criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar produto. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating product:', error);
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (product: UpdateProductData) => updateProduct(product),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(data.id) });
      toast({
        title: 'Sucesso',
        description: 'Produto atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar produto. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating product:', error);
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast({
        title: 'Sucesso',
        description: 'Produto excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir produto. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting product:', error);
    },
  });
}
