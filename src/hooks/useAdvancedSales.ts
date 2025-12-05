import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Types for advanced sales features
export interface SalePayment {
  id: string;
  sale_id: number;
  payment_method: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'fiado';
  amount: number;
  installment_count: number;
  card_brand?: string;
  card_last_four?: string;
  authorization_code?: string;
  status: 'pending' | 'approved' | 'declined' | 'refunded';
  created_at: string;
}

export interface CustomerCredit {
  id: string;
  client_id: number;
  credit_limit: number;
  used_credit: number;
  available_credit: number;
  due_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface SalesCommission {
  id: string;
  sale_id: number;
  user_id?: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid';
  paid_at?: string;
  created_at: string;
}

export interface CommissionRule {
  id: string;
  user_id?: string;
  product_category_id?: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  min_sale_amount: number;
  max_sale_amount?: number;
  is_active: boolean;
  created_at: string;
}

export interface SplitPaymentData {
  payments: Array<{
    payment_method: string;
    amount: number;
    installment_count?: number;
    card_brand?: string;
    card_last_four?: string;
    authorization_code?: string;
  }>;
}

export interface ReceiptTemplate {
  id: string;
  name: string;
  template_type: string;
  header_content?: string;
  footer_content?: string;
  css_styles?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SaleNote {
  id: string;
  sale_id: number;
  user_id?: string;
  note: string;
  note_type: string;
  is_internal: boolean;
  created_at: string;
  users?: { email: string } | null;
}

export interface EnhancedSaleData {
  client_id?: number;
  total_amount: number;
  items: Array<{
    product_id: number;
    quantity: number;
    price: number;
  }>;
  split_payments?: SplitPaymentData;
  notes?: string;
}

// Query keys
export const advancedSalesKeys = {
  all: ['advanced-sales'] as const,
  payments: (saleId: number) => [...advancedSalesKeys.all, 'payments', saleId] as const,
  customerCredit: (clientId: number) => [...advancedSalesKeys.all, 'credit', clientId] as const,
  commissions: () => [...advancedSalesKeys.all, 'commissions'] as const,
  userCommissions: (userId: string) => [...advancedSalesKeys.commissions(), userId] as const,
  commissionRules: () => [...advancedSalesKeys.all, 'commission-rules'] as const,
  receiptTemplates: () => [...advancedSalesKeys.all, 'receipt-templates'] as const,
  saleNotes: (saleId: number) => [...advancedSalesKeys.all, 'notes', saleId] as const,
};

// Get sale payments
export function useSalePayments(saleId: number) {
  return useQuery({
    queryKey: advancedSalesKeys.payments(saleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_payments')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SalePayment[];
    },
    enabled: !!saleId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get customer credit
export function useCustomerCredit(clientId: number) {
  return useQuery({
    queryKey: advancedSalesKeys.customerCredit(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_credit')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data as CustomerCredit | null;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

// Get sales commissions
export function useSalesCommissions() {
  return useQuery({
    queryKey: advancedSalesKeys.commissions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_commissions')
        .select(`
          *,
          sales:sale_id (total_amount, created_at),
          users:user_id (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (SalesCommission & { 
        sales: { total_amount: number; created_at: string };
        users: { email: string } | null;
      })[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get user commissions
export function useUserCommissions(userId: string) {
  return useQuery({
    queryKey: advancedSalesKeys.userCommissions(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_commissions')
        .select(`
          *,
          sales:sale_id (total_amount, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (SalesCommission & { 
        sales: { total_amount: number; created_at: string };
      })[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get commission rules
export function useCommissionRules() {
  return useQuery({
    queryKey: advancedSalesKeys.commissionRules(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_rules')
        .select(`
          *,
          users:user_id (email),
          product_categories:product_category_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (CommissionRule & {
        users: { email: string } | null;
        product_categories: { name: string } | null;
      })[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Create enhanced sale with split payments
export function useCreateEnhancedSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (saleData: EnhancedSaleData) => {
      // Start transaction
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: saleData.client_id,
          total_amount: saleData.total_amount,
          payment_method: 'split', // Indicate split payment
          status: 'concluida'
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(
          saleData.items.map(item => ({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }))
        );

      if (itemsError) throw itemsError;

      // Process split payments
      if (saleData.split_payments) {
        const { error: paymentError } = await supabase.rpc('process_split_payment', {
          sale_id_param: sale.id,
          payments_param: JSON.stringify(saleData.split_payments.payments)
        });

        if (paymentError) throw paymentError;
      }

      // Add note if provided
      if (saleData.notes) {
        const { error: noteError } = await supabase
          .from('sale_notes')
          .insert({
            sale_id: sale.id,
            note: saleData.notes,
            note_type: 'general',
            is_internal: false
          });

        if (noteError) throw noteError;
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Venda realizada",
        description: "Venda processada com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na venda",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Update customer credit limit
export function useUpdateCustomerCredit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      creditLimit, 
      dueDate 
    }: { 
      clientId: number; 
      creditLimit: number; 
      dueDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('customer_credit')
        .upsert({
          client_id: clientId,
          credit_limit: creditLimit,
          due_date: dueDate,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data as CustomerCredit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-credit'] });
      toast({
        title: "Limite de crédito atualizado",
        description: "O limite de crédito do cliente foi atualizado."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar crédito",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Create commission rule
export function useCreateCommissionRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rule: Omit<CommissionRule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data as CommissionRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advancedSalesKeys.commissionRules() });
      toast({
        title: "Regra de comissão criada",
        description: "A regra de comissão foi criada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar regra",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Pay commission
export function usePayCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commissionId: string) => {
      const { data, error } = await supabase
        .from('sales_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', commissionId)
        .select()
        .single();

      if (error) throw error;
      return data as SalesCommission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advancedSalesKeys.commissions() });
      toast({
        title: "Comissão paga",
        description: "A comissão foi marcada como paga."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao pagar comissão",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get receipt templates
export function useReceiptTemplates() {
  return useQuery({
    queryKey: advancedSalesKeys.receiptTemplates(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipt_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as ReceiptTemplate[];
    },
    staleTime: 15 * 60 * 1000,
  });
}

// Add sale note
export function useAddSaleNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      saleId, 
      note, 
      noteType = 'general', 
      isInternal = false 
    }: { 
      saleId: number; 
      note: string; 
      noteType?: string; 
      isInternal?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('sale_notes')
        .insert({
          sale_id: saleId,
          note,
          note_type: noteType,
          is_internal: isInternal
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale-notes'] });
      toast({
        title: "Nota adicionada",
        description: "A nota foi adicionada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar nota",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get sale notes
export function useSaleNotes(saleId: number) {
  return useQuery({
    queryKey: advancedSalesKeys.saleNotes(saleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_notes')
        .select(`
          *,
          users:user_id (email)
        `)
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SaleNote[];
    },
    enabled: !!saleId,
    staleTime: 2 * 60 * 1000,
  });
}

// Calculate commission for a sale
export function useCalculateCommission() {
  return useMutation({
    mutationFn: async ({ saleId, userId }: { saleId: number; userId: string }) => {
      const { data, error } = await supabase.rpc('calculate_sale_commission', {
        sale_id_param: saleId,
        user_id_param: userId
      });

      if (error) throw error;
      return data;
    },
  });
}
