import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface SellerPerformance {
  id: string;
  seller_id: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_orders: number;
  total_items: number;
  average_ticket: number;
  commission_total: number;
  commission_rate: number;
  target_amount?: number;
  target_achievement?: number;
  rank_position?: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SalesCommissionRule {
  id: string;
  name: string;
  description?: string;
  commission_type: 'percentage' | 'fixed' | 'tiered';
  commission_value: number;
  tier_config?: Record<string, unknown>;
  min_sales_amount?: number;
  max_sales_amount?: number;
  product_categories?: string[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  tenant_id: string;
}

export interface SalesLeaderboard {
  id: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  seller_id: string;
  total_sales: number;
  total_orders: number;
  rank_position: number;
  previous_rank?: number;
  rank_change?: number;
  created_at: string;
  tenant_id: string;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCommissionRuleData {
  name: string;
  description?: string;
  commission_type: SalesCommissionRule['commission_type'];
  commission_value: number;
  tier_config?: Record<string, unknown>;
  min_sales_amount?: number;
  max_sales_amount?: number;
  product_categories?: string[];
  priority?: number;
}

export function useSellerPerformance(sellerId?: string, startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();

  const {
    data: performance = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['seller-performance', sellerId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('seller_performance')
        .select(`
          *,
          seller:users(id, name, email)
        `)
        .order('period_start', { ascending: false });

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }
      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      if (endDate) {
        query = query.lte('period_end', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SellerPerformance[];
    },
  });

  const calculatePerformance = useMutation({
    mutationFn: async ({
      sellerId,
      periodStart,
      periodEnd,
    }: {
      sellerId: string;
      periodStart: string;
      periodEnd: string;
    }) => {
      const { data, error } = await supabase.rpc('calculate_seller_performance', {
        p_seller_id: sellerId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-performance'] });
      queryClient.invalidateQueries({ queryKey: ['sales-leaderboard'] });
    },
  });

  return {
    performance,
    isLoading,
    error,
    calculatePerformance: calculatePerformance.mutateAsync,
    isCalculating: calculatePerformance.isPending,
  };
}

export function useSalesCommissionRules() {
  const queryClient = useQueryClient();

  const {
    data: rules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sales-commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_commission_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as SalesCommissionRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (ruleData: CreateCommissionRuleData) => {
      const { data, error } = await supabase
        .from('sales_commission_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;
      return data as SalesCommissionRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-commission-rules'] });
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<SalesCommissionRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_commission_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SalesCommissionRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-commission-rules'] });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_commission_rules')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-commission-rules'] });
    },
  });

  return {
    rules,
    isLoading,
    error,
    createRule: createRule.mutateAsync,
    updateRule: updateRule.mutateAsync,
    deleteRule: deleteRule.mutateAsync,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
  };
}

export function useSalesLeaderboard(periodType?: string, startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();

  const {
    data: leaderboard = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sales-leaderboard', periodType, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('sales_leaderboard')
        .select(`
          *,
          seller:users(id, name, email)
        `)
        .order('rank_position', { ascending: true });

      if (periodType) {
        query = query.eq('period_type', periodType);
      }
      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      if (endDate) {
        query = query.lte('period_end', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SalesLeaderboard[];
    },
  });

  const updateLeaderboard = useMutation({
    mutationFn: async ({
      periodType,
      periodStart,
      periodEnd,
    }: {
      periodType: string;
      periodStart: string;
      periodEnd: string;
    }) => {
      const { data, error } = await supabase.rpc('update_sales_leaderboard', {
        p_period_type: periodType,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-leaderboard'] });
    },
  });

  return {
    leaderboard,
    isLoading,
    error,
    updateLeaderboard: updateLeaderboard.mutateAsync,
    isUpdating: updateLeaderboard.isPending,
  };
}

export function useSalesReportsSummary(sellerId?: string, startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();

  const {
    data: summary = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sales-reports-summary', sellerId, startDate, endDate],
    queryFn: async () => {
      // Get performance summary
      let performanceQuery = supabase
        .from('seller_performance')
        .select('*');

      if (sellerId) {
        performanceQuery = performanceQuery.eq('seller_id', sellerId);
      }
      if (startDate) {
        performanceQuery = performanceQuery.gte('period_start', startDate);
      }
      if (endDate) {
        performanceQuery = performanceQuery.lte('period_end', endDate);
      }

      const { data: performanceData, error: performanceError } = await performanceQuery;
      if (performanceError) throw performanceError;

      // Calculate summary
      const totalSales = performanceData.reduce((sum, p) => sum + p.total_sales, 0);
      const totalOrders = performanceData.reduce((sum, p) => sum + p.total_orders, 0);
      const totalCommission = performanceData.reduce((sum, p) => sum + p.commission_total, 0);
      const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Get best period
      const bestPeriod = performanceData.reduce((best, current) => 
        current.total_sales > (best?.total_sales || 0) ? current : best
      , null as SellerPerformance | null);

      return {
        totalSales,
        totalOrders,
        totalCommission,
        averageTicket,
        totalSellers: sellerId ? 1 : new Set(performanceData.map(p => p.seller_id)).size,
        bestPeriod,
        performanceCount: performanceData.length,
      };
    },
  });

  return {
    summary,
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

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function getRankChangeIcon(change?: number): React.ReactNode {
  if (!change) return null;
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '=';
}

export function getRankChangeColor(change?: number): string {
  if (!change) return 'text-gray-600';
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}

export function getCommissionTypeText(type: string): string {
  const texts = {
    percentage: 'Percentual',
    fixed: 'Fixo',
    tiered: 'Por Níveis',
  };
  return texts[type as keyof typeof texts] || type;
}

export function getPeriodTypeText(type: string): string {
  const texts = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };
  return texts[type as keyof typeof texts] || type;
}
