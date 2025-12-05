import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getCashRegisters,
  getCashRegisterById,
  getActiveCashRegisters,
  createCashRegister,
  updateCashRegister,
  deleteCashRegister,
  getCashRegisterOperations,
  getCurrentCashRegisterOperation,
  createCashRegisterOperation,
  updateCashRegisterOperation,
  closeCashRegisterOperation,
  cancelCashRegisterOperation,
  getCashMovements,
  createCashMovement,
  getCashRegisterStatistics,
  CashRegister,
  CreateCashRegisterData,
  UpdateCashRegisterData,
  CreateCashRegisterOperationData,
  UpdateCashRegisterOperationData,
  CreateCashMovementData,
  CashRegisterOperation,
  CashMovement,
} from '@/lib/cashRegister';

// Query keys
export const cashRegisterKeys = {
  all: ['cash_registers'] as const,
  lists: () => [...cashRegisterKeys.all, 'list'] as const,
  list: (includeInactive: boolean) => [...cashRegisterKeys.lists(), includeInactive] as const,
  active: () => [...cashRegisterKeys.all, 'active'] as const,
  details: () => [...cashRegisterKeys.all, 'detail'] as const,
  detail: (id: string) => [...cashRegisterKeys.details(), id] as const,
  statistics: (id: string, startDate?: string, endDate?: string) => 
    ['cash_registers', 'statistics', id, startDate, endDate] as const,
};

export const cashRegisterOperationKeys = {
  all: ['cash_register_operations'] as const,
  lists: () => [...cashRegisterOperationKeys.all, 'list'] as const,
  list: (cashRegisterId?: string, startDate?: string, endDate?: string) => 
    [...cashRegisterOperationKeys.lists(), cashRegisterId, startDate, endDate] as const,
  details: () => [...cashRegisterOperationKeys.all, 'detail'] as const,
  detail: (id: string) => [...cashRegisterOperationKeys.details(), id] as const,
  current: (cashRegisterId: string) => ['cash_register_operations', 'current', cashRegisterId] as const,
  movements: (operationId: string) => ['cash_movements', operationId] as const,
};

// Get all cash registers
export function useCashRegisters(includeInactive = false) {
  return useQuery({
    queryKey: cashRegisterKeys.list(includeInactive),
    queryFn: () => getCashRegisters(includeInactive),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get single cash register by ID
export function useCashRegister(id: string) {
  return useQuery({
    queryKey: cashRegisterKeys.detail(id),
    queryFn: () => getCashRegisterById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get active cash registers
export function useActiveCashRegisters() {
  return useQuery({
    queryKey: cashRegisterKeys.active(),
    queryFn: getActiveCashRegisters,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get cash register statistics
export function useCashRegisterStatistics(
  cashRegisterId: string, 
  startDate?: string, 
  endDate?: string
) {
  return useQuery({
    queryKey: cashRegisterKeys.statistics(cashRegisterId, startDate, endDate),
    queryFn: () => getCashRegisterStatistics(cashRegisterId, startDate, endDate),
    enabled: !!cashRegisterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get cash register operations
export function useCashRegisterOperations(cashRegisterId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: cashRegisterOperationKeys.list(cashRegisterId, startDate, endDate),
    queryFn: () => getCashRegisterOperations(cashRegisterId, startDate, endDate),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get current open operation
export function useCurrentCashRegisterOperation(cashRegisterId: string) {
  return useQuery({
    queryKey: cashRegisterOperationKeys.current(cashRegisterId),
    queryFn: () => getCurrentCashRegisterOperation(cashRegisterId),
    enabled: !!cashRegisterId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}

// Get cash movements
export function useCashMovements(operationId: string) {
  return useQuery({
    queryKey: cashRegisterOperationKeys.movements(operationId),
    queryFn: () => getCashMovements(operationId),
    enabled: !!operationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create cash register mutation
export function useCreateCashRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCashRegisterData) => createCashRegister(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.lists(),
      });
      
      toast({
        title: 'Caixa criado',
        description: 'O caixa foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar caixa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update cash register mutation
export function useUpdateCashRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateCashRegisterData) => updateCashRegister(data),
    onSuccess: (updatedCashRegister) => {
      // Invalidate cash register lists
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.lists(),
      });
      
      // Invalidate specific cash register cache
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.detail(updatedCashRegister.id),
      });
      
      toast({
        title: 'Caixa atualizado',
        description: 'O caixa foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar caixa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete cash register mutation
export function useDeleteCashRegister() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCashRegister(id),
    onSuccess: () => {
      // Invalidate all cash register queries
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.all,
      });
      
      toast({
        title: 'Caixa excluído',
        description: 'O caixa foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir caixa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create cash register operation mutation
export function useCreateCashRegisterOperation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCashRegisterOperationData) => createCashRegisterOperation(data),
    onSuccess: (newOperation) => {
      // Invalidate operations list
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.lists(),
      });
      
      // Invalidate current operation for this register
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.current(newOperation.cash_register_id),
      });
      
      // Invalidate cash register statistics
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.statistics(newOperation.cash_register_id),
      });
      
      toast({
        title: 'Operação criada',
        description: 'A operação do caixa foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar operação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update cash register operation mutation
export function useUpdateCashRegisterOperation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateCashRegisterOperationData) => updateCashRegisterOperation(data),
    onSuccess: (updatedOperation) => {
      // Invalidate operations list
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.lists(),
      });
      
      // Invalidate specific operation cache
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.detail(updatedOperation.id),
      });
      
      // Invalidate current operation for this register
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.current(updatedOperation.cash_register_id),
      });
      
      // Invalidate cash register statistics
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.statistics(updatedOperation.cash_register_id),
      });
      
      toast({
        title: 'Operação atualizada',
        description: 'A operação do caixa foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar operação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Close cash register operation mutation
export function useCloseCashRegisterOperation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      operationId, 
      closingBalance, 
      expectedBalance, 
      notes 
    }: {
      operationId: string;
      closingBalance: number;
      expectedBalance: number;
      notes?: string;
    }) => closeCashRegisterOperation(operationId, closingBalance, expectedBalance, notes),
    onSuccess: (closedOperation) => {
      // Invalidate operations list
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.lists(),
      });
      
      // Invalidate specific operation cache
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.detail(closedOperation.id),
      });
      
      // Invalidate current operation for this register
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.current(closedOperation.cash_register_id),
      });
      
      // Invalidate cash register statistics
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.statistics(closedOperation.cash_register_id),
      });
      
      // Invalidate cash register details to update current balance
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.detail(closedOperation.cash_register_id),
      });
      
      toast({
        title: 'Operação fechada',
        description: 'A operação do caixa foi fechada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao fechar operação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Cancel cash register operation mutation
export function useCancelCashRegisterOperation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ operationId, notes }: { operationId: string; notes?: string }) =>
      cancelCashRegisterOperation(operationId, notes),
    onSuccess: (cancelledOperation) => {
      // Invalidate operations list
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.lists(),
      });
      
      // Invalidate specific operation cache
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.detail(cancelledOperation.id),
      });
      
      // Invalidate current operation for this register
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.current(cancelledOperation.cash_register_id),
      });
      
      // Invalidate cash register statistics
      queryClient.invalidateQueries({
        queryKey: cashRegisterKeys.statistics(cancelledOperation.cash_register_id),
      });
      
      toast({
        title: 'Operação cancelada',
        description: 'A operação do caixa foi cancelada.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar operação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create cash movement mutation
export function useCreateCashMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCashMovementData) => createCashMovement(data),
    onSuccess: (newMovement) => {
      // Invalidate movements list for this operation
      queryClient.invalidateQueries({
        queryKey: cashRegisterOperationKeys.movements(newMovement.cash_register_operation_id),
      });
      
      toast({
        title: 'Movimento adicionado',
        description: 'O movimento de caixa foi adicionado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar movimento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Combined hook for cash register management
export function useCashRegisterManager() {
  const { data: cashRegisters, isLoading: cashRegistersLoading } = useCashRegisters();
  const { data: activeCashRegisters, isLoading: activeLoading } = useActiveCashRegisters();
  
  const createCashRegister = useCreateCashRegister();
  const updateCashRegister = useUpdateCashRegister();
  const deleteCashRegister = useDeleteCashRegister();
  
  const isLoading = cashRegistersLoading || activeLoading;
  const isMutating = createCashRegister.isPending || updateCashRegister.isPending || deleteCashRegister.isPending;
  
  return {
    cashRegisters: cashRegisters || [],
    activeCashRegisters: activeCashRegisters || [],
    isLoading,
    isMutating,
    createCashRegister,
    updateCashRegister,
    deleteCashRegister,
  };
}

// Combined hook for cash register operation management
export function useCashRegisterOperationManager(cashRegisterId?: string) {
  const { data: operations, isLoading: operationsLoading } = useCashRegisterOperations(cashRegisterId);
  const { data: currentOperation, isLoading: currentLoading } = useCurrentCashRegisterOperation(cashRegisterId || '');
  
  const createOperation = useCreateCashRegisterOperation();
  const updateOperation = useUpdateCashRegisterOperation();
  const closeOperation = useCloseCashRegisterOperation();
  const cancelOperation = useCancelCashRegisterOperation();
  
  const isLoading = operationsLoading || currentLoading;
  const isMutating = createOperation.isPending || updateOperation.isPending || 
                   closeOperation.isPending || cancelOperation.isPending;
  
  return {
    operations: operations || [],
    currentOperation,
    isLoading,
    isMutating,
    createOperation,
    updateOperation,
    closeOperation,
    cancelOperation,
  };
}

// Hook for cash register form state
export function useCashRegisterForm(initialCashRegister?: CashRegister) {
  const [formData, setFormData] = useState<CreateCashRegisterData>({
    name: initialCashRegister?.name || '',
    description: initialCashRegister?.description || '',
    location: initialCashRegister?.location || '',
    is_active: initialCashRegister?.is_active ?? true,
    initial_balance: initialCashRegister?.initial_balance || 0,
  });
  
  const updateField = (field: keyof CreateCashRegisterData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const reset = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      is_active: true,
      initial_balance: 0,
    });
  };
  
  return {
    formData,
    updateField,
    reset,
  };
}

// Hook for cash register operation form state
export function useCashRegisterOperationForm(initialOperation?: CashRegisterOperation) {
  const [formData, setFormData] = useState<CreateCashRegisterOperationData>({
    cash_register_id: initialOperation?.cash_register_id || '',
    operation_type: initialOperation?.operation_type || 'open',
    opening_balance: initialOperation?.opening_balance || 0,
    closing_balance: initialOperation?.closing_balance,
    notes: initialOperation?.notes || '',
  });
  
  const updateField = (field: keyof CreateCashRegisterOperationData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const reset = () => {
    setFormData({
      cash_register_id: '',
      operation_type: 'open',
      opening_balance: 0,
      closing_balance: undefined,
      notes: '',
    });
  };
  
  return {
    formData,
    updateField,
    reset,
  };
}

// Hook for cash register status
export function useCashRegisterStatus(cashRegisterId: string) {
  const { data: currentOperation, isLoading } = useCurrentCashRegisterOperation(cashRegisterId);
  
  const isOpen = !!currentOperation;
  const canOpen = !isOpen && !isLoading;
  const canClose = isOpen && !isLoading;
  const status = currentOperation?.status || 'closed';
  
  return {
    isOpen,
    canOpen,
    canClose,
    status,
    currentOperation,
    isLoading,
  };
}
