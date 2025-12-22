import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export const backupService = {
  /**
   * Fetches all relevant system data and triggers a JSON file download.
   */
  async exportSystemData() {
    try {
      // 1. Fetch data concurrently
      const [
        { data: clients },
        { data: products },
        { data: services },
        { data: serviceOrders },
        { data: transactions },
        { data: suppliers }
      ] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('products').select('*'),
        supabase.from('services').select('*'),
        supabase.from('service_orders').select('*, os_parts(*), os_services(*), os_accessories(*)'),
        supabase.from('transactions').select('*'),
        supabase.from('suppliers').select('*')
      ]);

      // 2. Structure the backup
      const backupData = {
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          exported_by: 'System Admin', // Could be dynamic
          system: 'ACR ERP'
        },
        data: {
          clients: clients || [],
          products: products || [],
          services: services || [],
          service_orders: serviceOrders || [],
          transactions: transactions || [],
          suppliers: suppliers || []
        }
      };

      // 3. Create Blob and Download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      a.download = `backup_acr_erp_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error('Falha ao gerar backup dos dados.');
    }
  }
};
