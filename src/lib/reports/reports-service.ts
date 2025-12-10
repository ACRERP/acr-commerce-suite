/**
 * Serviço de Relatórios e Exportação
 * 
 * Fornece métodos para gerar e exportar relatórios em diversos formatos
 */

import { supabase } from '@/lib/supabaseClient';

export interface SalesDetailedReport {
  sale_id: string;
  created_at: string;
  data_venda: string;
  total: number;
  subtotal: number;
  discount_value: number;
  delivery_fee: number;
  status: string;
  sale_type: string;
  client_name: string;
  client_cpf_cnpj: string;
  client_phone: string;
  cash_register_id: string;
  payment_methods: string;
  total_items: number;
  total_quantity: number;
}

export interface ProductsSoldReport {
  product_id: string;
  product_name: string;
  product_code: string;
  barcode: string;
  category_name: string;
  data_venda: string;
  quantidade_vendida: number;
  valor_total: number;
  preco_medio: number;
  numero_vendas: number;
  clientes_unicos: number;
}

export interface InventoryReport {
  id: string;
  name: string;
  code: string;
  barcode: string;
  category_name: string;
  stock_quantity: number;
  min_stock: number;
  cost_price: number;
  sale_price: number;
  margem_lucro: number;
  margem_percentual: number;
  valor_estoque_custo: number;
  valor_estoque_venda: number;
  status_estoque: string;
  ultima_atualizacao: string;
}

export interface FinancialReport {
  tipo: 'Receber' | 'Pagar';
  id: string;
  description: string;
  amount_total: number;
  amount_paid: number;
  amount_remaining: number;
  due_date: string;
  status: string;
  cliente_fornecedor: string;
  created_at: string;
  status_descricao: string;
}

export interface SalesPeriodReport {
  periodo: string;
  total_vendas: number;
  valor_total: number;
  ticket_medio: number;
  total_descontos: number;
  total_frete: number;
}

export interface ClientsReport {
  client_id: string;
  client_name: string;
  client_cpf_cnpj: string;
  client_phone: string;
  total_compras: number;
  valor_total: number;
  ticket_medio: number;
  ultima_compra: string;
  dias_desde_ultima_compra: number;
}

export interface CashFlowReport {
  data: string;
  tipo: string;
  descricao: string;
  entrada: number;
  saida: number;
  saldo_dia: number;
}

export class ReportsService {
  /**
   * Relatório de vendas detalhado
   */
  async getSalesDetailed(
    startDate?: string,
    endDate?: string
  ): Promise<SalesDetailedReport[]> {
    let query = supabase.from('vw_report_sales_detailed').select('*');

    if (startDate) {
      query = query.gte('data_venda', startDate);
    }
    if (endDate) {
      query = query.lte('data_venda', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar relatório de vendas:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Relatório de produtos vendidos
   */
  async getProductsSold(
    startDate?: string,
    endDate?: string
  ): Promise<ProductsSoldReport[]> {
    let query = supabase.from('vw_report_products_sold').select('*');

    if (startDate) {
      query = query.gte('data_venda', startDate);
    }
    if (endDate) {
      query = query.lte('data_venda', endDate);
    }

    const { data, error } = await query.order('quantidade_vendida', { ascending: false });

    if (error) {
      console.error('Erro ao buscar relatório de produtos:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Relatório de estoque
   */
  async getInventory(): Promise<InventoryReport[]> {
    const { data, error } = await supabase
      .from('vw_report_inventory')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar relatório de estoque:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Relatório financeiro
   */
  async getFinancial(
    tipo?: 'Receber' | 'Pagar',
    status?: string
  ): Promise<FinancialReport[]> {
    let query = supabase.from('vw_report_financial').select('*');

    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('due_date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar relatório financeiro:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Relatório de vendas por período
   */
  async getSalesPeriod(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<SalesPeriodReport[]> {
    const { data, error } = await supabase.rpc('fn_report_sales_period', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_group_by: groupBy,
    });

    if (error) {
      console.error('Erro ao buscar relatório de vendas por período:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Relatório de clientes
   */
  async getClients(startDate?: string, endDate?: string): Promise<ClientsReport[]> {
    const { data, error } = await supabase.rpc('fn_report_clients', {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      console.error('Erro ao buscar relatório de clientes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Relatório de fluxo de caixa
   */
  async getCashFlow(startDate: string, endDate: string): Promise<CashFlowReport[]> {
    const { data, error } = await supabase.rpc('fn_report_cash_flow', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Erro ao buscar relatório de fluxo de caixa:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Exportar para CSV
   */
  exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('Nenhum dado para exportar');
      return;
    }

    // Obter cabeçalhos
    const headers = Object.keys(data[0]);

    // Criar linhas CSV
    const csvContent = [
      headers.join(','), // Cabeçalho
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escapar vírgulas e aspas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',')
      ),
    ].join('\n');

    // Criar blob e download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  /**
   * Exportar para Excel (formato CSV compatível)
   */
  exportToExcel(data: any[], filename: string): void {
    // Por enquanto, usa CSV que é compatível com Excel
    // Para formato .xlsx real, seria necessário biblioteca como xlsx
    this.exportToCSV(data, filename);
  }

  /**
   * Imprimir relatório
   */
  printReport(title: string, data: any[]): void {
    if (!data || data.length === 0) {
      console.warn('Nenhum dado para imprimir');
      return;
    }

    // Criar HTML para impressão
    const headers = Object.keys(data[0]);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }
}

// Exportar instância única
export const reportsService = new ReportsService();
