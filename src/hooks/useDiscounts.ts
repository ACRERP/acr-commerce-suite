import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getDiscounts,
  getDiscountById,
  getActiveDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountApplications,
  addDiscountApplication,
  removeDiscountApplication,
  applyDiscountToSale,
  getSaleDiscounts,
  getApplicableDiscounts,
  calculateDiscountAmount,
  Discount,
  CreateDiscountData,
  UpdateDiscountData,
  DiscountApplication,
  SaleDiscount,
} from '@/lib/discounts';

// Query keys
export const discountKeys = {
  all: ['discounts'] as const,
  lists: () => [...discountKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...discountKeys.lists(), includeInactive] as const,
  details: () => [...discountKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountKeys.details(), id] as const,
  active: ['discounts', 'active'] as const,
  applications: (id: string) => [...discountKeys.all, 'applications', id] as const,
  sale: (saleId: string) => [...discountKeys.all, 'sale', saleId] as const,
  applicable: (subtotal: number) => [...discountKeys.all, 'applicable', subtotal] as const,
};

// Get all discounts
export function useDiscounts(includeInactive = false) {
  return useQuery({
    queryKey: discountKeys.list(includeInactive),
    queryFn: () => getDiscounts(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single discount by ID
export function useDiscount(id: string) {
  return useQuery({
    queryKey: discountKeys.detail(id),
    queryFn: () => getDiscountById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get active discounts
export function useActiveDiscounts(date = new Date().toISOString()) {
  return useQuery({
    queryKey: [...discountKeys.active, date],
    queryFn: () => getActiveDiscounts(date),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get applicable discounts for cart
export function useApplicableDiscounts(subtotal: number, productIds?: string[], categoryIds?: string[], clientIds?: string[]) {
  return useQuery({
    queryKey: discountKeys.applicable(subtotal),
    queryFn: () => getApplicableDiscounts(subtotal, productIds, categoryIds, clientIds),
    enabled: subtotal > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Get discount applications
export function useDiscountApplications(discountId: string) {
  return useQuery({
    queryKey: discountKeys.applications(discountId),
    queryFn: () => getDiscountApplications(discountId),
    enabled: !!discountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get sale discounts
export function useSaleDiscounts(saleId: string) {
  return useQuery({
    queryKey: discountKeys.sale(saleId),
    queryFn: () => getSaleDiscounts(saleId),
    enabled: !!saleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create discount mutation
export function useCreateDiscount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDiscountData) => createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: discountKeys.active,
      });
      toast({
        title: 'Desconto criado',
        description: 'O desconto foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar desconto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update discount mutation
export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateDiscountData) => updateDiscount(data),
    onSuccess: (updatedDiscount) => {
      // Invalidate discount lists
      queryClient.invalidateQueries({
        queryKey: discountKeys.lists(),
      });
      
      // Invalidate specific discount cache
      queryClient.invalidateQueries({
        queryKey: discountKeys.detail(updatedDiscount.id),
      });
      
      // Invalidate active discounts
      queryClient.invalidateQueries({
        queryKey: discountKeys.active,
      });
      
      toast({
        title: 'Desconto atualizado',
        description: 'O desconto foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar desconto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete discount mutation
export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteDiscount(id),
    onSuccess: () => {
      // Invalidate all discount queries
      queryClient.invalidateQueries({
        queryKey: discountKeys.all,
      });
      
      toast({
        title: 'Desconto excluído',
        description: 'O desconto foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir desconto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Add discount application mutation
export function useAddDiscountApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ discountId, targetType, targetId }: { discountId: string; targetType: 'product' | 'category' | 'client'; targetId: string }) =>
      addDiscountApplication(discountId, targetType, targetId),
    onSuccess: (_, { discountId }) => {
      queryClient.invalidateQueries({
        queryKey: discountKeys.applications(discountId),
      });
      toast({
        title: 'Aplicação adicionada',
        description: 'A aplicação do desconto foi adicionada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar aplicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Remove discount application mutation
export function useRemoveDiscountApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (applicationId: string) => removeDiscountApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountKeys.lists(),
      });
      toast({
        title: 'Aplicação removida',
        description: 'A aplicação do desconto foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover aplicação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Apply discount to sale mutation
export function useApplyDiscountToSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ saleId, discount, discountAmount }: { saleId: string; discount: Discount; discountAmount: number }) =>
      applyDiscountToSale(saleId, discount, discountAmount),
    onSuccess: (_, { saleId }) => {
      queryClient.invalidateQueries({
        queryKey: discountKeys.sale(saleId),
      });
      queryClient.invalidateQueries({
        queryKey: discountKeys.lists(),
      });
      toast({
        title: 'Desconto aplicado',
        description: 'O desconto foi aplicado à venda com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aplicar desconto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Combined hook for discount management
export function useDiscountManager() {
  const { data: discounts, isLoading: discountsLoading } = useDiscounts();
  const { data: activeDiscounts, isLoading: activeLoading } = useActiveDiscounts();
  
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const addApplication = useAddDiscountApplication();
  const removeApplication = useRemoveDiscountApplication();
  
  const isLoading = discountsLoading || activeLoading;
  const isMutating = createDiscount.isPending || updateDiscount.isPending || deleteDiscount.isPending;
  
  return {
    discounts: discounts || [],
    activeDiscounts: activeDiscounts || [],
    isLoading,
    isMutating,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    addApplication,
    removeApplication,
  };
}

// Hook for discount form state
export function useDiscountForm(initialDiscount?: Discount) {
  const [formData, setFormData] = useState<CreateDiscountData>({
    name: initialDiscount?.name || '',
    description: initialDiscount?.description || '',
    type: initialDiscount?.type || 'percentage',
    value: initialDiscount?.value || 0,
    min_purchase_amount: initialDiscount?.min_purchase_amount || 0,
    max_discount_amount: initialDiscount?.max_discount_amount,
    applicable_to: initialDiscount?.applicable_to || 'all',
    is_active: initialDiscount?.is_active ?? true,
    start_date: initialDiscount?.start_date || '',
    end_date: initialDiscount?.end_date || '',
    usage_limit: initialDiscount?.usage_limit,
    application_targets: [],
  });
  
  const updateField = (field: keyof CreateDiscountData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const reset = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      min_purchase_amount: 0,
      max_discount_amount: undefined,
      applicable_to: 'all',
      is_active: true,
      start_date: '',
      end_date: '',
      usage_limit: undefined,
      application_targets: [],
    });
  };
  
  return {
    formData,
    updateField,
    reset,
  };
}

// Hook for cart discount calculation
export function useCartDiscounts(subtotal: number, productIds?: string[], categoryIds?: string[], clientIds?: string[]) {
  const { data: applicableDiscounts, isLoading } = useApplicableDiscounts(subtotal, productIds, categoryIds, clientIds);
  const applyDiscountToSale = useApplyDiscountToSale();
  
  const calculateBestDiscount = (discounts: Discount[], subtotal: number): { discount: Discount | null; amount: number } => {
    if (!discounts.length) return { discount: null, amount: 0 };
    
    let bestDiscount = discounts[0];
    let maxAmount = 0;
    
    discounts.forEach(discount => {
      const amount = calculateDiscountAmount(discount, subtotal);
      if (amount > maxAmount) {
        maxAmount = amount;
        bestDiscount = discount;
      }
    });
    
    return { discount: bestDiscount, amount: maxAmount };
  };
  
  const bestDiscount = applicableDiscounts ? calculateBestDiscount(applicableDiscounts, subtotal) : { discount: null, amount: 0 };
  
  return {
    applicableDiscounts: applicableDiscounts || [],
    bestDiscount: bestDiscount.discount,
    bestDiscountAmount: bestDiscount.amount,
    isLoading,
    applyDiscountToSale,
  };
}
