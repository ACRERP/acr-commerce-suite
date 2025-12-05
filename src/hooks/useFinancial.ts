import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getFinancialCategories,
  createFinancialCategory,
  updateFinancialCategory,
  deleteFinancialCategory,
  getFinancialTransactions,
  createFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
  getTransactionPayments,
  createTransactionPayment,
  deleteTransactionPayment,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getFinancialSummary,
  FinancialCategory,
  FinancialTransaction,
  TransactionPayment,
  Supplier,
  CreateFinancialTransactionData,
  UpdateFinancialTransactionData,
  CreateTransactionPaymentData,
} from '@/lib/financial';

// Query keys
export const financialKeys = {
  all: ['financial'] as const,
  categories: () => [...financialKeys.all, 'categories'] as const,
  transactions: () => [...financialKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...financialKeys.transactions(), id] as const,
  payments: (transactionId: string) => [...financialKeys.all, 'payments', transactionId] as const,
  suppliers: () => [...financialKeys.all, 'suppliers'] as const,
  summary: (filters?: {
    start_date?: string;
    end_date?: string;
  }) => [...financialKeys.all, 'summary', filters] as const,
};

// Financial Categories
export function useFinancialCategories() {
  return useQuery({
    queryKey: financialKeys.categories(),
    queryFn: getFinancialCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createFinancialCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.categories() });
      toast({
        title: 'Sucesso',
        description: 'Categoria financeira criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria financeira. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating financial category:', error);
    },
  });
}

export function useUpdateFinancialCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FinancialCategory> }) => 
      updateFinancialCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.categories() });
      toast({
        title: 'Sucesso',
        description: 'Categoria financeira atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar categoria financeira. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating financial category:', error);
    },
  });
}

export function useDeleteFinancialCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteFinancialCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.categories() });
      toast({
        title: 'Sucesso',
        description: 'Categoria financeira excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir categoria financeira. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting financial category:', error);
    },
  });
}

// Financial Transactions
export function useFinancialTransactions(filters?: {
  type?: 'payable' | 'receivable';
  status?: string;
  category_id?: string;
  client_id?: string;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: [...financialKeys.transactions(), filters],
    queryFn: () => getFinancialTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createFinancialTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.summary() });
      toast({
        title: 'Sucesso',
        description: 'Transação financeira criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar transação financeira. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating financial transaction:', error);
    },
  });
}

export function useUpdateFinancialTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateFinancialTransactionData }) => 
      updateFinancialTransaction(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.transaction(data.id) });
      queryClient.invalidateQueries({ queryKey: financialKeys.summary() });
      toast({
        title: 'Sucesso',
        description: 'Transação financeira atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar transação financeira. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating financial transaction:', error);
    },
  });
}

export function useDeleteFinancialTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteFinancialTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.summary() });
      toast({
        title: 'Sucesso',
        description: 'Transação financeira excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir transação financeira. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting financial transaction:', error);
    },
  });
}

// Transaction Payments
export function useTransactionPayments(transactionId: string) {
  return useQuery({
    queryKey: financialKeys.payments(transactionId),
    queryFn: () => getTransactionPayments(transactionId),
    enabled: !!transactionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateTransactionPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createTransactionPayment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financialKeys.payments(data.transaction_id) });
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.summary() });
      toast({
        title: 'Sucesso',
        description: 'Pagamento registrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar pagamento. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating transaction payment:', error);
    },
  });
}

export function useDeleteTransactionPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteTransactionPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.payments });
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.summary() });
      toast({
        title: 'Sucesso',
        description: 'Pagamento excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir pagamento. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting transaction payment:', error);
    },
  });
}

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: financialKeys.suppliers(),
    queryFn: getSuppliers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.suppliers() });
      toast({
        title: 'Sucesso',
        description: 'Fornecedor criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar fornecedor. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating supplier:', error);
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Supplier> }) => 
      updateSupplier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.suppliers() });
      toast({
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar fornecedor. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating supplier:', error);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.suppliers() });
      toast({
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir fornecedor. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting supplier:', error);
    },
  });
}

// Financial Summary
export function useFinancialSummary(filters?: {
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: financialKeys.summary(filters),
    queryFn: () => getFinancialSummary(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}
