import { supabase } from '@/lib/supabase';

export interface ComplianceDocument {
  id: string;
  title: string;
  type: string;
  issue_date: string;
  expiry_date: string;
  status: 'valid' | 'expired' | 'renewing' | 'warning';
  file_url?: string;
}

export interface Inspection {
    id: string;
    inspector_name: string;
    inspection_date: string;
    status: 'passed' | 'failed' | 'conditional';
    notes: string;
}

export const complianceService = {
  async getDocuments() {
    // For specific modules (like SNGPC), we might want to filter, but for now getting all
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .order('expiry_date', { ascending: true }); // Expiring first

    if (error) throw error;
    
    // Add computed status logic if needed, or rely on DB status
    return data as ComplianceDocument[];
  },

  async getRecentInspections() {
      const { data, error } = await supabase
      .from('compliance_inspections')
      .select('*')
      .order('inspection_date', { ascending: false })
      .limit(5);

      if (error) throw error;
      return data as Inspection[];
  },

  async getRiskSummary() {
      // Mocked simulation of risk calculation based on real data counts
      // In a real scenario this would be a complex query
      const { count: docsCount } = await supabase.from('compliance_documents').select('*', { count: 'exact', head: true });
      const { count: expiredCount } = await supabase.from('compliance_documents').select('*', { count: 'exact', head: true }).eq('status', 'expired');

      return {
          regularScore: expiredCount === 0 ? 100 : Math.max(0, 100 - (expiredCount || 0) * 10),
          expiringItems: expiredCount || 0,
          pendingDocs: 0 // Placeholder
      };
  }
};
