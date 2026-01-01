import { supabase } from '@/lib/supabase';

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  reaches?: number; // Calculated or stored
  conversion?: number; // Calculated or stored
  budget: number;
}

export const marketingService = {
  async getCampaigns() {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform or mock calculated fields if they don't exist in DB yet
    // For now we map DB fields to UI interface
    return data?.map(c => ({
        ...c,
        reaches: 0, // Placeholder until tracking is implemented
        conversion: 0 // Placeholder until tracking is implemented
    })) as Campaign[];
  },

  async getStats() {
      // Example parallel fetch
      const { data: campaigns } = await supabase.from('marketing_campaigns').select('status');
      
      return {
          active: campaigns?.filter(c => c.status === 'active').length || 0,
          total: campaigns?.length || 0
      };
  }
};
