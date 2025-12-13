import { supabase } from './supabaseClient';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  category_name?: string; // Mapped from join
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  due_date?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  date: string;
  due_date?: string;
  payment_method?: string;
}

export interface TransactionSummary {
  balance: number;
  income: number;
  expenses: number;
  pending_income: number;
  pending_expenses: number;
}

// Get all transactions (with basic filtering optional later)
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
  })) as Transaction[];
}

// Get summary stats
export async function getFinancialSummary(): Promise<TransactionSummary> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('amount, type, status');

  if (error) throw error;

  const summary = (data as Partial<Transaction>[]).reduce(
    (acc, curr) => {
      const amount = Number(curr.amount) || 0;
      
      if (curr.status === 'completed') {
        if (curr.type === 'income') {
          acc.income += amount;
          acc.balance += amount;
        } else {
          acc.expenses += amount;
          acc.balance -= amount;
        }
      } else if (curr.status === 'pending') {
        if (curr.type === 'income') {
          acc.pending_income += amount;
        } else {
          acc.pending_expenses += amount;
        }
      }
      return acc;
    },
    { balance: 0, income: 0, expenses: 0, pending_income: 0, pending_expenses: 0 }
  );

  return summary;
}

export async function createTransaction(transaction: CreateTransactionData) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(
  id: number,
  transaction: Partial<CreateTransactionData>
) {
  const { data, error } = await supabase
    .from('financial_transactions')
    .update(transaction)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: number) {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getFinancialCategories() {
  const { data, error } = await supabase
    .from('financial_categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

