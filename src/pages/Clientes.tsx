import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Mail, Phone } from "lucide-react";

const mockClients = [
  { id: 1, name: "João Silva", email: "joao@email.com", phone: "(11) 99999-0001", purchases: 12, total: 15680 },
  { id: 2, name: "Maria Santos", email: "maria@email.com", phone: "(11) 99999-0002", purchases: 8, total: 9450 },
  { id: 3, name: "Pedro Costa", email: "pedro@email.com", phone: "(11) 99999-0003", purchases: 25, total: 32100 },
  { id: 4, name: "Ana Oliveira", email: "ana@email.com", phone: "(11) 99999-0004", purchases: 5, total: 4200 },
  { id: 5, name: "Carlos Ferreira", email: "carlos@email.com", phone: "(11) 99999-0005", purchases: 18, total: 21350 },
];

const Clientes = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua base de clientes
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Clientes", value: "1.248" },
            { label: "Novos este Mês", value: "45" },
            { label: "Clientes Ativos", value: "892" },
            { label: "Ticket Médio", value: "R$ 259" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="metric-label">{stat.label}</p>
              <p className="metric-value">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar clientes..." className="pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockClients.map((client, index) => (
            <div
              key={client.id}
              className="stat-card hover:border-primary/30 cursor-pointer transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{client.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Compras</p>
                  <p className="font-semibold">{client.purchases}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                  <p className="font-semibold text-success">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(client.total)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Clientes;
