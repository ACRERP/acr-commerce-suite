import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { TopProducts } from "@/components/dashboard/TopProducts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
} from "lucide-react";

const actionBgColorClasses: Record<string, string> = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
};

const actionTextColorClasses: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
};

const vendedoresPerformance = [
  { name: "Carlos", vendas: 42, ticketMedio: "R$ 240", meta: "118%" },
  { name: "Ana", vendas: 36, ticketMedio: "R$ 275", meta: "105%" },
  { name: "Bruno", vendas: 28, ticketMedio: "R$ 210", meta: "92%" },
];

const motoboysPerformance = [
  { name: "João", entregas: 24, emRota: 3, atrasos: "2%" },
  { name: "Pedro", entregas: 18, emRota: 2, atrasos: "4%" },
  { name: "Marcos", entregas: 15, emRota: 1, atrasos: "1%" },
];

// Funções de busca de dados
async function fetchDashboardData() {
  const { data: stats, error: statsError } = await supabase.rpc('get_dashboard_stats');
  if (statsError) throw new Error(statsError.message);

  const { data: sales, error: salesError } = await supabase.rpc('get_sales_over_time');
  if (salesError) throw new Error(salesError.message);

  const { data: activities, error: activitiesError } = await supabase.rpc('get_recent_activities');
  if (activitiesError) throw new Error(activitiesError.message);

  const { data: topProducts, error: topProductsError } = await supabase.rpc('get_top_products');
  if (topProductsError) throw new Error(topProductsError.message);

  return { stats, sales, activities, topProducts };
}

const Index = () => {
    const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo de volta! Aqui está o resumo do seu negócio.
          </p>
        </div>

        {/* Stats Grid */}
                {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Faturamento Total"
                                value={`R$ ${dashboardData?.stats?.total_sales_amount.toFixed(2)}`}
                icon={DollarSign}
                iconColor="success"
              />
              <StatCard
                title="Total de Pedidos"
                                value={dashboardData?.stats?.total_orders}
                icon={ShoppingCart}
                iconColor="primary"
              />
              <StatCard
                title="Total de Clientes"
                                value={dashboardData?.stats?.total_clients}
                icon={Users}
                iconColor="accent"
              />
              <StatCard
                title="Estoque Baixo"
                                value={dashboardData?.stats?.products_low_stock}
                icon={AlertTriangle}
                iconColor="destructive"
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
                        <SalesChart data={dashboardData?.sales} isLoading={isLoading} />
          </div>
          <div>
                        <RecentActivities data={dashboardData?.activities} isLoading={isLoading} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopProducts data={dashboardData?.topProducts} isLoading={isLoading} />
          
          {/* Quick Actions */}
          <div className="stat-card">
            <h3 className="section-title mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Nova Venda", icon: ShoppingCart, color: "primary" },
                { label: "Cadastrar Produto", icon: Package, color: "accent" },
                { label: "Novo Cliente", icon: Users, color: "success" },
                { label: "Emitir NF-e", icon: DollarSign, color: "warning" },
              ].map((action, index) => (
                <button
                  key={action.label}
                  className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 group animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg group-hover:scale-110 transition-transform ${actionBgColorClasses[action.color]}`}
                  >
                    <action.icon className={`w-5 h-5 ${actionTextColorClasses[action.color]}`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Team Performance & Operational Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stat-card">
            <h3 className="section-title mb-4">Desempenho da Equipe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Vendedores</p>
                <div className="space-y-2">
                  {vendedoresPerformance.map((seller, index) => (
                    <div
                      key={seller.name}
                      className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div>
                        <p className="font-medium">{seller.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {seller.vendas} vendas • Ticket {seller.ticketMedio}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-success">{seller.meta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Motoboys</p>
                <div className="space-y-2">
                  {motoboysPerformance.map((driver, index) => (
                    <div
                      key={driver.name}
                      className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-sm animate-fade-in"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {driver.entregas} entregas • {driver.emRota} em rota
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-warning">{driver.atrasos} atrasos</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-title mb-4">Alertas Operacionais</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span>OS em aberto</span>
                </div>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  <span>Entregas pendentes</span>
                </div>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-destructive" />
                  <span>Produtos com estoque crítico</span>
                </div>
                <span className="font-semibold">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
