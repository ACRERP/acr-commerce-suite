import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  revenue: number;
  revenue_growth: number;
  new_customers: number;
  avg_ticket: number;
}

export interface SalesChartItem {
  date: string;
  revenue: number;
  canceled: number;
}

export interface FiscalSummary {
  issued_invoices: number;
  estimated_taxes: number;
}

export interface FiscalNote {
  id: string;
  numero: number;
  serie: string;
  tipo: string;
  valor_total: number;
  status: string;
  data_emissao: string;
  // Campos join (se houver view) ou apenas os da tabela
}

export const getDashboardStats = async (periodDays: number = 30): Promise<DashboardStats> => {
  const { data, error } = await supabase
    .rpc('get_dashboard_stats', { period_days: periodDays });

  if (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data if function doesn't exist yet (dev mode)
    return { revenue: 0, revenue_growth: 0, new_customers: 0, avg_ticket: 0 };
  }
  
  return data;
};

export const getSalesChartData = async (periodDays: number = 30): Promise<SalesChartItem[]> => {
  const { data, error } = await supabase
    .rpc('get_sales_chart_data', { period_days: periodDays });

  if (error) {
    console.error('Error fetching sales chart:', error);
    return [];
  }
  
  return data;
};

export const getFiscalSummary = async (): Promise<FiscalSummary> => {
  const { data, error } = await supabase
    .rpc('get_fiscal_summary');

  if (error) {
    console.error('Error fetching fiscal summary:', error);
    return { issued_invoices: 0, estimated_taxes: 0 };
  }

  return data;
};

export const getFiscalNotes = async (): Promise<FiscalNote[]> => {
  // Mock implementation for now as seen in other functions falling back
  return [];
};

