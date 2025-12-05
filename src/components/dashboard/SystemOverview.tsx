import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  CreditCard,
  PiggyBank,
  FileText,
  BarChart3,
  ShoppingCart,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function SystemOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState('7dias');

  // Mock data for demonstration - in real app would use hooks
  const metrics = {
    totalRevenue: 45678.90,
    revenueGrowth: 12.5,
    totalSales: 234,
    salesGrowth: 8.3,
    totalProducts: 1567,
    lowStockProducts: 23,
    totalCustomers: 892,
    customerGrowth: 15.2,
    totalExpenses: 12345.67,
    expenseGrowth: -5.8,
    netProfit: 33333.23,
    profitMargin: 73.0
  };

  const recentActivities = [
    { type: 'sale', description: 'Venda #1234 - João Silva', amount: 156.78, time: '10:30' },
    { type: 'expense', description: 'Pagamento de aluguel', amount: 2500.00, time: '09:15' },
    { type: 'product', description: 'Novo produto cadastrado', amount: null, time: '08:45' },
    { type: 'customer', description: 'Novo cliente Maria Santos', amount: null, time: '08:30' },
  ];

  const topProducts = [
    { name: 'Notebook Dell i5', sales: 45, revenue: 67500 },
    { name: 'Mouse Wireless', sales: 128, revenue: 3840 },
    { name: 'Teclado Mecânico', sales: 67, revenue: 13400 },
    { name: 'Monitor 24"', sales: 34, revenue: 10200 },
  ];

  const budgetStatus = [
    { category: 'Marketing', budget: 5000, spent: 3200, percentage: 64 },
    { category: 'Funcionários', budget: 15000, spent: 15000, percentage: 100 },
    { category: 'Aluguel', budget: 3000, spent: 2500, percentage: 83 },
    { category: 'Suprimentos', budget: 2000, spent: 800, percentage: 40 },
  ];

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visão Geral do Sistema</h1>
          <p className="text-gray-600">
            ACR Commerce Suite - Sistema ERP Completo
          </p>
        </div>
        <div className="flex gap-2">
          <label htmlFor="period-select" className="sr-only">Período</label>
          <select 
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="7dias">Últimos 7 dias</option>
            <option value="30dias">Últimos 30 dias</option>
            <option value="90dias">Últimos 90 dias</option>
          </select>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {format(metrics.totalRevenue, 'R$ ##,##0.00', { locale: ptBR })}
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(metrics.revenueGrowth)}
                  <span className={`text-sm ml-1 ${getTrendColor(metrics.revenueGrowth)}`}>
                    {Math.abs(metrics.revenueGrowth)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalSales}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(metrics.salesGrowth)}
                  <span className={`text-sm ml-1 ${getTrendColor(metrics.salesGrowth)}`}>
                    {Math.abs(metrics.salesGrowth)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(metrics.customerGrowth)}
                  <span className={`text-sm ml-1 ${getTrendColor(metrics.customerGrowth)}`}>
                    {Math.abs(metrics.customerGrowth)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
                <p className="text-2xl font-bold text-gray-900">
                  {format(metrics.netProfit, 'R$ ##,##0.00', { locale: ptBR })}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-green-600">
                    {metrics.profitMargin.toFixed(1)}% margem
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'sale' ? 'bg-green-100' :
                          activity.type === 'expense' ? 'bg-red-100' :
                          activity.type === 'product' ? 'bg-blue-100' :
                          'bg-purple-100'
                        }`}>
                          {activity.type === 'sale' && <ShoppingCart className="w-4 h-4 text-green-600" />}
                          {activity.type === 'expense' && <CreditCard className="w-4 h-4 text-red-600" />}
                          {activity.type === 'product' && <Package className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'customer' && <Users className="w-4 h-4 text-purple-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.description}</p>
                          <p className="text-xs text-gray-600">{activity.time}</p>
                        </div>
                      </div>
                      {activity.amount && (
                        <span className="font-semibold text-sm">
                          {format(activity.amount, 'R$ ##,##0.00', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Produtos Mais Vendidos
                  <Link to="/produtos">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Todos
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.sales} vendas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {format(product.revenue, 'R$ ##,##0.00', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(product.revenue / product.sales, 'R$ ##,##0.00', { locale: ptBR })} médio
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {budgetStatus.map((budget, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{budget.category}</span>
                      <span className="text-xs text-gray-600">
                        {format(budget.spent, 'R$ ##,##0.00', { locale: ptBR })} / 
                        {format(budget.budget, 'R$ ##,##0.00', { locale: ptBR })}
                      </span>
                    </div>
                    <Progress 
                      value={budget.percentage} 
                      className={`h-2 ${
                        budget.percentage >= 90 ? 'bg-red-100' :
                        budget.percentage >= 70 ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{budget.percentage}% utilizado</span>
                      {budget.percentage >= 90 && (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  PDV Market
                  <Link to="/pdv-market">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Venda
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">Ponto de Venda</h3>
                  <p className="text-gray-600 mb-4">Sistema completo de vendas com múltiplos pagamentos</p>
                  <Link to="/pdv-market">
                    <Button>Acessar PDV</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos de Venda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Pagamentos Múltiplos</p>
                      <p className="text-xs text-gray-600">Pix, cartão, dinheiro, fiado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Crédito Cliente</p>
                      <p className="text-xs text-gray-600">Sistema de fiado integrado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm">Comissões</p>
                      <p className="text-xs text-gray-600">Cálculo automático</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Gerenciamento de Produtos
                <Link to="/produtos">
                  <Button>
                    <Package className="w-4 h-4 mr-2" />
                    Gerenciar Produtos
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{metrics.totalProducts}</div>
                  <p className="text-gray-600">Total de Produtos</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{metrics.lowStockProducts}</div>
                  <p className="text-gray-600">Estoque Baixo</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">8</div>
                  <p className="text-gray-600">Categorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Receita Total</span>
                    <span className="font-semibold text-green-600">
                      {format(metrics.totalRevenue, 'R$ ##,##0.00', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Despesas Totais</span>
                    <span className="font-semibold text-red-600">
                      {format(metrics.totalExpenses, 'R$ ##,##0.00', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Lucro Líquido</span>
                      <span className="font-bold text-lg text-green-600">
                        {format(metrics.netProfit, 'R$ ##,##0.00', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos Financeiros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                    <PiggyBank className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Contas Bancárias</p>
                      <p className="text-xs text-gray-600">Reconciliação automática</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">Fluxo de Caixa</p>
                      <p className="text-xs text-gray-600">Acompanhamento diário</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm">Relatórios</p>
                      <p className="text-xs text-gray-600">P&L, DRE, Balanço</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  Relatório de Vendas
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  Análise Financeira
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Package className="w-6 h-6 mb-2" />
                  Estoque e Produtos
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  Clientes
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="w-6 h-6 mb-2" />
                  Comissões
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <PiggyBank className="w-6 h-6 mb-2" />
                  Fluxo de Caixa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
