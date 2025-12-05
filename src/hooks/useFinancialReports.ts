import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category_id: string;
  date: string;
  due_date?: string;
  payment_method?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  attachment_url?: string;
  recurring: boolean;
  recurring_frequency?: string;
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  company_id: string;
  category?: {
    id: string;
    name: string;
    type: 'revenue' | 'expense' | 'asset' | 'liability';
    color: string;
    icon: string;
  };
}

export interface DREReport {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    gross: number;
    deductions: number;
    net: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
      percentage: number;
    }>;
  };
  expenses: {
    operating: number;
    nonOperating: number;
    total: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
      percentage: number;
    }>;
  };
  profit: {
    gross: number;
    operating: number;
    net: number;
    margin: {
      gross: number;
      operating: number;
      net: number;
    };
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    transactionCount: number;
  };
}

export interface ReportConfig {
  periodStart: string;
  periodEnd: string;
  includePending: boolean;
  groupByCategory: boolean;
  compareWithPrevious?: boolean;
  previousPeriodStart?: string;
  previousPeriodEnd?: string;
  selectedCategories?: string[];
  includeCancelled?: boolean;
  transactionType?: 'all' | 'revenue' | 'expense';
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface ReportFilters {
  periodStart: Date | null;
  periodEnd: Date | null;
  selectedCategories: string[];
  includePending: boolean;
  includeCancelled: boolean;
  transactionType: 'all' | 'revenue' | 'expense';
  minAmount: number | null;
  maxAmount: number | null;
  searchTerm: string;
}

export function useFinancialTransactions() {
  const queryClient = useQueryClient();

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async (): Promise<FinancialTransaction[]> => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(id, name, type, color, icon)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: async (transactionData: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'company_id'>) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Transação Criada',
        description: 'A transação financeira foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Criar Transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update transaction mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<FinancialTransaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Transação Atualizada',
        description: 'A transação financeira foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Atualizar Transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      toast({
        title: 'Transação Excluída',
        description: 'A transação financeira foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Excluir Transação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useDREReport() {
  const { transactions } = useFinancialTransactions();

  return useQuery({
    queryKey: ['dre-report'],
    queryFn: async (): Promise<DREReport | null> => {
      if (transactions.length === 0) return null;

      // Get current month transactions
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const periodTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= periodStart && transactionDate <= periodEnd;
      });

      // Calculate revenue
      const revenueTransactions = periodTransactions.filter(t => t.type === 'revenue' && t.status === 'paid');
      const grossRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Group revenue by category
      const revenueByCategory = revenueTransactions.reduce((acc, t) => {
        const categoryId = t.category_id;
        const categoryName = t.category?.name || 'Sem Categoria';
        
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName,
            amount: 0,
          };
        }
        acc[categoryId].amount += t.amount;
        return acc;
      }, {} as Record<string, { categoryId: string; categoryName: string; amount: number }>);

      // Calculate expenses
      const expenseTransactions = periodTransactions.filter(t => t.type === 'expense' && t.status === 'paid');
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Group expenses by category
      const expensesByCategory = expenseTransactions.reduce((acc, t) => {
        const categoryId = t.category_id;
        const categoryName = t.category?.name || 'Sem Categoria';
        
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName,
            amount: 0,
          };
        }
        acc[categoryId].amount += t.amount;
        return acc;
      }, {} as Record<string, { categoryId: string; categoryName: string; amount: number }>);

      // Calculate deductions (simplified - could include taxes, returns, etc.)
      const deductions = grossRevenue * 0.05; // Example: 5% deductions
      const netRevenue = grossRevenue - deductions;

      // Calculate profits
      const grossProfit = grossRevenue - totalExpenses;
      const operatingProfit = netRevenue - totalExpenses * 0.8; // Simplified operating expenses
      const netProfit = operatingProfit - deductions;

      // Calculate percentages
      const revenueByCategoryWithPercentage = Object.values(revenueByCategory).map(item => ({
        ...item,
        percentage: grossRevenue > 0 ? (item.amount / grossRevenue) * 100 : 0,
      }));

      const expensesByCategoryWithPercentage = Object.values(expensesByCategory).map(item => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
      }));

      return {
        period: {
          start: periodStart.toISOString().split('T')[0],
          end: periodEnd.toISOString().split('T')[0],
        },
        revenue: {
          gross: grossRevenue,
          deductions,
          net: netRevenue,
          byCategory: revenueByCategoryWithPercentage,
        },
        expenses: {
          operating: totalExpenses * 0.8, // Simplified
          nonOperating: totalExpenses * 0.2, // Simplified
          total: totalExpenses,
          byCategory: expensesByCategoryWithPercentage,
        },
        profit: {
          gross: grossProfit,
          operating: operatingProfit,
          net: netProfit,
          margin: {
            gross: grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0,
            operating: netRevenue > 0 ? (operatingProfit / netRevenue) * 100 : 0,
            net: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
          },
        },
        summary: {
          totalRevenue: grossRevenue,
          totalExpenses,
          netProfit,
          profitMargin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
          transactionCount: periodTransactions.length,
        },
      };
    },
    enabled: transactions.length > 0,
  });
}

export function useReportGenerator() {
  const queryClient = useQueryClient();

  const generateReport = useMutation({
    mutationFn: async (config: ReportConfig) => {
      // This would generate a comprehensive report
      // For now, we'll create a basic report structure
      const reportData = {
        id: crypto.randomUUID(),
        name: `Relatório DRE - ${config.periodStart} a ${config.periodEnd}`,
        type: 'dre',
        description: 'Demonstrativo de Resultados do Exercício',
        period_start: config.periodStart,
        period_end: config.periodEnd,
        configuration: config,
        status: 'generated',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('financial_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-reports'] });
      toast({
        title: 'Relatório Gerado',
        description: 'O relatório foi gerado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Gerar Relatório',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    generateReport: generateReport.mutate,
    isGenerating: generateReport.isPending,
  };
}

export function useFinancialReports() {
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financial-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-reports'] });
      toast({
        title: 'Relatório Excluído',
        description: 'O relatório foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Excluir Relatório',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    reports,
    isLoading,
    error,
    deleteReport: deleteReport.mutate,
    isDeleting: deleteReport.isPending,
  };
}
