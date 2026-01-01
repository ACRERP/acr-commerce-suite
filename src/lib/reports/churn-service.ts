import { supabase } from '@/lib/supabaseClient';

export interface ChurnRiskClient {
  client_id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  last_purchase_date: string;
  days_since_last_purchase: number;
  total_spent: number;
  purchase_count: number;
}

export const churnService = {
  async getChurnRisks(daysInactive: number = 90): Promise<ChurnRiskClient[]> {
    const { data, error } = await supabase
      .rpc('get_churn_risks', { days_inactive: daysInactive });

    if (error) {
      console.error('Error fetching churn risks:', error);
      throw error;
    }

    return data || [];
  }
};
