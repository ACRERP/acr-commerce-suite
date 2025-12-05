import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Download,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileDown,
  Filter
} from 'lucide-react';
import { useDREReport, useReportGenerator, useFinancialTransactions } from '@/hooks/useFinancialReports';
import { useReportExport } from '@/lib/reportExport';
import { ReportFilters } from './ReportFilters';
import type { DREReport as DREReportType } from '@/hooks/useFinancialReports';

export function DREReport() {
  const { data: report, isLoading, error } = useDREReport();
  const { generateReport, isGenerating } = useReportGenerator();
  const { exportPDF, exportExcel, exportCSV } = useReportExport();
  const { transactions } = useFinancialTransactions();
  const [period, setPeriod] = useState<'current' | 'last' | 'custom'>('current');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    periodStart: null as Date | null,
    periodEnd: null as Date | null,
    selectedCategories: [] as string[],
    includePending: true,
    includeCancelled: false,
    transactionType: 'all' as 'all' | 'revenue' | 'expense',
    minAmount: null as number | null,
    maxAmount: null as number | null,
    searchTerm: ''
  });

  const handleGenerateReport = () => {
    const now = new Date();
    let periodStart: string;
    let periodEnd: string;

    switch (period) {
      case 'current':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      default:
        // Custom period would need date pickers
        return;
    }

    generateReport({
      periodStart,
      periodEnd,
      includePending: false,
      groupByCategory: true,
    });
  };

  const handleExportPDF = () => {
    if (report) {
      const filename = `DRE_${new Date(report.period.start).toLocaleDateString('pt-BR').replace(/\//g, '-')}_a_${new Date(report.period.end).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      exportPDF(report, filename);
    }
  };

  const handleExportExcel = () => {
    if (report) {
      const filename = `DRE_${new Date(report.period.start).toLocaleDateString('pt-BR').replace(/\//g, '-')}_a_${new Date(report.period.end).toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
      exportExcel(report, filename);
    }
  };

  const handleExportCSV = () => {
    if (report) {
      const filename = `DRE_${new Date(report.period.start).toLocaleDateString('pt-BR').replace(/\//g, '-')}_a_${new Date(report.period.end).toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
      exportCSV(report, filename);
    }
  };

  // Calculate filtered report using useMemo
  const filteredReport = useMemo(() => {
    if (transactions.length === 0) return null;

    // Filter transactions based on filters
    const filteredTransactions = transactions.filter(transaction => {
      // Period filter
      if (filters.periodStart && new Date(transaction.date) < filters.periodStart) {
        return false;
      }
      if (filters.periodEnd && new Date(transaction.date) > filters.periodEnd) {
        return false;
      }

      // Status filter
      if (!filters.includePending && transaction.status === 'pending') {
        return false;
      }
      if (!filters.includeCancelled && transaction.status === 'cancelled') {
        return false;
      }

      // Transaction type filter
      if (filters.transactionType !== 'all' && transaction.type !== filters.transactionType) {
        return false;
      }

      // Category filter
      if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(transaction.category_id)) {
        return false;
      }

      // Amount filter
      if (filters.minAmount !== null && transaction.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== null && transaction.amount > filters.maxAmount) {
        return false;
      }

      // Search filter
      if (filters.searchTerm.trim() !== '') {
        const searchLower = filters.searchTerm.toLowerCase();
        if (
          !transaction.description.toLowerCase().includes(searchLower) &&
          !transaction.notes?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });

    // Calculate revenue
    const revenueTransactions = filteredTransactions.filter(t => t.type === 'revenue' && t.status === 'paid');
    const grossRevenue = revenueTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Group revenue by category
    const revenueByCategory = revenueTransactions.reduce((acc, t) => {
      const categoryId = t.category_id;
      const categoryName = t.category?.name || 'Sem Categoria';
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName,
          amount: 0,
        };
      }
      acc[categoryId].amount += t.amount;
      return acc;
    }, {} as Record<string, { categoryId: string; categoryName: string; amount: number }>);

    // Calculate expenses
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'paid');
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by category
    const expensesByCategory = expenseTransactions.reduce((acc, t) => {
      const categoryId = t.category_id;
      const categoryName = t.category?.name || 'Sem Categoria';
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName,
          amount: 0,
        };
      }
      acc[categoryId].amount += t.amount;
      return acc;
    }, {} as Record<string, { categoryId: string; categoryName: string; amount: number }>);

    // Calculate deductions (simplified - could include taxes, returns, etc.)
    const deductions = grossRevenue * 0.05; // Example: 5% deductions
    const netRevenue = grossRevenue - deductions;

    // Calculate profits
    const grossProfit = grossRevenue - totalExpenses;
    const operatingProfit = netRevenue - totalExpenses * 0.8; // Simplified operating expenses
    const netProfit = operatingProfit - deductions;

    // Calculate percentages
    const revenueByCategoryWithPercentage = Object.values(revenueByCategory).map(item => ({
      ...item,
      percentage: grossRevenue > 0 ? (item.amount / grossRevenue) * 100 : 0,
    }));

    const expensesByCategoryWithPercentage = Object.values(expensesByCategory).map(item => ({
      ...item,
      percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
    }));

    // Determine period
    const periodStart = filters.periodStart || new Date(Math.min(...filteredTransactions.map(t => new Date(t.date).getTime())));
    const periodEnd = filters.periodEnd || new Date(Math.max(...filteredTransactions.map(t => new Date(t.date).getTime())));

    return {
      period: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
      revenue: {
        gross: grossRevenue,
        deductions,
        net: netRevenue,
        byCategory: revenueByCategoryWithPercentage,
      },
      expenses: {
        operating: totalExpenses * 0.8, // Simplified
        nonOperating: totalExpenses * 0.2, // Simplified
        total: totalExpenses,
        byCategory: expensesByCategoryWithPercentage,
      },
      profit: {
        gross: grossProfit,
        operating: operatingProfit,
        net: netProfit,
        margin: {
          gross: grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0,
          operating: netRevenue > 0 ? (operatingProfit / netRevenue) * 100 : 0,
          net: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
        },
      },
      summary: {
        totalRevenue: grossRevenue,
        totalExpenses,
        netProfit,
        profitMargin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
        transactionCount: filteredTransactions.length,
      },
    };
  }, [transactions, filters]);

  const displayReport = filteredReport || report;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !displayReport) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Não há transações financeiras para gerar o relatório DRE.
          </p>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApply={() => setShowFilters(false)}
          onReset={() => {
            setFilters({
              periodStart: null,
              periodEnd: null,
              selectedCategories: [],
              includePending: true,
              includeCancelled: false,
              transactionType: 'all',
              minAmount: null,
              maxAmount: null,
              searchTerm: ''
            });
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Demonstrativo de Resultados (DRE)</h2>
          <p className="text-gray-600">
            Período: {new Date(displayReport.period.start).toLocaleDateString('pt-BR')} a{' '}
            {new Date(displayReport.period.end).toLocaleDateString('pt-BR')}
          </p>
          {filteredReport && (
            <Badge variant="secondary" className="mt-1">
              Filtrado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          <Select value={period} onValueChange={(value: 'current' | 'last' | 'custom') => setPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="last">Mês Anterior</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => displayReport && exportPDF(displayReport)}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => displayReport && exportExcel(displayReport)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar como Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => displayReport && exportCSV(displayReport)}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(displayReport.revenue.gross)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Despesas Totais</p>
                <p className="text-2xl font-bold">{formatCurrency(displayReport.expenses.total)}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                <p className="text-2xl font-bold">{formatCurrency(displayReport.profit.net)}</p>
              </div>
              <div className={`p-2 rounded-full ${
                displayReport.profit.net >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {displayReport.profit.net >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Margem de Lucro</p>
                <p className="text-2xl font-bold">{formatPercentage(displayReport.profit.margin.net)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <PieChart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

// ...
      {/* Detailed Report */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Lucros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Lucro Bruto</span>
                  <span className={`font-semibold ${report.profit.gross >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.profit.gross)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lucro Operacional</span>
                  <span className={`font-semibold ${report.profit.operating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.profit.operating)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium">Lucro Líquido</span>
                  <span className={`font-bold text-lg ${report.profit.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.profit.net)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Profit Margins */}
            <Card>
              <CardHeader>
                <CardTitle>Margens de Lucro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Margem Bruta</span>
                    <span className={`font-semibold ${report.profit.margin.gross >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(report.profit.margin.gross)}
                    </span>
                  </div>
                  <Progress value={Math.abs(report.profit.margin.gross)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Margem Operacional</span>
                    <span className={`font-semibold ${report.profit.margin.operating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(report.profit.margin.operating)}
                    </span>
                  </div>
                  <Progress value={Math.abs(report.profit.margin.operating)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Margem Líquida</span>
                    <span className={`font-semibold ${report.profit.margin.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(report.profit.margin.net)}
                    </span>
                  </div>
                  <Progress value={Math.abs(report.profit.margin.net)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Receitas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Receita Bruta</span>
                  <span className="font-semibold text-green-600">{formatCurrency(report.revenue.gross)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deduções</span>
                  <span className="font-semibold text-red-600">{formatCurrency(report.revenue.deductions)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium">Receita Líquida</span>
                  <span className="font-bold text-green-600">{formatCurrency(report.revenue.net)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.revenue.byCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{category.categoryName}</span>
                          <span className="text-sm">{formatCurrency(category.amount)}</span>
                        </div>
                        <Progress value={category.percentage} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">{formatPercentage(category.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Despesas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Despesas Operacionais</span>
                  <span className="font-semibold text-red-600">{formatCurrency(report.expenses.operating)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Despesas Não Operacionais</span>
                  <span className="font-semibold text-red-600">{formatCurrency(report.expenses.nonOperating)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium">Total de Despesas</span>
                  <span className="font-bold text-red-600">{formatCurrency(report.expenses.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.expenses.byCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{category.categoryName}</span>
                          <span className="text-sm">{formatCurrency(category.amount)}</span>
                        </div>
                        <Progress value={category.percentage} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">{formatPercentage(category.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Chave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Número de Transações</span>
                  <Badge variant="outline">{report.summary.transactionCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ticket Médio</span>
                  <span className="font-semibold">
                    {formatCurrency(report.summary.totalRevenue / Math.max(report.summary.transactionCount, 1))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ratio Despesa/Receita</span>
                  <span className="font-semibold">
                    {formatPercentage((report.summary.totalExpenses / Math.max(report.summary.totalRevenue, 1)) * 100)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {report.summary.netProfit >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span>Saudade Financeira</span>
                  <Badge variant={report.summary.netProfit >= 0 ? 'default' : 'destructive'}>
                    {report.summary.netProfit >= 0 ? 'Positiva' : 'Negativa'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>Eficiência Operacional</span>
                  <Badge variant="outline">
                    {report.profit.margin.operating > 20 ? 'Alta' : 
                     report.profit.margin.operating > 10 ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
