import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { TopProducts } from "@/components/dashboard/TopProducts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
} from "lucide-react";

const Index = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Vendas Hoje"
            value="R$ 12.450"
            change={12.5}
            changeLabel="vs ontem"
            icon={DollarSign}
            iconColor="success"
          />
          <StatCard
            title="Pedidos"
            value="48"
            change={8.2}
            changeLabel="vs ontem"
            icon={ShoppingCart}
            iconColor="primary"
          />
          <StatCard
            title="Clientes Novos"
            value="12"
            change={-3.1}
            changeLabel="vs ontem"
            icon={Users}
            iconColor="accent"
          />
          <StatCard
            title="Ticket Médio"
            value="R$ 259"
            change={5.4}
            changeLabel="vs ontem"
            icon={TrendingUp}
            iconColor="warning"
          />
          <StatCard
            title="Produtos Ativos"
            value="1.248"
            icon={Package}
            iconColor="primary"
          />
          <StatCard
            title="Alertas"
            value="5"
            icon={AlertTriangle}
            iconColor="destructive"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <div>
            <RecentActivities />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProducts />
          
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
                    className={`flex items-center justify-center w-10 h-10 rounded-lg bg-${action.color}/10 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className={`w-5 h-5 text-${action.color}`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
