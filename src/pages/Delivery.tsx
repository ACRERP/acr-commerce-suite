import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Clock, CheckCircle, User, Package } from "lucide-react";

const deliveries = [
  { id: "ENT-001", client: "João Silva", address: "Rua A, 123 - Centro", status: "em_rota", driver: "Carlos", time: "14:30" },
  { id: "ENT-002", client: "Maria Santos", address: "Av. B, 456 - Jardim", status: "aguardando", driver: "Bruno", time: "15:00" },
  { id: "ENT-003", client: "Pedro Costa", address: "Rua C, 789 - Vila Nova", status: "entregue", driver: "Carlos", time: "13:45" },
  { id: "ENT-004", client: "Ana Oliveira", address: "Av. D, 321 - Centro", status: "em_rota", driver: "Ana", time: "14:45" },
];

const statusConfig = {
  em_rota: { label: "Em Rota", icon: Truck, color: "primary" },
  aguardando: { label: "Aguardando", icon: Clock, color: "warning" },
  entregue: { label: "Entregue", icon: CheckCircle, color: "success" },
};

const drivers = [
  { name: "Carlos", deliveries: 8, status: "ativo" },
  { name: "Bruno", deliveries: 5, status: "ativo" },
  { name: "Ana", deliveries: 6, status: "ativo" },
  { name: "Pedro", deliveries: 0, status: "inativo" },
];

const deliveryStatTextColorClasses: Record<string, string> = {
  primary: "text-primary",
  warning: "text-warning",
  success: "text-success",
  accent: "text-accent",
};

const deliveryStatusBgColorClasses: Record<string, string> = {
  primary: "bg-primary/10",
  warning: "bg-warning/10",
  success: "bg-success/10",
};

const deliveryStatusTextColorClasses: Record<string, string> = {
  primary: "text-primary",
  warning: "text-warning",
  success: "text-success",
};

const Delivery = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Delivery</h1>
            <p className="text-muted-foreground mt-1">
              Gestão de entregas e entregadores
            </p>
          </div>
          <Button className="gap-2">
            <Truck className="w-4 h-4" />
            Nova Entrega
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Entregas Hoje", value: "24", color: "primary" },
            { label: "Em Rota", value: "8", color: "warning" },
            { label: "Concluídas", value: "16", color: "success" },
            { label: "Entregadores Ativos", value: "4", color: "accent" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="metric-label">{stat.label}</p>
              <p className={`metric-value ${deliveryStatTextColorClasses[stat.color]}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 stat-card">
            <h3 className="section-title mb-4">Entregas em Andamento</h3>
            <div className="space-y-3">
              {deliveries.map((delivery, index) => {
                const status = statusConfig[delivery.status as keyof typeof statusConfig];
                return (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${deliveryStatusBgColorClasses[status.color]}`}>
                        <status.icon className={`w-5 h-5 ${deliveryStatusTextColorClasses[status.color]}`} />
                      </div>
                      <div>
                        <p className="font-medium">{delivery.id} - {delivery.client}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {delivery.address}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{delivery.driver}</p>
                        <p className="text-xs text-muted-foreground">{delivery.time}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${deliveryStatusBgColorClasses[status.color]} ${deliveryStatusTextColorClasses[status.color]}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-title mb-4">Entregadores</h3>
            <div className="space-y-3">
              {drivers.map((driver, index) => (
                <div
                  key={driver.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">{driver.deliveries} entregas hoje</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${driver.status === "ativo" ? "bg-success" : "bg-muted-foreground"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Delivery;
