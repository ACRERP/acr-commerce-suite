/**
 * Serviço de Dashboard
 * 
 * Fornece dados para indicadores gerenciais em tempo real
 */

import { supabase } from '@/lib/supabaseClient';

export interface DashboardSalesToday {
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  clientes_atendidos: number;
  vendas_delivery: number;
  vendas_balcao: number;
}

export interface DashboardSalesMonth {
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  clientes_atendidos: number;
  total_descontos: number;
  total_frete: number;
}

export interface StockAlert {
  id: string;
  name: string;
  code: string;
  barcode: string;
  stock_quantity: number;
  min_stock: number;
  sale_price: number;
  category_name: string;
  alert_level: 'out_of_stock' | 'low_stock' | 'ok';
}

export interface DeliveryStatus {
  status: string;
  quantidade: number;
  valor_total: number;
}

export interface SalesByDay {
  data: string;
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
}

export interface SalesByPaymentMethod {
  payment_method: string;
  quantidade: number;
  valor_total: number;
  percentual: number;
}

export interface SalesByHour {
  hora: number;
  total_vendas: number;
  valor_total: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  product_code: string;
  quantidade_vendida: number;
  valor_total: number;
  numero_vendas: number;
}

export interface PeriodComparison {
  periodo_atual: number;
  periodo_anterior: number;
  diferenca: number;
  percentual_crescimento: number;
}

export interface FinancialSummary {
  contas_receber_pendente: number;
  contas_receber_vencidas: number;
  contas_pagar_pendente: number;
  contas_pagar_vencidas: number;
  saldo_caixas_abertos: number;
  valor_estoque: number;
}

export class DashboardService {
  /**
   * Buscar vendas de hoje
   */
  async getSalesToday(): Promise<DashboardSalesToday | null> {
    const { data, error } = await supabase
      .from('vw_dashboard_sales_today')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar vendas de hoje:', error);
      return null;
    }

    return data;
  }

  /**
   * Buscar vendas do mês
   */
  async getSalesMonth(): Promise<DashboardSalesMonth | null> {
    const { data, error } = await supabase
      .from('vw_dashboard_sales_month')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar vendas do mês:', error);
      return null;
    }

    return data;
  }

  /**
   * Buscar alertas de estoque
   */
  async getStockAlerts(): Promise<StockAlert[]> {
    const { data, error } = await supabase
      .from('vw_dashboard_stock_alerts')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Erro ao buscar alertas de estoque:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar status de deliveries
   */
  async getDeliveryStatus(): Promise<DeliveryStatus[]> {
    const { data, error } = await supabase
      .from('vw_dashboard_delivery_status')
      .select('*');

    if (error) {
      console.error('Erro ao buscar status de deliveries:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar vendas por dia
   */
  async getSalesByDay(days: number = 30): Promise<SalesByDay[]> {
    const { data, error } = await supabase.rpc('fn_get_sales_by_day', {
      p_days: days,
    });

    if (error) {
      console.error('Erro ao buscar vendas por dia:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar vendas por forma de pagamento
   */
  async getSalesByPaymentMethod(
    startDate?: string,
    endDate?: string
  ): Promise<SalesByPaymentMethod[]> {
    const { data, error } = await supabase.rpc('fn_get_sales_by_payment_method', {
      p_start_date: startDate || new Date().toISOString().split('T')[0],
      p_end_date: endDate || new Date().toISOString().split('T')[0],
    });

    if (error) {
      console.error('Erro ao buscar vendas por forma de pagamento:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar vendas por hora (hoje)
   */
  async getSalesByHour(): Promise<SalesByHour[]> {
    const { data, error } = await supabase.rpc('fn_get_sales_by_hour');

    if (error) {
      console.error('Erro ao buscar vendas por hora:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar produtos mais vendidos
   */
  async getTopProducts(
    limit: number = 10,
    startDate?: string,
    endDate?: string
  ): Promise<TopProduct[]> {
    const { data, error } = await supabase.rpc('fn_get_top_products', {
      p_limit: limit,
      p_start_date: startDate || new Date().toISOString().split('T')[0],
      p_end_date: endDate || new Date().toISOString().split('T')[0],
    });

    if (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar ticket médio
   */
  async getAverageTicket(period: 'today' | 'week' | 'month' = 'today'): Promise<number> {
    const { data, error } = await supabase.rpc('fn_get_average_ticket', {
      p_period: period,
    });

    if (error) {
      console.error('Erro ao buscar ticket médio:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Buscar comparação com período anterior
   */
  async getPeriodComparison(
    period: 'today' | 'week' | 'month' = 'today'
  ): Promise<PeriodComparison | null> {
    const { data, error } = await supabase.rpc('fn_get_period_comparison', {
      p_period: period,
    });

    if (error) {
      console.error('Erro ao buscar comparação de período:', error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Buscar resumo financeiro
   */
  async getFinancialSummary(): Promise<FinancialSummary | null> {
    const { data, error } = await supabase
      .from('vw_dashboard_financial_summary')
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      return null;
    }

    return data;
  }
}

// Exportar instância única
export const dashboardService = new DashboardService();
