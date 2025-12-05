import { supabase } from './supabaseClient';

export interface FinancialCategory {
  id: string;
  name: string;
  description?: string;
  type: 'income' | 'expense';
  color: string;
  created_at: string;
  created_by?: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'payable' | 'receivable';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  payment_date?: string;
  category_id?: string;
  client_id?: string;
  supplier_id?: string;
  reference_number?: string;
  notes?: string;
  installments_total: number;
  current_installment: number;
  parent_transaction_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  category?: FinancialCategory;
  client?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  payments?: TransactionPayment[];
  paid_amount?: number;
  remaining_amount?: number;
}

export interface TransactionPayment {
  id: string;
  transaction_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface Supplier {
  id: string;
  name: string;
  document_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateFinancialTransactionData {
  description: string;
  amount: number;
  type: 'payable' | 'receivable';
  due_date: string;
  category_id?: string;
  client_id?: string;
  supplier_id?: string;
  reference_number?: string;
  notes?: string;
  installments_total?: number;
  current_installment?: number;
}

export interface UpdateFinancialTransactionData {
  description?: string;
  amount?: number;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  payment_date?: string;
  category_id?: string;
  reference_number?: string;
  notes?: string;
}

export interface CreateTransactionPaymentData {
  transaction_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

// Financial Categories
export async function getFinancialCategories(): Promise<FinancialCategory[]> {
  const { data, error } = await supabase
    .from('financial_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as FinancialCategory[];
}

export async function createFinancialCategory(category: Omit<FinancialCategory, 'id' | 'created_at' | 'created_by'>): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from('financial_categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data as FinancialCategory;
}

export async function updateFinancialCategory(id: string, updates: Partial<FinancialCategory>): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from('financial_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FinancialCategory;
}

export async function deleteFinancialCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('financial_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Financial Transactions
export async function getFinancialTransactions(filters?: {
  type?: 'payable' | 'receivable';
  status?: string;
  category_id?: string;
  client_id?: string;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<FinancialTransaction[]> {
  let query = supabase
    .from('financial_transactions')
    .select(`
      *,
      category:financial_categories(*),
      client:clients(id, name),
      supplier:suppliers(id, name),
      payments:transaction_payments(*)
    `)
    .order('due_date', { ascending: true });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }
  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }
  if (filters?.start_date) {
    query = query.gte('due_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('due_date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Calculate paid and remaining amounts
  return (data as FinancialTransaction[]).map(transaction => {
    const paidAmount = transaction.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    return {
      ...transaction,
      paid_amount: paidAmount,
      remaining_amount: transaction.amount - paidAmount,
    };
  });
}

export async function createFinancialTransaction(transaction: CreateFinancialTransactionData): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(transaction)
    .select(`
      *,
      category:financial_categories(*),
      client:clients(id, name),
      supplier:suppliers(id, name)
    `)
    .single();

  if (error) throw error;
  return data as FinancialTransaction;
}

export async function updateFinancialTransaction(id: string, updates: UpdateFinancialTransactionData): Promise<FinancialTransaction> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      category:financial_categories(*),
      client:clients(id, name),
      supplier:suppliers(id, name)
    `)
    .single();

  if (error) throw error;
  return data as FinancialTransaction;
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Transaction Payments
export async function getTransactionPayments(transactionId: string): Promise<TransactionPayment[]> {
  const { data, error } = await supabase
    .from('transaction_payments')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data as TransactionPayment[];
}

export async function createTransactionPayment(payment: CreateTransactionPaymentData): Promise<TransactionPayment> {
  const { data, error } = await supabase
    .from('transaction_payments')
    .insert(payment)
    .select()
    .single();

  if (error) throw error;
  return data as TransactionPayment;
}

export async function deleteTransactionPayment(id: string): Promise<void> {
  const { error } = await supabase
    .from('transaction_payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Suppliers
export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as Supplier[];
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();

  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Financial Summary
export async function getFinancialSummary(filters?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  totalPayable: number;
  totalReceivable: number;
  totalPaid: number;
  totalReceived: number;
  overduePayables: number;
  overdueReceivables: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
}> {
  let query = supabase
    .from('financial_transactions')
    .select('amount, type, status, due_date');

  if (filters?.start_date) {
    query = query.gte('due_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('due_date', filters.end_date);
  }

  const { data, error } = await query;

  if (error) throw error;

  const transactions = data || [];
  const today = new Date().toISOString().split('T')[0];

  const summary = {
    totalPayable: 0,
    totalReceivable: 0,
    totalPaid: 0,
    totalReceived: 0,
    overduePayables: 0,
    overdueReceivables: 0,
    pendingCount: 0,
    paidCount: 0,
    overdueCount: 0,
  };

  transactions.forEach(transaction => {
    if (transaction.type === 'payable') {
      summary.totalPayable += transaction.amount;
      if (transaction.status === 'paid') {
        summary.totalPaid += transaction.amount;
      }
      if (transaction.status === 'overdue' || (transaction.status === 'pending' && transaction.due_date < today)) {
        summary.overduePayables += transaction.amount;
      }
    } else {
      summary.totalReceivable += transaction.amount;
      if (transaction.status === 'paid') {
        summary.totalReceived += transaction.amount;
      }
      if (transaction.status === 'overdue' || (transaction.status === 'pending' && transaction.due_date < today)) {
        summary.overdueReceivables += transaction.amount;
      }
    }

    if (transaction.status === 'pending') {
      summary.pendingCount++;
    } else if (transaction.status === 'paid') {
      summary.paidCount++;
    } else if (transaction.status === 'overdue') {
      summary.overdueCount++;
    }
  });

  return summary;
}
