import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";

// Mock data para gráficos (substituir por dados reais)
const salesData = [
  { name: "Seg", vendas: 4200, meta: 5000 },
  { name: "Ter", vendas: 5800, meta: 5000 },
  { name: "Qua", vendas: 4500, meta: 5000 },
  { name: "Qui", vendas: 6200, meta: 5000 },
  { name: "Sex", vendas: 7100, meta: 5000 },
  { name: "Sáb", vendas: 8900, meta: 5000 },
  { name: "Dom", vendas: 5200, meta: 5000 },
];

const revenueData = [
  { month: "Jan", receita: 45000, despesa: 32000 },
  { month: "Fev", receita: 52000, despesa: 35000 },
  { month: "Mar", receita: 48000, despesa: 33000 },
  { month: "Abr", receita: 61000, despesa: 38000 },
  { month: "Mai", receita: 55000, despesa: 36000 },
  { month: "Jun", receita: 67000, despesa: 40000 },
];

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  trend: "up" | "down";
  color: "primary" | "success" | "warning" | "error";
}

const KPICard = ({ title, value, change, icon: Icon, trend, color }: KPICardProps) => {
  const colorClasses = {
    primary: "bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400",
    success: "bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-400",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-400",
    error: "bg-error-50 text-error-600 dark:bg-error-950 dark:text-error-400",
  };

  const badgeClasses = {
    up: "badge-success",
    down: "badge-error",
  };

  return (
    <div className="card-premium hover-lift group">
      {/* Decorative Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colorClasses[color]} rounded-bl-full -mr-8 -mt-8 opacity-20 transition-transform duration-500 group-hover:scale-110`} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge className={badgeClasses[trend]}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(change)}%
          </Badge>
        </div>

        {/* Content */}
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            {value}
          </h3>
        </div>

        {/* Footer Hint */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Últimas 24 horas
          </p>
        </div>
      </div>
    </div>
  );
};

export function SystemOverviewPage() {
  // Fetch real data
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [salesRes, clientsRes, productsRes] = await Promise.all([
        supabase.from("sales").select("total_amount", { count: "exact" }),
        supabase.from("customers").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
      ]);

      const totalSales = salesRes.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      return {
        totalSales,
        salesCount: salesRes.count || 0,
        clientsCount: clientsRes.count || 0,
        productsCount: productsRes.count || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container-premium py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-premium animate-pulse">
                <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const kpis: KPICardProps[] = [
    {
      title: "Receita Total",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.totalSales || 0),
      change: 12.5,
      icon: DollarSign,
      trend: "up",
      color: "success",
    },
    {
      title: "Vendas Hoje",
      value: stats?.salesCount.toString() || "0",
      change: 8.2,
      icon: ShoppingCart,
      trend: "up",
      color: "primary",
    },
    {
      title: "Clientes Ativos",
      value: stats?.clientsCount.toString() || "0",
      change: 3.1,
      icon: Users,
      trend: "up",
      color: "warning",
    },
    {
      title: "Produtos Cadastrados",
      value: stats?.productsCount.toString() || "0",
      change: 2.4,
      icon: Package,
      trend: "down",
      color: "error",
    },
  ];

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">

        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Dashboard Executivo
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Visão geral do seu negócio em tempo real
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-sm font-semibold text-success-700 dark:text-success-400">
                Sistema Operacional
              </span>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <div
              key={kpi.title}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in-up"
            >
              <KPICard {...kpi} />
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Sales Chart */}
          <div className="card-premium">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                Vendas da Semana
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Performance diária vs meta
              </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-neutral-500)"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis
                  stroke="var(--color-neutral-500)"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-neutral-50)',
                    border: '1px solid var(--color-neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
                <Bar dataKey="vendas" fill="hsl(231, 77%, 60%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="meta" fill="hsl(220, 12%, 85%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="card-premium">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                Receita vs Despesas
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Últimos 6 meses
              </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--color-neutral-500)"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis
                  stroke="var(--color-neutral-500)"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-neutral-50)',
                    border: '1px solid var(--color-neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(142, 71%, 45%)', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="despesa"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(0, 84%, 60%)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="card-premium bg-warning-50 dark:bg-warning-950 border-warning-200 dark:border-warning-800">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-warning-100 dark:bg-warning-900">
              <AlertCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-warning-900 dark:text-warning-100 mb-1">
                Atenção: Produtos com Estoque Baixo
              </h4>
              <p className="text-sm text-warning-700 dark:text-warning-300 mb-3">
                5 produtos estão abaixo do estoque mínimo e precisam de reposição urgente.
              </p>
              <button className="btn-primary text-sm px-4 py-2">
                Ver Produtos
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
