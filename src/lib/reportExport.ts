import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DREReport } from '@/hooks/useFinancialReports';

// AutoTable type for jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class ReportExporter {
  static exportToPDF(report: DREReport, filename?: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text('Demonstrativo de Resultados (DRE)', pageWidth / 2, 20, { align: 'center' });
    
    // Period
    doc.setFontSize(12);
    doc.text(
      `Período: ${new Date(report.period.start).toLocaleDateString('pt-BR')} a ${new Date(report.period.end).toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      30,
      { align: 'center' }
    );
    
    // Summary Cards
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, 50);
    
    const summaryData = [
      ['Receita Total', this.formatCurrency(report.summary.totalRevenue)],
      ['Despesas Totais', this.formatCurrency(report.summary.totalExpenses)],
      ['Lucro Líquido', this.formatCurrency(report.summary.netProfit)],
      ['Margem de Lucro', `${report.summary.profitMargin.toFixed(1)}%`],
    ];
    
    doc.autoTable({
      head: [['Métrica', 'Valor']],
      body: summaryData,
      startY: 60,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Revenue Details
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.setFontSize(14);
    doc.text('Detalhes das Receitas', 14, finalY + 10);
    
    const revenueData = report.revenue.byCategory.map(category => [
      category.categoryName,
      this.formatCurrency(category.amount),
      `${category.percentage.toFixed(1)}%`
    ]);
    
    revenueData.push(
      ['Receita Bruta', this.formatCurrency(report.revenue.gross), ''],
      ['Deduções', this.formatCurrency(report.revenue.deductions), ''],
      ['Receita Líquida', this.formatCurrency(report.revenue.net), '']
    );
    
    doc.autoTable({
      head: [['Categoria', 'Valor', '%']],
      body: revenueData,
      startY: finalY + 20,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] },
    });
    
    // Expense Details
    const expenseFinalY = (doc as any).lastAutoTable.finalY || finalY + 20;
    doc.setFontSize(14);
    doc.text('Detalhes das Despesas', 14, expenseFinalY + 10);
    
    const expenseData = report.expenses.byCategory.map(category => [
      category.categoryName,
      this.formatCurrency(category.amount),
      `${category.percentage.toFixed(1)}%`
    ]);
    
    expenseData.push(
      ['Despesas Operacionais', this.formatCurrency(report.expenses.operating), ''],
      ['Despesas Não Operacionais', this.formatCurrency(report.expenses.nonOperating), ''],
      ['Total de Despesas', this.formatCurrency(report.expenses.total), '']
    );
    
    doc.autoTable({
      head: [['Categoria', 'Valor', '%']],
      body: expenseData,
      startY: expenseFinalY + 20,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [239, 68, 68] },
    });
    
    // Profit Analysis
    const profitFinalY = (doc as any).lastAutoTable.finalY || expenseFinalY + 20;
    doc.setFontSize(14);
    doc.text('Análise de Lucros', 14, profitFinalY + 10);
    
    const profitData = [
      ['Lucro Bruto', this.formatCurrency(report.profit.gross), `${report.profit.margin.gross.toFixed(1)}%`],
      ['Lucro Operacional', this.formatCurrency(report.profit.operating), `${report.profit.margin.operating.toFixed(1)}%`],
      ['Lucro Líquido', this.formatCurrency(report.profit.net), `${report.profit.margin.net.toFixed(1)}%`],
    ];
    
    doc.autoTable({
      head: [['Tipo', 'Valor', 'Margem']],
      body: profitData,
      startY: profitFinalY + 20,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [168, 85, 247] },
    });
    
    // Footer
    const footerY = (doc as any).lastAutoTable.finalY || profitFinalY + 20;
    doc.setFontSize(10);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      pageWidth / 2,
      footerY + 20,
      { align: 'center' }
    );
    
    // Save the PDF
    doc.save(filename || `DRE_${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  static exportToExcel(report: DREReport, filename?: string): void {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Demonstrativo de Resultados (DRE)'],
      [`Período: ${new Date(report.period.start).toLocaleDateString('pt-BR')} a ${new Date(report.period.end).toLocaleDateString('pt-BR')}`],
      [],
      ['Resumo Financeiro'],
      ['Métrica', 'Valor'],
      ['Receita Total', report.summary.totalRevenue],
      ['Despesas Totais', report.summary.totalExpenses],
      ['Lucro Líquido', report.summary.netProfit],
      ['Margem de Lucro', `${report.summary.profitMargin.toFixed(1)}%`],
      ['Número de Transações', report.summary.transactionCount],
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
    
    // Revenue Sheet
    const revenueData = [
      ['Detalhes das Receitas'],
      [],
      ['Categoria', 'Valor', 'Percentual'],
      ...report.revenue.byCategory.map(category => [
        category.categoryName,
        category.amount,
        category.percentage
      ]),
      [],
      ['Resumo de Receitas'],
      ['Receita Bruta', report.revenue.gross],
      ['Deduções', report.revenue.deductions],
      ['Receita Líquida', report.revenue.net],
    ];
    
    const revenueWs = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, revenueWs, 'Receitas');
    
    // Expense Sheet
    const expenseData = [
      ['Detalhes das Despesas'],
      [],
      ['Categoria', 'Valor', 'Percentual'],
      ...report.expenses.byCategory.map(category => [
        category.categoryName,
        category.amount,
        category.percentage
      ]),
      [],
      ['Resumo de Despesas'],
      ['Despesas Operacionais', report.expenses.operating],
      ['Despesas Não Operacionais', report.expenses.nonOperating],
      ['Total de Despesas', report.expenses.total],
    ];
    
    const expenseWs = XLSX.utils.aoa_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(wb, expenseWs, 'Despesas');
    
    // Profit Sheet
    const profitData = [
      ['Análise de Lucros'],
      [],
      ['Tipo', 'Valor', 'Margem'],
      ['Lucro Bruto', report.profit.gross, report.profit.margin.gross],
      ['Lucro Operacional', report.profit.operating, report.profit.margin.operating],
      ['Lucro Líquido', report.profit.net, report.profit.margin.net],
    ];
    
    const profitWs = XLSX.utils.aoa_to_sheet(profitData);
    XLSX.utils.book_append_sheet(wb, profitWs, 'Lucros');
    
    // Analysis Sheet
    const analysisData = [
      ['Análise Detalhada'],
      [],
      ['Indicadores de Performance'],
      ['Métrica', 'Valor'],
      ['Ticket Médio', report.summary.totalRevenue / Math.max(report.summary.transactionCount, 1)],
      ['Ratio Despesa/Receita', `${(report.summary.totalExpenses / Math.max(report.summary.totalRevenue, 1) * 100).toFixed(1)}%`],
      ['Eficiência Operacional', report.profit.margin.operating > 20 ? 'Alta' : report.profit.margin.operating > 10 ? 'Média' : 'Baixa'],
      ['Saúde Financeira', report.summary.netProfit >= 0 ? 'Positiva' : 'Negativa'],
    ];
    
    const analysisWs = XLSX.utils.aoa_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(wb, analysisWs, 'Análise');
    
    // Save the Excel file
    XLSX.writeFile(wb, filename || `DRE_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  
  static exportToCSV(report: DREReport, filename?: string): void {
    // Create CSV data
    const csvData = [
      'Demonstrativo de Resultados (DRE)',
      `Período: ${new Date(report.period.start).toLocaleDateString('pt-BR')} a ${new Date(report.period.end).toLocaleDateString('pt-BR')}`,
      '',
      'Resumo Financeiro',
      'Métrica,Valor',
      `Receita Total,${report.summary.totalRevenue}`,
      `Despesas Totais,${report.summary.totalExpenses}`,
      `Lucro Líquido,${report.summary.netProfit}`,
      `Margem de Lucro,${report.summary.profitMargin.toFixed(1)}%`,
      '',
      'Detalhes das Receitas',
      'Categoria,Valor,Percentual',
      ...report.revenue.byCategory.map(category => 
        `${category.categoryName},${category.amount},${category.percentage.toFixed(1)}%`
      ),
      '',
      'Detalhes das Despesas',
      'Categoria,Valor,Percentual',
      ...report.expenses.byCategory.map(category => 
        `${category.categoryName},${category.amount},${category.percentage.toFixed(1)}%`
      ),
    ];
    
    // Convert to CSV string
    const csvString = csvData.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `DRE_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

// Export utility functions for different report types
export const exportReport = {
  pdf: ReportExporter.exportToPDF,
  excel: ReportExporter.exportToExcel,
  csv: ReportExporter.exportToCSV,
};

// Hook for report export functionality
export const useReportExport = () => {
  const exportPDF = (report: DREReport, filename?: string) => {
    try {
      ReportExporter.exportToPDF(report, filename);
      return { success: true };
    } catch (error) {
      console.error('Error exporting PDF:', error);
      return { success: false, error };
    }
  };
  
  const exportExcel = (report: DREReport, filename?: string) => {
    try {
      ReportExporter.exportToExcel(report, filename);
      return { success: true };
    } catch (error) {
      console.error('Error exporting Excel:', error);
      return { success: false, error };
    }
  };
  
  const exportCSV = (report: DREReport, filename?: string) => {
    try {
      ReportExporter.exportToCSV(report, filename);
      return { success: true };
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return { success: false, error };
    }
  };
  
  return {
    exportPDF,
    exportExcel,
    exportCSV,
  };
};
