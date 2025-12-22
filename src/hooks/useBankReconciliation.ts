import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface BankAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'investment';
  opening_balance: number;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankStatement {
  id: string;
  bank_account_id: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  file_url?: string;
  status: 'pending' | 'processing' | 'reconciled' | 'error';
  processed_at?: string;
  reconciled_at?: string;
  created_at: string;
  updated_at: string;
  bank_account?: BankAccount;
}

export interface BankStatementTransaction {
  id: string;
  bank_statement_id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  reference_number?: string;
  category_code?: string;
  balance_after_transaction?: number;
  reconciliation_status: 'unmatched' | 'matched' | 'manual' | 'ignored';
  matched_transaction_id?: string;
  confidence_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  matched_transaction?: {
    id: string;
    description: string;
    amount: number;
    date: string;
    category_id: string;
  };
}

export interface ReconciliationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'description_match' | 'amount_match' | 'date_match' | 'reference_match';
  pattern: string;
  match_threshold: number;
  category_id?: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationLog {
  id: string;
  bank_statement_id?: string;
  action: string;
  details: Record<string, unknown>;
  performed_by: string;
  created_at: string;
}

export function useBankAccounts() {
  const queryClient = useQueryClient();

  const {
    data: bankAccounts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const createBankAccount = useMutation({
    mutationFn: async (accountData: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  return {
    bankAccounts,
    isLoading,
    error,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
  };
}

export function useBankStatements() {
  const queryClient = useQueryClient();

  const {
    data: bankStatements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bank-statements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_statements')
        .select(`
          *,
          bank_account:bank_accounts(name, bank_name, account_number)
        `)
        .order('statement_date', { ascending: false });

      if (error) throw error;
      return data as BankStatement[];
    },
  });

  const createBankStatement = useMutation({
    mutationFn: async (statementData: Omit<BankStatement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bank_statements')
        .insert(statementData)
        .select()
        .single();

      if (error) throw error;
      return data as BankStatement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
  });

  const updateBankStatement = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<BankStatement> & { id: string }) => {
      const { data, error } = await supabase
        .from('bank_statements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BankStatement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
  });

  return {
    bankStatements,
    isLoading,
    error,
    createBankStatement,
    updateBankStatement,
  };
}

export function useBankStatementTransactions(statementId?: string) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['bank-statement-transactions', statementId],
    queryFn: async () => {
      let query = supabase
        .from('bank_statement_transactions')
        .select(`
          *,
          matched_transaction:financial_transactions(id, description, amount, date, category_id)
        `)
        .order('transaction_date', { ascending: false });

      if (statementId) {
        query = query.eq('bank_statement_id', statementId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BankStatementTransaction[];
    },
    enabled: !!statementId,
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<BankStatementTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('bank_statement_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BankStatementTransaction;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['bank-statement-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    updateTransaction,
  };
}

export function useReconciliationRules() {
  const queryClient = useQueryClient();

  const {
    data: rules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reconciliation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reconciliation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as ReconciliationRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (ruleData: Omit<ReconciliationRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('reconciliation_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;
      return data as ReconciliationRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-rules'] });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ReconciliationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('reconciliation_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ReconciliationRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-rules'] });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reconciliation_rules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-rules'] });
    },
  });

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
  };
}

export function useReconciliationSummary() {
  const queryClient = useQueryClient();

  const {
    data: summary = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reconciliation-summary'],
    queryFn: async () => {
      // Get summary statistics
      const { data: stats, error: statsError } = await supabase
        .from('bank_statement_transactions')
        .select('reconciliation_status')
        .then(({ data, error }) => {
          if (error) throw error;
          
          const summary = data.reduce((acc: Record<string, number>, transaction) => {
            acc[transaction.reconciliation_status] = (acc[transaction.reconciliation_status] || 0) + 1;
            return acc;
          }, {});

          return summary;
        });

      if (statsError) throw statsError;

      // Get recent statements
      const { data: recentStatements, error: statementsError } = await supabase
        .from('bank_statements')
        .select(`
          id,
          statement_date,
          status,
          bank_account:bank_accounts(name, bank_name)
        `)
        .order('statement_date', { ascending: false })
        .limit(5);

      if (statementsError) throw statementsError;

      return {
        stats,
        recentStatements,
      };
    },
  });

  return {
    summary,
    isLoading,
    error,
  };
}

export function useAutoReconciliation() {
  const queryClient = useQueryClient();

  const reconcileStatement = useMutation({
    mutationFn: async (statementId: string) => {
      // This would call a Supabase Edge Function for the actual reconciliation logic
      const { data, error } = await supabase.functions.invoke('auto-reconcile', {
        body: { statementId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statement-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
  });

  return {
    reconcileStatement,
  };
}
