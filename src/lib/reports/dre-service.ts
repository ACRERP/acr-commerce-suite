import { supabase } from '@/lib/supabaseClient';

export interface DREReportItem {
  month: string;
  gross_revenue: number;
  cogs: number; // Custo Mercadoria Vendida
  gross_profit: number;
  operational_expenses: number;
  net_profit: number;
  gross_margin_percent: number;
  net_margin_percent: number;
}

export const dreService = {
  async getDREReport(): Promise<DREReportItem[]> {
    const { data, error } = await supabase
      .from('vw_dre_report')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching DRE report:', error);
      throw error;
    }

    return data || [];
  },

  async exportDREToPDF(): Promise<void> {
    // Placeholder - In a real app we'd generate a PDF here
    console.log("Exporting DRE to PDF...");
    alert("Funcionalidade de Exportação PDF em desenvolvimento.");
  }
};
