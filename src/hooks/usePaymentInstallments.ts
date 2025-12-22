import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface PaymentPlan {
  id: string;
  invoice_id: string;
  total_amount: number;
  number_of_installments: number;
  installment_amount: number;
  first_installment_date: string;
  payment_frequency: 'monthly' | 'biweekly' | 'weekly';
  interest_rate: number;
  total_interest: number;
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
  invoice?: {
    id: string;
    invoice_number: string;
    client_name: string;
  };
  installments?: PaymentInstallment[];
}

export interface PaymentInstallment {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  interest_amount: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  payment_method_id?: string;
  transaction_id?: string;
  late_fee: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  payment_method?: {
    id: string;
    name: string;
    type: string;
  };
  transaction?: {
    id: string;
    description: string;
    amount: number;
    date: string;
  };
}

export interface CreatePaymentPlanData {
  invoice_id: string;
  total_amount: number;
  number_of_installments: number;
  first_installment_date: string;
  payment_frequency: 'monthly' | 'biweekly' | 'weekly';
  interest_rate?: number;
  notes?: string;
}

export function usePaymentPlans() {
  const queryClient = useQueryClient();

  const {
    data: paymentPlans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_plans')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            client:clients(name)
          ),
          installments:payment_installments(
            *,
            payment_method:payment_methods(name, type),
            transaction:financial_transactions(id, description, amount, date)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(plan => ({
        ...plan,
        invoice: plan.invoice ? {
          ...plan.invoice,
          client_name: plan.invoice.client?.name || 'N/A'
        } : undefined
      })) as PaymentPlan[];
    },
  });

  const createPaymentPlan = useMutation({
    mutationFn: async (planData: CreatePaymentPlanData) => {
      const { data, error } = await supabase.rpc('create_payment_plan_with_installments', {
        p_invoice_id: planData.invoice_id,
        p_total_amount: planData.total_amount,
        p_num_installments: planData.number_of_installments,
        p_first_date: planData.first_installment_date,
        p_frequency: planData.payment_frequency,
        p_interest_rate: planData.interest_rate || 0,
        p_notes: planData.notes
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const updatePaymentPlan = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<PaymentPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });

  const cancelPaymentPlan = useMutation({
    mutationFn: async (id: string) => {
      // Cancel all pending installments first
      await supabase
        .from('payment_installments')
        .update({ status: 'cancelled' })
        .eq('payment_plan_id', id)
        .eq('status', 'pending');

      // Then cancel the payment plan
      const { data, error } = await supabase
        .from('payment_plans')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });

  return {
    paymentPlans,
    isLoading,
    error,
    createPaymentPlan: createPaymentPlan.mutateAsync,
    updatePaymentPlan: updatePaymentPlan.mutateAsync,
    cancelPaymentPlan: cancelPaymentPlan.mutateAsync,
    isCreating: createPaymentPlan.isPending,
    isUpdating: updatePaymentPlan.isPending,
    isCancelling: cancelPaymentPlan.isPending,
  };
}

export function usePaymentInstallments(planId?: string) {
  const queryClient = useQueryClient();

  const {
    data: installments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['payment-installments', planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await supabase
        .from('payment_installments')
        .select(`
          *,
          payment_method:payment_methods(name, type),
          transaction:financial_transactions(id, description, amount, date)
        `)
        .eq('payment_plan_id', planId)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      return data as PaymentInstallment[];
    },
    enabled: !!planId,
  });

  const payInstallment = useMutation({
    mutationFn: async ({ 
      id, 
      payment_method_id, 
      payment_date = new Date().toISOString(),
      notes 
    }: { 
      id: string; 
      payment_method_id: string; 
      payment_date?: string;
      notes?: string;
    }) => {
      // First, get the installment details
      const { data: installment, error: fetchError } = await supabase
        .from('payment_installments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create a financial transaction for the payment
      const { data: transaction, error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          description: `Pagamento parcela ${installment.installment_number}`,
          amount: installment.total_amount,
          date: payment_date.split('T')[0],
          category_id: '00000000-0000-0000-0000-000000000001', // Revenue category
          payment_method_id,
          type: 'income',
          status: 'completed',
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update the installment
      const { data, error } = await supabase
        .from('payment_installments')
        .update({
          status: 'paid',
          payment_date,
          payment_method_id,
          transaction_id: transaction.id,
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentInstallment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-installments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
  });

  const updateInstallment = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<PaymentInstallment> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_installments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentInstallment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-installments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });

  const addLateFee = useMutation({
    mutationFn: async ({ id, lateFee, notes }: { id: string; lateFee: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('payment_installments')
        .update({
          late_fee: lateFee,
          total_amount: (await supabase
            .from('payment_installments')
            .select('amount, interest_amount')
            .eq('id', id)
            .single()
          ).data!.amount + (await supabase
            .from('payment_installments')
            .select('amount, interest_amount')
            .eq('id', id)
            .single()
          ).data!.interest_amount + lateFee,
          notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentInstallment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-installments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
    },
  });

  return {
    installments,
    isLoading,
    error,
    payInstallment: payInstallment.mutateAsync,
    updateInstallment: updateInstallment.mutateAsync,
    addLateFee: addLateFee.mutateAsync,
    isPaying: payInstallment.isPending,
    isUpdating: updateInstallment.isPending,
    isAddingFee: addLateFee.isPending,
  };
}

export function usePaymentPlanSummary(planId?: string) {
  const queryClient = useQueryClient();

  const {
    data: summary = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['payment-plan-summary', planId],
    queryFn: async () => {
      if (!planId) return null;
      
      // Get payment plan details
      const { data: plan, error: planError } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      // Get installment statistics
      const { data: installments, error: installmentsError } = await supabase
        .from('payment_installments')
        .select('status, total_amount, paid_amount')
        .eq('payment_plan_id', planId);

      if (installmentsError) throw installmentsError;

      const stats = installments.reduce((acc: Record<string, { count: number; total: number }>, installment) => {
        acc[installment.status] = acc[installment.status] || { count: 0, total: 0 };
        acc[installment.status].count += 1;
        acc[installment.status].total += installment.total_amount;
        return acc;
      }, {});

      const paidAmount = stats.paid?.total || 0;
      const pendingAmount = stats.pending?.total || 0;
      const overdueAmount = stats.overdue?.total || 0;

      return {
        plan,
        stats,
        paidAmount,
        pendingAmount,
        overdueAmount,
        totalAmount: paidAmount + pendingAmount + overdueAmount,
        progressPercentage: plan.total_amount > 0 ? (paidAmount / plan.total_amount) * 100 : 0,
      };
    },
    enabled: !!planId,
  });

  return {
    summary,
    isLoading,
    error,
  };
}

export function calculateInstallmentAmount(
  principal: number,
  rate: number,
  periods: number
): number {
  if (rate === 0) return principal / periods;
  
  const monthlyRate = rate / 100 / 12;
  const installment = principal * (monthlyRate * Math.pow(1 + monthlyRate, periods)) / 
                      (Math.pow(1 + monthlyRate, periods) - 1);
  
  return Math.round(installment * 100) / 100;
}

export function generateInstallmentDates(
  startDate: Date,
  numberOfInstallments: number,
  frequency: 'monthly' | 'biweekly' | 'weekly'
): Date[] {
  const dates: Date[] = [new Date(startDate)];
  const interval = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30;

  for (let i = 1; i < numberOfInstallments; i++) {
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + (interval * i));
    dates.push(nextDate);
  }

  return dates;
}
