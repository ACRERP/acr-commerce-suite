import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Boleto {
  id: string;
  invoice_id: string;
  our_number: string;
  document_number: string;
  amount: number;
  due_date: string;
  issue_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'overdue';
  payer_name: string;
  payer_cpf_cnpj: string;
  payer_address?: string;
  payer_city?: string;
  payer_state?: string;
  payer_zip_code?: string;
  discount_amount: number;
  discount_date?: string;
  interest_amount: number;
  fine_amount: number;
  instructions?: string;
  bank_code: string;
  bank_agency?: string;
  bank_account?: string;
  wallet?: string;
  barcode: string;
  digitable_line: string;
  pdf_url?: string;
  email_sent: boolean;
  sms_sent: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
  invoice?: {
    id: string;
    invoice_number: string;
    client_name: string;
  };
  events?: BoletoEvent[];
}

export interface BoletoEvent {
  id: string;
  boleto_id: string;
  event_type: 'created' | 'paid' | 'cancelled' | 'expired' | 'reminded' | 'email_sent' | 'sms_sent';
  event_date: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_by: string;
}

export interface CreateBoletoData {
  invoice_id: string;
  amount: number;
  due_date: string;
  payer_name: string;
  payer_cpf_cnpj: string;
  payer_address?: string;
  payer_city?: string;
  payer_state?: string;
  payer_zip_code?: string;
  instructions?: string;
  bank_code?: string;
  discount_amount?: number;
  discount_date?: string;
}

export function useBoletos() {
  const queryClient = useQueryClient();

  const {
    data: boletos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['boletos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boletos')
        .select(`
          *,
          invoice:invoices(
            id,
            invoice_number,
            client:clients(name)
          ),
          events:boleto_events(
            id,
            event_type,
            event_date,
            description,
            metadata,
            created_by
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(boleto => ({
        ...boleto,
        invoice: boleto.invoice ? {
          ...boleto.invoice,
          client_name: boleto.invoice.client?.name || 'N/A'
        } : undefined
      })) as Boleto[];
    },
  });

  const createBoleto = useMutation({
    mutationFn: async (boletoData: CreateBoletoData) => {
      const { data, error } = await supabase.rpc('create_boleto', {
        p_invoice_id: boletoData.invoice_id,
        p_amount: boletoData.amount,
        p_due_date: boletoData.due_date,
        p_payer_name: boletoData.payer_name,
        p_payer_cpf_cnpj: boletoData.payer_cpf_cnpj,
        p_payer_address: boletoData.payer_address,
        p_payer_city: boletoData.payer_city,
        p_payer_state: boletoData.payer_state,
        p_payer_zip_code: boletoData.payer_zip_code,
        p_instructions: boletoData.instructions,
        p_bank_code: boletoData.bank_code || '001',
        p_discount_amount: boletoData.discount_amount || 0,
        p_discount_date: boletoData.discount_date,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const updateBoletoStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      payment_date, 
      description 
    }: { 
      id: string; 
      status: string; 
      payment_date?: string; 
      description?: string;
    }) => {
      const { data, error } = await supabase.rpc('update_boleto_status', {
        p_boleto_id: id,
        p_status: status,
        p_payment_date: payment_date ? new Date(payment_date).toISOString() : null,
        p_description: description,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
    },
  });

  const cancelBoleto = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('boletos')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Boleto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
    },
  });

  const sendEmail = useMutation({
    mutationFn: async (id: string) => {
      // This would call an Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-boleto-email', {
        body: { boletoId: id }
      });

      if (error) throw error;
      
      // Update email_sent flag
      await supabase
        .from('boletos')
        .update({ email_sent: true })
        .eq('id', id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
    },
  });

  const sendSMS = useMutation({
    mutationFn: async (id: string) => {
      // This would call an Edge Function to send SMS
      const { data, error } = await supabase.functions.invoke('send-boleto-sms', {
        body: { boletoId: id }
      });

      if (error) throw error;
      
      // Update sms_sent flag
      await supabase
        .from('boletos')
        .update({ sms_sent: true })
        .eq('id', id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
    },
  });

  const generatePDF = useMutation({
    mutationFn: async (id: string) => {
      // This would call an Edge Function to generate PDF
      const { data, error } = await supabase.functions.invoke('generate-boleto-pdf', {
        body: { boletoId: id }
      });

      if (error) throw error;
      
      // Update pdf_url
      await supabase
        .from('boletos')
        .update({ pdf_url: data.url })
        .eq('id', id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
    },
  });

  return {
    boletos,
    isLoading,
    error,
    createBoleto: createBoleto.mutateAsync,
    updateBoletoStatus: updateBoletoStatus.mutateAsync,
    cancelBoleto: cancelBoleto.mutateAsync,
    sendEmail: sendEmail.mutateAsync,
    sendSMS: sendSMS.mutateAsync,
    generatePDF: generatePDF.mutateAsync,
    isCreating: createBoleto.isPending,
    isUpdating: updateBoletoStatus.isPending,
    isCancelling: cancelBoleto.isPending,
    isSendingEmail: sendEmail.isPending,
    isSendingSMS: sendSMS.isPending,
    isGeneratingPDF: generatePDF.isPending,
  };
}

export function useBoletoSummary() {
  const queryClient = useQueryClient();

  const {
    data: summary = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['boleto-summary'],
    queryFn: async () => {
      // Get boleto statistics
      const { data: boletos, error: boletosError } = await supabase
        .from('boletos')
        .select('status, amount, due_date')
        .order('created_at', { ascending: false });

      if (boletosError) throw boletosError;

      const stats = boletos.reduce((acc: Record<string, { count: number; total: number }>, boleto) => {
        acc[boleto.status] = acc[boleto.status] || { count: 0, total: 0 };
        acc[boleto.status].count += 1;
        acc[boleto.status].total += boleto.amount;
        return acc;
      }, {});

      // Check for overdue boletos
      const overdueBoletos = boletos.filter(b => 
        b.status === 'pending' && new Date(b.due_date) < new Date()
      );

      // Calculate totals
      const totalAmount = boletos.reduce((sum, b) => sum + b.amount, 0);
      const paidAmount = stats.paid?.total || 0;
      const pendingAmount = stats.pending?.total || 0;
      const overdueAmount = overdueBoletos.reduce((sum, b) => sum + b.amount, 0);

      return {
        stats,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        totalBoletos: boletos.length,
        paidBoletos: stats.paid?.count || 0,
        pendingBoletos: stats.pending?.count || 0,
        overdueBoletos: overdueBoletos.length,
        expiredBoletos: stats.expired?.count || 0,
        cancelledBoletos: stats.cancelled?.count || 0,
      };
    },
  });

  return {
    summary,
    isLoading,
    error,
  };
}

export function useBoletoEvents(boletoId?: string) {
  const queryClient = useQueryClient();

  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['boleto-events', boletoId],
    queryFn: async () => {
      if (!boletoId) return [];
      
      const { data, error } = await supabase
        .from('boleto_events')
        .select('*')
        .eq('boleto_id', boletoId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as BoletoEvent[];
    },
    enabled: !!boletoId,
  });

  return {
    events,
    isLoading,
    error,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatCPF_CNPJ(value: string): string {
  // Remove non-digits
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 11) {
    // CPF format: 123.456.789-00
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanValue.length === 14) {
    // CNPJ format: 12.345.678/0001-00
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return value;
}

export function formatZipCode(value: string): string {
  // Remove non-digits
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 8) {
    // CEP format: 12345-678
    return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return value;
}

export function isBoletoOverdue(dueDate: string, status: string): boolean {
  return status === 'pending' && new Date(dueDate) < new Date();
}

export function getBoletoStatusColor(status: string): string {
  const colors = {
    pending: 'text-yellow-600',
    paid: 'text-green-600',
    cancelled: 'text-red-600',
    expired: 'text-gray-600',
    overdue: 'text-red-600',
  };
  
  return colors[status as keyof typeof colors] || 'text-gray-600';
}

export function getBoletoStatusText(status: string): string {
  const texts = {
    pending: 'Pendente',
    paid: 'Pago',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    overdue: 'Vencido',
  };
  
  return texts[status as keyof typeof texts] || status;
}
