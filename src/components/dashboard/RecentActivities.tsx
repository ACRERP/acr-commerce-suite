import { ShoppingCart, UserPlus, Package, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "sale",
    message: "Venda #1234 realizada",
    detail: "R$ 1.250,00 - João Silva",
    time: "Há 5 min",
    icon: ShoppingCart,
    color: "success",
  },
  {
    id: 2,
    type: "customer",
    message: "Novo cliente cadastrado",
    detail: "Maria Santos - CPF: ***.***.789-00",
    time: "Há 15 min",
    icon: UserPlus,
    color: "primary",
  },
  {
    id: 3,
    type: "stock",
    message: "Estoque baixo",
    detail: "Produto SKU-789 - Apenas 3 unidades",
    time: "Há 30 min",
    icon: Package,
    color: "warning",
  },
  {
    id: 4,
    type: "fiscal",
    message: "NF-e emitida",
    detail: "Nota #5678 - Cliente: Tech Corp",
    time: "Há 1h",
    icon: FileText,
    color: "accent",
  },
  {
    id: 5,
    type: "alert",
    message: "Conta a pagar vencendo",
    detail: "Fornecedor ABC - R$ 3.500,00",
    time: "Há 2h",
    icon: AlertCircle,
    color: "destructive",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function RecentActivities() {
  return (
    <div className="stat-card">
      <h3 className="section-title mb-4">Atividades Recentes</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0",
                colorClasses[activity.color as keyof typeof colorClasses]
              )}
            >
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activity.message}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.detail}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 pt-4 border-t border-border text-sm text-primary hover:text-primary/80 transition-colors font-medium">
        Ver todas as atividades
      </button>
    </div>
  );
}
