import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface DashboardStats {
  total_sales_amount: number;
  total_orders: number;
  total_clients: number;
  total_products: number;
  products_low_stock: number;
}

export interface SalesOverTime {
  sale_date: string;
  total: number;
}

async function fetchDashboardStats() {
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  if (error) throw error;
  // The RPC returns a JSON object, so we might need to cast or access it directly
  // Based on the SQL: json_build_object returns a JSON object.
  return data as DashboardStats;
}

async function fetchSalesOverTime() {
  const { data, error } = await supabase.rpc('get_sales_over_time', { days: 30 });
  if (error) throw error;
  return data as SalesOverTime[];
}

export function useDashboardMetrics() {
  const stats = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  const salesHistory = useQuery({
    queryKey: ['sales-over-time'],
    queryFn: fetchSalesOverTime,
  });

  return {
    stats: stats.data,
    isLoadingStats: stats.isLoading,
    errorStats: stats.error,
    salesHistory: salesHistory.data,
    isLoadingHistory: salesHistory.isLoading,
  };
}
