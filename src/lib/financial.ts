import { supabase } from './supabaseClient';

export interface BankAccount {
  id: string;
  name: string;
  bank_name?: string;
  account_number?: string;
  type: 'checking' | 'savings' | 'cash' | 'digital';
  balance: number;
  color?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export interface BankStatementEntry {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  external_id?: string; // ID from OFX/CSV
  reconciled: boolean;
  transaction_id?: string; // Linked system transaction
  created_at: string;
}

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
  type: 'payable' | 'receivable' | 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'completed';
  due_date: string;
  date?: string;
  payment_date?: string;
  payment_method?: string;
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

export interface TransactionSummary {
  balance: number;
  income: number;
  expenses: number;
  pending_income: number;
  pending_expenses: number;
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
    .order('date', { ascending: false })
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });

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

export async function deleteFinancialTransaction(id: string | number): Promise<void> {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Compatibility alias for the old code
export const deleteTransaction = deleteFinancialTransaction;

export async function getTransactions() {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*, category:financial_categories(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((tx: any) => ({
    ...tx,
    category_name: tx.category?.name
  })) as FinancialTransaction[];
}

export const createTransaction = createFinancialTransaction;
export const updateTransaction = updateFinancialTransaction;
// Bank Accounts
export async function getBankAccounts(): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching bank accounts:', error);
    // Return empty array if table doesn't exist yet, for graceful failure during migration
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) return [];
    throw error;
  }
  return data as BankAccount[];
}

export async function createBankAccount(account: Omit<BankAccount, 'id' | 'created_at' | 'created_by'>): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(account)
    .select()
    .single();

  if (error) throw error;
  return data as BankAccount;
}

// Bank Statement and Reconciliation
export async function getBankStatementEntries(accountId: string): Promise<BankStatementEntry[]> {
  const { data, error } = await supabase
    .from('bank_statement_entries')
    .select('*')
    .eq('account_id', accountId)
    .order('date', { ascending: false });

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) return [];
    throw error;
  }
  return data as BankStatementEntry[];
}

export async function reconcileTransaction(entryId: string, transactionId: string): Promise<void> {
  // 1. Mark entry as reconciled
  const { error: entryError } = await supabase
    .from('bank_statement_entries')
    .update({ reconciled: true, transaction_id: transactionId })
    .eq('id', entryId);

  if (entryError) throw entryError;

  // 2. Mark transaction as completed/paid if it wasn't
  const { error: txError } = await supabase
    .from('financial_transactions')
    .update({ status: 'completed', payment_date: new Date().toISOString() })
    .eq('id', transactionId);

  if (txError) throw txError;
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
}): Promise<TransactionSummary> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('amount, type, status, due_date, date');

  if (error) throw error;

  const transactions = data || [];
  const today = new Date().toISOString().split('T')[0];

  const summary: TransactionSummary = {
    balance: 0,
    income: 0,
    expenses: 0,
    pending_income: 0,
    pending_expenses: 0,
  };

  transactions.forEach(transaction => {
    const amount = Number(transaction.amount) || 0;
    const isCompleted = transaction.status === 'completed' || transaction.status === 'paid';
    const isPending = transaction.status === 'pending';
    
    // Map types consistently
    const type = (transaction.type === 'receivable' || transaction.type === 'income') ? 'income' : 'expense';

    if (isCompleted) {
      if (type === 'income') {
        summary.income += amount;
        summary.balance += amount;
      } else {
        summary.expenses += amount;
        summary.balance -= amount;
      }
    } else if (isPending) {
      if (type === 'income') {
        summary.pending_income += amount;
      } else {
        summary.pending_expenses += amount;
      }
    }
  });

  return summary;
}
