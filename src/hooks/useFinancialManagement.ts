import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Types for financial management
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  receipt_url?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_by?: string;
  created_at: string;
  category?: ExpenseCategory;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  agency?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'payment_received' | 'payment_made';
  amount: number;
  description?: string;
  transaction_date: string;
  reference_number?: string;
  category?: string;
  reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  related_sale_id?: number;
  related_expense_id?: string;
  created_at: string;
  bank_account?: BankAccount;
}

export interface CashFlowSummary {
  id: string;
  date: string;
  opening_balance: number;
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  closing_balance: number;
  sales_count: number;
  expenses_count: number;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id?: string;
  name: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  category?: ExpenseCategory;
}

export interface FinancialReport {
  id: string;
  report_type: 'p&l' | 'balance_sheet' | 'cash_flow' | 'expenses';
  title: string;
  description?: string;
  report_data: {
    totalRevenue?: number;
    totalExpenses?: number;
    netProfit?: number;
    profitMargin?: number;
    cashFlow?: CashFlowSummary[];
    totalIncome?: number;
    totalExpenses?: number;
    netCashFlow?: number;
  };
  start_date: string;
  end_date: string;
  generated_by?: string;
  file_url?: string;
  created_at: string;
}

// Query keys
export const financialKeys = {
  all: ['financial'] as const,
  expenseCategories: () => [...financialKeys.all, 'expense-categories'] as const,
  expenses: () => [...financialKeys.all, 'expenses'] as const,
  expense: (id: string) => [...financialKeys.expenses(), id] as const,
  bankAccounts: () => [...financialKeys.all, 'bank-accounts'] as const,
  bankTransactions: (accountId?: string) => [...financialKeys.all, 'bank-transactions', accountId] as const,
  cashFlow: () => [...financialKeys.all, 'cash-flow'] as const,
  cashFlowDate: (date: string) => [...financialKeys.cashFlow(), date] as const,
  budgets: () => [...financialKeys.all, 'budgets'] as const,
  reports: () => [...financialKeys.all, 'reports'] as const,
};

// Get expense categories
export function useExpenseCategories() {
  return useQuery({
    queryKey: financialKeys.expenseCategories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ExpenseCategory[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Get expenses
export function useExpenses(filters?: {
  category_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: [...financialKeys.expenses(), filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          expense_categories:category_id (name, color)
        `)
        .order('expense_date', { ascending: false });

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.start_date) {
        query = query.gte('expense_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('expense_date', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Expense & { expense_categories: ExpenseCategory | null })[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Create expense
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select(`
          *,
          expense_categories:category_id (name, color)
        `)
        .single();

      if (error) throw error;
      return data as Expense & { expense_categories: ExpenseCategory | null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.expenses() });
      queryClient.invalidateQueries({ queryKey: financialKeys.cashFlow() });
      toast({
        title: "Despesa criada",
        description: "A despesa foi registrada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar despesa",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get bank accounts
export function useBankAccounts() {
  return useQuery({
    queryKey: financialKeys.bankAccounts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('bank_name');

      if (error) throw error;
      return data as BankAccount[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Create bank account
export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Omit<BankAccount, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(account)
        .select()
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.bankAccounts() });
      toast({
        title: "Conta bancária criada",
        description: "A conta bancária foi cadastrada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get bank transactions
export function useBankTransactions(accountId?: string, filters?: {
  start_date?: string;
  end_date?: string;
  reconciled?: boolean;
}) {
  return useQuery({
    queryKey: [...financialKeys.bankTransactions(accountId), filters],
    queryFn: async () => {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_accounts:bank_account_id (bank_name, account_number)
        `)
        .order('transaction_date', { ascending: false });

      if (accountId) {
        query = query.eq('bank_account_id', accountId);
      }
      if (filters?.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }
      if (filters?.reconciled !== undefined) {
        query = query.eq('reconciled', filters.reconciled);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (BankTransaction & { bank_accounts: BankAccount })[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Create bank transaction
export function useCreateBankTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: Omit<BankTransaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .insert(transaction)
        .select(`
          *,
          bank_accounts:bank_account_id (bank_name, account_number)
        `)
        .single();

      if (error) throw error;
      return data as BankTransaction & { bank_accounts: BankAccount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.bankTransactions() });
      queryClient.invalidateQueries({ queryKey: financialKeys.bankAccounts() });
      toast({
        title: "Transação criada",
        description: "A transação bancária foi registrada."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na transação",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Reconcile transaction
export function useReconcileTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ transactionId, reconciled }: { transactionId: string; reconciled: boolean }) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update({
          reconciled,
          reconciled_at: reconciled ? new Date().toISOString() : null,
          reconciled_by: reconciled ? supabase.auth.getUser().then(u => u.data.user?.id) : null
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;
      return data as BankTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.bankTransactions() });
      toast({
        title: "Transação reconciliada",
        description: "A transação foi reconciliada com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na reconciliação",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get cash flow summary
export function useCashFlowSummary(days: number = 30) {
  return useQuery({
    queryKey: [...financialKeys.cashFlow(), days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('cash_flow_summary')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      return data as CashFlowSummary[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get budgets
export function useBudgets() {
  return useQuery({
    queryKey: financialKeys.budgets(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          expense_categories:category_id (name, color)
        `)
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as (Budget & { expense_categories: ExpenseCategory | null })[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Create budget
export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select(`
          *,
          expense_categories:category_id (name, color)
        `)
        .single();

      if (error) throw error;
      return data as Budget & { expense_categories: ExpenseCategory | null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.budgets() });
      toast({
        title: "Orçamento criado",
        description: "O orçamento foi criado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar orçamento",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Generate financial report
export function useGenerateFinancialReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      reportType,
      title,
      startDate,
      endDate,
      description
    }: {
      reportType: 'p&l' | 'balance_sheet' | 'cash_flow' | 'expenses';
      title: string;
      startDate: string;
      endDate: string;
      description?: string;
    }) => {
      // Generate report data based on type
      let reportData = {};

      if (reportType === 'p&l') {
        // P&L Report
        const { data: salesData } = await supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .eq('status', 'concluida');

        const { data: expensesData } = await supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
          .in('status', ['approved', 'paid']);

        const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
        const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
        const netProfit = totalRevenue - totalExpenses;

        reportData = {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        };
      } else if (reportType === 'cash_flow') {
        // Cash Flow Report
        const { data: cashFlowData } = await supabase
          .from('cash_flow_summary')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date');

        reportData = {
          cashFlow: cashFlowData,
          totalIncome: cashFlowData?.reduce((sum, day) => sum + day.total_income, 0) || 0,
          totalExpenses: cashFlowData?.reduce((sum, day) => sum + day.total_expenses, 0) || 0,
          netCashFlow: cashFlowData?.reduce((sum, day) => sum + day.net_cash_flow, 0) || 0
        };
      }

      // Save report
      const { data, error } = await supabase
        .from('financial_reports')
        .insert({
          report_type: reportType,
          title,
          description,
          report_data: reportData,
          start_date: startDate,
          end_date: endDate,
          generated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data as FinancialReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.reports() });
      toast({
        title: "Relatório gerado",
        description: "O relatório financeiro foi gerado com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive"
      });
    },
  });
}

// Get financial reports
export function useFinancialReports() {
  return useQuery({
    queryKey: financialKeys.reports(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FinancialReport[];
    },
    staleTime: 15 * 60 * 1000,
  });
}
