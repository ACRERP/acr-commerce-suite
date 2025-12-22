import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getInventoryTransactions, 
  getAllInventoryTransactions, 
  createInventoryTransaction, 
  updateInventoryTransaction, 
  deleteInventoryTransaction,
  getInventorySummary,
  InventoryTransaction,
  CreateInventoryTransactionData,
  UpdateInventoryTransactionData
} from '@/lib/inventory';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (productId: number) => [...inventoryKeys.lists(), productId] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
};

// Get inventory transactions for a product
export function useInventoryTransactions(productId: number) {
  return useQuery({
    queryKey: inventoryKeys.list(productId),
    queryFn: () => getInventoryTransactions(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get all inventory transactions
export function useAllInventoryTransactions() {
  return useQuery({
    queryKey: inventoryKeys.lists(),
    queryFn: getAllInventoryTransactions,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get inventory summary
export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn: getInventorySummary,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create inventory transaction mutation
export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transaction: CreateInventoryTransactionData) => createInventoryTransaction(transaction),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list(data.product_id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: 'Sucesso',
        description: `Movimentação de estoque registrada com sucesso`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar movimentação de estoque. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating inventory transaction:', error);
    },
  });
}

// Update inventory transaction mutation
export function useUpdateInventoryTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInventoryTransactionData }) => 
      updateInventoryTransaction(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.list(data.product_id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: 'Sucesso',
        description: 'Movimentação de estoque atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar movimentação de estoque. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating inventory transaction:', error);
    },
  });
}

// Delete inventory transaction mutation
export function useDeleteInventoryTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteInventoryTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: 'Sucesso',
        description: 'Movimentação de estoque excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir movimentação de estoque. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting inventory transaction:', error);
    },
  });
}
