import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";

const mockOrders = [
  { id: "OS-001", client: "João Silva", device: "iPhone 13", status: "em_andamento", date: "2024-01-15", tech: "Carlos" },
  { id: "OS-002", client: "Maria Santos", device: "MacBook Pro", status: "aguardando", date: "2024-01-14", tech: "Ana" },
  { id: "OS-003", client: "Pedro Costa", device: "Samsung S23", status: "concluido", date: "2024-01-13", tech: "Carlos" },
  { id: "OS-004", client: "Ana Oliveira", device: "iPad Air", status: "em_andamento", date: "2024-01-12", tech: "Bruno" },
];

const statusConfig = {
  em_andamento: { label: "Em Andamento", icon: Clock, color: "warning" },
  aguardando: { label: "Aguardando", icon: AlertCircle, color: "primary" },
  concluido: { label: "Concluído", icon: CheckCircle, color: "success" },
};

const OrdensServico = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Ordens de Serviço</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os serviços em andamento
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova OS
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Em Andamento", value: 8, color: "warning" },
            { label: "Aguardando", value: 5, color: "primary" },
            { label: "Concluídas Hoje", value: 12, color: "success" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="metric-label">{stat.label}</p>
              <p className={`metric-value text-${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="stat-card">
          <h3 className="section-title mb-4">Ordens Recentes</h3>
          <div className="space-y-3">
            {mockOrders.map((order, index) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id} - {order.client}</p>
                      <p className="text-sm text-muted-foreground">{order.device} • Técnico: {order.tech}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{order.date}</span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-${status.color}/10 text-${status.color} text-xs font-medium`}>
                      <status.icon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrdensServico;
