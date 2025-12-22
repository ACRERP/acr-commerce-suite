import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Types for enhanced analytics
export interface DailyAnalytics {
  id: string;
  date: string;
  total_sales: number;
  total_revenue: number;
  new_clients: number;
  average_ticket: number;
  total_products_sold: number;
  unique_customers: number;
  created_at: string;
  updated_at: string;
}

export interface ProductAnalytics {
  id: string;
  product_id: number;
  date: string;
  quantity_sold: number;
  total_revenue: number;
  views_count: number;
  add_to_cart_count: number;
  conversion_rate: number;
}

export interface ClientAnalytics {
  id: string;
  client_id: number;
  date: string;
  total_purchases: number;
  total_spent: number;
  average_ticket: number;
  last_purchase_at: string | null;
  visit_count: number;
}

export interface QuickActionLog {
  id: string;
  user_id: string;
  action_type: string;
  action_path: string;
  created_at: string;
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  daily: () => [...analyticsKeys.all, 'daily'] as const,
  dailyDate: (date: string) => [...analyticsKeys.daily(), date] as const,
  weekly: () => [...analyticsKeys.all, 'weekly'] as const,
  monthly: () => [...analyticsKeys.all, 'monthly'] as const,
  products: () => [...analyticsKeys.all, 'products'] as const,
  product: (productId: number) => [...analyticsKeys.products(), productId] as const,
  clients: () => [...analyticsKeys.all, 'clients'] as const,
  client: (clientId: number) => [...analyticsKeys.clients(), clientId] as const,
};

// Get today's analytics
export function useTodayAnalytics() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: analyticsKeys.dailyDate(today),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_analytics')
        .select('*')
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data as DailyAnalytics | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get weekly analytics comparison
export function useWeeklyAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.weekly(),
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('daily_analytics')
        .select('*')
        .gte('date', twoWeeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      return data as DailyAnalytics[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get top products by performance
export function useTopProducts(days: number = 7) {
  return useQuery({
    queryKey: ['top-products', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('product_analytics')
        .select(`
          *,
          products:product_id (name, code)
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('total_revenue', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data as (ProductAnalytics & { products: { name: string; code: string } })[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Get client performance analytics
export function useClientAnalytics(clientId: number, days: number = 30) {
  return useQuery({
    queryKey: analyticsKeys.client(clientId),
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('client_analytics')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      return data as ClientAnalytics[];
    },
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000,
  });
}

// Log quick action
export function useLogQuickAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ actionType, actionPath }: { actionType: string; actionPath: string }) => {
      const { data, error } = await supabase.rpc('log_quick_action', {
        action_type_param: actionType,
        action_path_param: actionPath,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Invalidate quick actions cache if needed
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
    },
    onError: (error) => {
      // Don't show error for logging failures, just log to console
      console.error('Failed to log quick action:', error);
    },
  });
}

// Get revenue trends (last 30 days)
export function useRevenueTrends(days: number = 30) {
  return useQuery({
    queryKey: ['revenue-trends', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_analytics')
        .select('date, total_revenue, total_sales')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      return data as { date: string; total_revenue: number; total_sales: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get sales by hour (for today)
export function useSalesByHour() {
  return useQuery({
    queryKey: ['sales-by-hour'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('created_at, total_amount')
        .gte('created_at', new Date().setHours(0, 0, 0, 0))
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by hour
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        sales: 0,
        revenue: 0,
      }));

      data.forEach(sale => {
        const hour = new Date(sale.created_at).getHours();
        hourlyData[hour].sales += 1;
        hourlyData[hour].revenue += sale.total_amount;
      });

      return hourlyData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get quick actions usage stats
export function useQuickActionsStats(days: number = 7) {
  return useQuery({
    queryKey: ['quick-actions-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('quick_actions_log')
        .select('action_type, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by action type
      const stats = data.reduce((acc: Record<string, number>, action) => {
        acc[action.action_type] = (acc[action.action_type] || 0) + 1;
        return acc;
      }, {});

      return stats;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Utility functions for formatting analytics data
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const getTrendDirection = (value: number) => {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
};
