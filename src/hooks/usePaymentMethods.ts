import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getPaymentMethods,
  getPaymentMethodById,
  getPaymentMethodsByType,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getSalePayments,
  createSalePayment,
  updateSalePayment,
  approvePayment,
  rejectPayment,
  cancelPayment,
  refundPayment,
  getPaymentMethodStatistics,
  PaymentMethod,
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
  CreateSalePaymentData,
  UpdateSalePaymentData,
  SalePayment,
} from '@/lib/paymentMethods';

// Query keys
export const paymentMethodKeys = {
  all: ['payment_methods'] as const,
  lists: () => [...paymentMethodKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...paymentMethodKeys.lists(), includeInactive] as const,
  details: () => [...paymentMethodKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentMethodKeys.details(), id] as const,
  type: (type: PaymentMethod['type']) => [...paymentMethodKeys.details(), 'type', type] as const,
  statistics: (id: string, startDate?: string, endDate?: string) => 
    ['payment_methods', 'statistics', id, startDate, endDate] as const,
};

export const salePaymentKeys = {
  all: ['sale_payments'] as const,
  lists: () => [...salePaymentKeys.all, 'list'] as const,
  list: (saleId: string) => [...salePaymentKeys.lists(), saleId] as const,
  detail: (id: string) => [...salePaymentKeys.all, 'detail', id] as const,
};

// Get all payment methods
export function usePaymentMethods(includeInactive = false) {
  return useQuery({
    queryKey: paymentMethodKeys.list(includeInactive),
    queryFn: () => getPaymentMethods(includeInactive),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get single payment method by ID
export function usePaymentMethod(id: string) {
  return useQuery({
    queryKey: paymentMethodKeys.detail(id),
    queryFn: () => getPaymentMethodById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get payment methods by type
export function usePaymentMethodsByType(type: PaymentMethod['type']) {
  return useQuery({
    queryKey: paymentMethodKeys.type(type),
    queryFn: () => getPaymentMethodsByType(type),
    enabled: !!type,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get payment method statistics
export function usePaymentMethodStatistics(
  paymentMethodId: string, 
  startDate?: string, 
  endDate?: string
) {
  return useQuery({
    queryKey: paymentMethodKeys.statistics(paymentMethodId, startDate, endDate),
    queryFn: () => getPaymentMethodStatistics(paymentMethodId, startDate, endDate),
    enabled: !!paymentMethodId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get sale payments
export function useSalePayments(saleId: string) {
  return useQuery({
    queryKey: salePaymentKeys.list(saleId),
    queryFn: () => getSalePayments(saleId),
    enabled: !!saleId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create payment method mutation
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePaymentMethodData) => createPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.lists(),
      });
      toast({
        title: 'Método de pagamento criado',
        description: 'O método de pagamento foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar método de pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update payment method mutation
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdatePaymentMethodData) => updatePaymentMethod(data),
    onSuccess: (updatedPaymentMethod) => {
      // Invalidate payment method lists
      queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.lists(),
      });
      
      // Invalidate specific payment method cache
      queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.detail(updatedPaymentMethod.id),
      });
      
      toast({
        title: 'Método de pagamento atualizado',
        description: 'O método de pagamento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar método de pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete payment method mutation
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => {
      // Invalidate all payment method queries
      queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.all,
      });
      
      toast({
        title: 'Método de pagamento excluído',
        description: 'O método de pagamento foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir método de pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create sale payment mutation
export function useCreateSalePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateSalePaymentData) => createSalePayment(data),
    onSuccess: (createdPayment) => {
      // Invalidate sale payments list
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.list(createdPayment.sale_id),
      });
      
      toast({
        title: 'Pagamento adicionado',
        description: 'O pagamento foi adicionado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update sale payment mutation
export function useUpdateSalePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateSalePaymentData) => updateSalePayment(data),
    onSuccess: (updatedPayment) => {
      // Invalidate sale payments list
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.list(updatedPayment.sale_id),
      });
      
      // Invalidate specific payment cache
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.detail(updatedPayment.id),
      });
      
      toast({
        title: 'Pagamento atualizado',
        description: 'O pagamento foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Approve payment mutation
export function useApprovePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ paymentId, authorizationCode }: { paymentId: string; authorizationCode?: string }) =>
      approvePayment(paymentId, authorizationCode),
    onSuccess: (updatedPayment) => {
      // Invalidate sale payments list
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.list(updatedPayment.sale_id),
      });
      
      toast({
        title: 'Pagamento aprovado',
        description: 'O pagamento foi aprovado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aprovar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Reject payment mutation
export function useRejectPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      rejectPayment(paymentId, reason),
    onSuccess: (updatedPayment) => {
      // Invalidate sale payments list
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.list(updatedPayment.sale_id),
      });
      
      toast({
        title: 'Pagamento rejeitado',
        description: 'O pagamento foi rejeitado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao rejeitar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Cancel payment mutation
export function useCancelPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (paymentId: string) => cancelPayment(paymentId),
    onSuccess: (updatedPayment) => {
      // Invalidate sale payments list
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.list(updatedPayment.sale_id),
      });
      
      toast({
        title: 'Pagamento cancelado',
        description: 'O pagamento foi cancelado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Refund payment mutation
export function useRefundPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (paymentId: string) => refundPayment(paymentId),
    onSuccess: (updatedPayment) => {
      // Invalidate sale payments list
      queryClient.invalidateQueries({
        queryKey: salePaymentKeys.list(updatedPayment.sale_id),
      });
      
      toast({
        title: 'Pagamento reembolsado',
        description: 'O pagamento foi reembolsado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao reembolsar pagamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Combined hook for payment method management
export function usePaymentMethodManager() {
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = usePaymentMethods();
  
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  
  const isLoading = paymentMethodsLoading;
  const isMutating = createPaymentMethod.isPending || updatePaymentMethod.isPending || deletePaymentMethod.isPending;
  
  return {
    paymentMethods: paymentMethods || [],
    isLoading,
    isMutating,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
}

// Combined hook for sale payment management
export function useSalePaymentManager(saleId: string) {
  const { data: payments, isLoading: paymentsLoading } = useSalePayments(saleId);
  
  const createSalePayment = useCreateSalePayment();
  const updateSalePayment = useUpdateSalePayment();
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();
  const cancelPayment = useCancelPayment();
  const refundPayment = useRefundPayment();
  
  const isLoading = paymentsLoading;
  const isMutating = createSalePayment.isPending || updateSalePayment.isPending || 
                   approvePayment.isPending || rejectPayment.isPending || 
                   cancelPayment.isPending || refundPayment.isPending;
  
  return {
    payments: payments || [],
    isLoading,
    isMutating,
    createSalePayment,
    updateSalePayment,
    approvePayment,
    rejectPayment,
    cancelPayment,
    refundPayment,
  };
}

// Hook for payment method form state
export function usePaymentMethodForm(initialPaymentMethod?: PaymentMethod) {
  const [formData, setFormData] = useState<CreatePaymentMethodData>({
    name: initialPaymentMethod?.name || '',
    description: initialPaymentMethod?.description || '',
    type: initialPaymentMethod?.type || 'cash',
    is_active: initialPaymentMethod?.is_active ?? true,
    requires_approval: initialPaymentMethod?.requires_approval || false,
    max_installments: initialPaymentMethod?.max_installments || 1,
    fee_percentage: initialPaymentMethod?.fee_percentage || 0,
    fee_fixed_amount: initialPaymentMethod?.fee_fixed_amount || 0,
    icon: initialPaymentMethod?.icon || '',
    color: initialPaymentMethod?.color || '#10B981',
    sort_order: initialPaymentMethod?.sort_order || 0,
  });
  
  const updateField = (field: keyof CreatePaymentMethodData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const reset = () => {
    setFormData({
      name: '',
      description: '',
      type: 'cash',
      is_active: true,
      requires_approval: false,
      max_installments: 1,
      fee_percentage: 0,
      fee_fixed_amount: 0,
      icon: '',
      color: '#10B981',
      sort_order: 0,
    });
  };
  
  return {
    formData,
    updateField,
    reset,
  };
}

// Hook for payment selection
export function usePaymentSelection() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [installments, setInstallments] = useState(1);
  
  const reset = () => {
    setSelectedPaymentMethod(null);
    setPaymentAmount(0);
    setInstallments(1);
  };
  
  return {
    selectedPaymentMethod,
    paymentAmount,
    installments,
    setSelectedPaymentMethod,
    setPaymentAmount,
    setInstallments,
    reset,
  };
}
