import { supabase } from './supabaseClient';

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  type: 'cash' | 'card' | 'digital' | 'check' | 'other';
  is_active: boolean;
  requires_approval: boolean;
  max_installments: number;
  fee_percentage: number;
  fee_fixed_amount: number;
  icon?: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method_id: string;
  amount: number;
  installments: number;
  card_last_digits?: string;
  card_brand?: string;
  authorization_code?: string;
  transaction_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  payment_method?: PaymentMethod;
}

export interface CreatePaymentMethodData {
  name: string;
  description?: string;
  type: 'cash' | 'card' | 'digital' | 'check' | 'other';
  is_active?: boolean;
  requires_approval?: boolean;
  max_installments?: number;
  fee_percentage?: number;
  fee_fixed_amount?: number;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export interface UpdatePaymentMethodData extends Partial<CreatePaymentMethodData> {
  id: string;
}

export interface CreateSalePaymentData {
  sale_id: string;
  payment_method_id: string;
  amount: number;
  installments?: number;
  card_last_digits?: string;
  card_brand?: string;
  authorization_code?: string;
  transaction_id?: string;
}

export interface UpdateSalePaymentData extends Partial<CreateSalePaymentData> {
  id: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  rejection_reason?: string;
}

// Get all payment methods
export async function getPaymentMethods(includeInactive = false) {
  let query = supabase
    .from('payment_methods')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as PaymentMethod[];
}

// Get payment method by ID
export async function getPaymentMethodById(id: string) {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as PaymentMethod;
}

// Get payment methods by type
export async function getPaymentMethodsByType(type: PaymentMethod['type']) {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as PaymentMethod[];
}

// Create new payment method
export async function createPaymentMethod(paymentMethod: CreatePaymentMethodData) {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert([paymentMethod])
    .select()
    .single();

  if (error) throw error;
  return data as PaymentMethod;
}

// Update payment method
export async function updatePaymentMethod(paymentMethod: UpdatePaymentMethodData) {
  const { id, ...updateData } = paymentMethod;
  
  const { data, error } = await supabase
    .from('payment_methods')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PaymentMethod;
}

// Delete payment method (soft delete)
export async function deletePaymentMethod(id: string) {
  const { data, error } = await supabase
    .from('payment_methods')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PaymentMethod;
}

// Hard delete payment method
export async function hardDeletePaymentMethod(id: string) {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get sale payments
export async function getSalePayments(saleId: string) {
  const { data, error } = await supabase
    .from('sale_payments')
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .eq('sale_id', saleId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as SalePayment[];
}

// Create sale payment
export async function createSalePayment(payment: CreateSalePaymentData) {
  const { data, error } = await supabase
    .from('sale_payments')
    .insert([payment])
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .single();

  if (error) throw error;
  return data as SalePayment;
}

// Update sale payment
export async function updateSalePayment(payment: UpdateSalePaymentData) {
  const { id, ...updateData } = payment;
  
  const { data, error } = await supabase
    .from('sale_payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .single();

  if (error) throw error;
  return data as SalePayment;
}

// Approve payment
export async function approvePayment(paymentId: string, authorizationCode?: string) {
  const { data, error } = await supabase
    .from('sale_payments')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      authorization_code: authorizationCode,
    })
    .eq('id', paymentId)
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .single();

  if (error) throw error;
  return data as SalePayment;
}

// Reject payment
export async function rejectPayment(paymentId: string, reason: string) {
  const { data, error } = await supabase
    .from('sale_payments')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', paymentId)
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .single();

  if (error) throw error;
  return data as SalePayment;
}

// Cancel payment
export async function cancelPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('sale_payments')
    .update({
      status: 'cancelled',
    })
    .eq('id', paymentId)
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .single();

  if (error) throw error;
  return data as SalePayment;
}

// Refund payment
export async function refundPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('sale_payments')
    .update({
      status: 'refunded',
    })
    .eq('id', paymentId)
    .select(`
      *,
      payment_method:payment_methods(*)
    `)
    .single();

  if (error) throw error;
  return data as SalePayment;
}

// Calculate payment fees
export function calculatePaymentFees(paymentMethod: PaymentMethod, amount: number): number {
  const percentageFee = amount * (paymentMethod.fee_percentage / 100);
  const fixedFee = paymentMethod.fee_fixed_amount;
  return percentageFee + fixedFee;
}

// Calculate net amount after fees
export function calculateNetAmount(paymentMethod: PaymentMethod, amount: number): number {
  const fees = calculatePaymentFees(paymentMethod, amount);
  return amount - fees;
}

// Calculate installment amount
export function calculateInstallmentAmount(totalAmount: number, installments: number): number {
  return totalAmount / installments;
}

// Validate payment method data
export function validatePaymentMethodData(paymentMethod: CreatePaymentMethodData): string[] {
  const errors: string[] = [];
  
  if (!paymentMethod.name || paymentMethod.name.trim().length === 0) {
    errors.push('Nome do método de pagamento é obrigatório');
  }
  
  if (paymentMethod.name && paymentMethod.name.length > 50) {
    errors.push('Nome do método de pagamento muito longo (máximo 50 caracteres)');
  }
  
  if (!paymentMethod.type || !['cash', 'card', 'digital', 'check', 'other'].includes(paymentMethod.type)) {
    errors.push('Tipo do método de pagamento é inválido');
  }
  
  if (paymentMethod.max_installments && paymentMethod.max_installments < 1) {
    errors.push('Número máximo de parcelas deve ser maior que zero');
  }
  
  if (paymentMethod.fee_percentage && (paymentMethod.fee_percentage < 0 || paymentMethod.fee_percentage > 100)) {
    errors.push('Taxa percentual deve estar entre 0 e 100');
  }
  
  if (paymentMethod.fee_fixed_amount && paymentMethod.fee_fixed_amount < 0) {
    errors.push('Taxa fixa não pode ser negativa');
  }
  
  if (paymentMethod.color && !/^#[0-9A-F]{6}$/i.test(paymentMethod.color)) {
    errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
  }
  
  return errors;
}

// Validate sale payment data
export function validateSalePaymentData(payment: CreateSalePaymentData): string[] {
  const errors: string[] = [];
  
  if (!payment.sale_id || payment.sale_id.trim().length === 0) {
    errors.push('ID da venda é obrigatório');
  }
  
  if (!payment.payment_method_id || payment.payment_method_id.trim().length === 0) {
    errors.push('ID do método de pagamento é obrigatório');
  }
  
  if (!payment.amount || payment.amount <= 0) {
    errors.push('Valor do pagamento deve ser maior que zero');
  }
  
  if (payment.installments && payment.installments < 1) {
    errors.push('Número de parcelas deve ser maior que zero');
  }
  
  if (payment.card_last_digits && !/^\d{4}$/.test(payment.card_last_digits)) {
    errors.push('Últimos 4 dígitos do cartão devem ter exatamente 4 números');
  }
  
  return errors;
}

// Format payment method display
export function formatPaymentMethodDisplay(paymentMethod: PaymentMethod): string {
  return paymentMethod.name;
}

// Format payment status display
export function formatPaymentStatusDisplay(status: SalePayment['status']): string {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'approved': return 'Aprovado';
    case 'rejected': return 'Rejeitado';
    case 'cancelled': return 'Cancelado';
    case 'refunded': return 'Reembolsado';
    default: return status;
  }
}

// Get payment status color
export function getPaymentStatusColor(status: SalePayment['status']): string {
  switch (status) {
    case 'pending': return '#F59E0B'; // yellow
    case 'approved': return '#10B981'; // green
    case 'rejected': return '#EF4444'; // red
    case 'cancelled': return '#6B7280'; // gray
    case 'refunded': return '#8B5CF6'; // purple
    default: return '#6B7280';
  }
}

// Check if payment method supports installments
export function supportsInstallments(paymentMethod: PaymentMethod): boolean {
  return paymentMethod.type === 'card' && paymentMethod.max_installments > 1;
}

// Get available installments for payment method
export function getAvailableInstallments(paymentMethod: PaymentMethod, minAmount = 0): number[] {
  if (!supportsInstallments(paymentMethod)) {
    return [1];
  }
  
  const installments: number[] = [];
  const maxInstallments = Math.min(paymentMethod.max_installments, 12);
  
  for (let i = 1; i <= maxInstallments; i++) {
    // Some payment methods have minimum amount requirements for higher installments
    const installmentAmount = minAmount / i;
    if (installmentAmount >= 5) { // Minimum R$5 per installment
      installments.push(i);
    }
  }
  
  return installments;
}

// Group payments by method
export function groupPaymentsByMethod(payments: SalePayment[]): Record<string, SalePayment[]> {
  return payments.reduce((groups, payment) => {
    const key = payment.payment_method_id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(payment);
    return groups;
  }, {} as Record<string, SalePayment[]>);
}

// Calculate total paid amount
export function calculateTotalPaid(payments: SalePayment[]): number {
  return payments
    .filter(payment => payment.status === 'approved')
    .reduce((total, payment) => total + payment.amount, 0);
}

// Calculate total pending amount
export function calculateTotalPending(payments: SalePayment[]): number {
  return payments
    .filter(payment => payment.status === 'pending')
    .reduce((total, payment) => total + payment.amount, 0);
}

// Check if sale is fully paid
export function isSaleFullyPaid(totalAmount: number, payments: SalePayment[]): boolean {
  const paidAmount = calculateTotalPaid(payments);
  return paidAmount >= totalAmount;
}

// Get payment method statistics
export async function getPaymentMethodStatistics(paymentMethodId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('sale_payments')
    .select('amount, status, created_at')
    .eq('payment_method_id', paymentMethodId);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  const payments = data || [];
  const totalCount = payments.length;
  const approvedCount = payments.filter(p => p.status === 'approved').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const approvedAmount = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);

  return {
    totalCount,
    approvedCount,
    rejectedCount,
    pendingCount,
    totalAmount,
    approvedAmount,
    averageAmount: approvedCount > 0 ? approvedAmount / approvedCount : 0,
    approvalRate: totalCount > 0 ? (approvedCount / totalCount) * 100 : 0,
  };
}
