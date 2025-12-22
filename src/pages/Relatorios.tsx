import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesChartData } from '@/services/dashboard-service';
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Download,
  Calendar,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Dados estáticos para gráficos secundários (por enquanto)
const categoryData = [
  { name: 'Eletrônicos', value: 400 },
  { name: 'Acessórios', value: 300 },
  { name: 'Serviços', value: 300 },
  { name: 'Outros', value: 200 },
];

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

const detailedReports = [
  {
    title: "Vendas Detalhadas",
    description: "Exportação completa de todas as vendas do período com metadados.",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    type: "XLSX"
  },
  {
    title: "Análise de Churn",
    description: "Relatório de clientes inativos e taxas de cancelamento.",
    icon: Users,
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    type: "PDF"
  },
  {
    title: "Giro de Estoque",
    description: "Produtos com maior e menor saída, curva ABC.",
    icon: Package,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    type: "CSV"
  },
  {
    title: "DRE Gerencial",
    description: "Demonstrativo de resultado do exercício completo.",
    icon: DollarSign,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    type: "PDF"
  }
];

const Relatorios = () => {
  const [period, setPeriod] = useState('30');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: () => getDashboardStats(Number(period))
  });

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['sales-chart', period],
    queryFn: () => getSalesChartData(Number(period))
  });

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Central de Inteligência
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Insights estratégicos e análise de performance
            </p>
          </div>

          <div className="flex gap-3 items-center bg-white dark:bg-neutral-800 p-1.5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] border-0 h-10 rounded-lg focus:ring-0">
                <Calendar className="w-4 h-4 mr-2 text-neutral-500" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Este Ano (YTD)</SelectItem>
              </SelectContent>
            </Select>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <Filter className="w-4 h-4 text-neutral-500" />
            </Button>
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <Printer className="w-4 h-4 text-neutral-500" />
            </Button>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium p-6 hover-lift border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start mb-2">
              <p className="text-neutral-500 font-medium text-sm">Receita Total</p>
              {stats && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stats.revenue_growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stats.revenue_growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(stats.revenue_growth)}%
                </span>
              )}
            </div>
            {loadingStats ? (
              <Skeleton className="h-9 w-32 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold text-neutral-800 dark:text-white mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.revenue || 0)}
              </h3>
            )}
            <p className="text-xs text-neutral-400">no período selecionado</p>
          </div>

          <div className="card-premium p-6 hover-lift border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start mb-2">
              <p className="text-neutral-500 font-medium text-sm">Novos Clientes</p>
            </div>
            {loadingStats ? (
              <Skeleton className="h-9 w-24 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold text-neutral-800 dark:text-white mb-1">{stats?.new_customers || 0}</h3>
            )}
            <p className="text-xs text-neutral-400">clientes cadastrados</p>
          </div>

          <div className="card-premium p-6 hover-lift border-l-4 border-l-orange-500">
            <div className="flex justify-between items-start mb-2">
              <p className="text-neutral-500 font-medium text-sm">Ticket Médio</p>
            </div>
            {loadingStats ? (
              <Skeleton className="h-9 w-32 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold text-neutral-800 dark:text-white mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.avg_ticket || 0)}
              </h3>
            )}
            <p className="text-xs text-neutral-400">por venda realizada</p>
          </div>

          <div className="card-premium p-6 hover-lift border-l-4 border-l-green-500">
            <div className="flex justify-between items-start mb-2">
              <p className="text-neutral-500 font-medium text-sm">Lucro Estimado</p>
              <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                30% Margem
              </span>
            </div>
            {loadingStats ? (
              <Skeleton className="h-9 w-32 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold text-neutral-800 dark:text-white mb-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((stats?.revenue || 0) * 0.3)}
              </h3>
            )}
            <p className="text-xs text-neutral-400">Margem operacional aprox.</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Performance de Vendas</h3>
                <p className="text-sm text-neutral-500">Receita bruta diária</p>
              </div>
            </div>
            <div className="h-[350px] w-full">
              {loadingChart ? (
                <div className="h-full w-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-neutral-300" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373' }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#171717' }}
                      formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" name="Vendas" />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Secondary Chart */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Mix de Receita</h3>
                <p className="text-sm text-neutral-500">Distribuição por categoria (Simulado)</p>
              </div>
            </div>
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Report Download Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Relatórios Disponíveis</h3>
              <p className="text-neutral-500">Selecione um módulo para exportar dados detalhados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {detailedReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <div key={index} className="card-premium p-6 hover-lift group cursor-pointer border border-transparent hover:border-primary-100 dark:hover:border-primary-900/50">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-neutral-900 dark:text-white">{report.title}</h4>
                    <span className="text-[10px] font-bold px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-500">{report.type}</span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-6 line-clamp-2">
                    {report.description}
                  </p>
                  <Button variant="outline" className="w-full justify-between group-hover:bg-primary-50 group-hover:text-primary-700 dark:group-hover:bg-neutral-800 group-hover:border-primary-200 transition-colors">
                    Baixar Arquivo
                    <Download className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Relatorios;
