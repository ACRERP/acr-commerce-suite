import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getSales, 
  getSaleById, 
  createSale, 
  updateSale, 
  deleteSale, 
  getSalesByDateRange,
  getSalesByStatus,
  Sale,
  CreateSaleData,
  UpdateSaleData,
  SaleStatus
} from '@/lib/sales';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  list: (filters?: string) => [...salesKeys.lists(), { filters }] as const,
  details: () => [...salesKeys.all, 'detail'] as const,
  detail: (id: number) => [...salesKeys.details(), id] as const,
  dateRange: (start: string, end: string) => [...salesKeys.all, 'dateRange', start, end] as const,
  status: (status: SaleStatus) => [...salesKeys.all, 'status', status] as const,
};

// Get all sales
export function useSales() {
  return useQuery({
    queryKey: salesKeys.lists(),
    queryFn: getSales,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get sale by ID
export function useSale(id: number) {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => getSaleById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get sales by date range
export function useSalesByDateRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: salesKeys.dateRange(startDate, endDate),
    queryFn: () => getSalesByDateRange(startDate, endDate),
    enabled: !!(startDate && endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get sales by status
export function useSalesByStatus(status: SaleStatus) {
  return useQuery({
    queryKey: salesKeys.status(status),
    queryFn: () => getSalesByStatus(status),
    enabled: !!status,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Create sale mutation
export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sale: CreateSaleData) => createSale(sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      toast({
        title: 'Sucesso',
        description: 'Venda registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar venda. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating sale:', error);
    },
  });
}

// Update sale mutation
export function useUpdateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sale: UpdateSaleData) => updateSale(sale),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.detail(data.id) });
      toast({
        title: 'Sucesso',
        description: 'Venda atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar venda. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating sale:', error);
    },
  });
}

// Delete sale mutation
export function useDeleteSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      toast({
        title: 'Sucesso',
        description: 'Venda excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir venda. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting sale:', error);
    },
  });
}
