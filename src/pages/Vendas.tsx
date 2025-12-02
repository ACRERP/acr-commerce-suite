import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, FileText, Target, Percent } from "lucide-react";

const Vendas = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Vendas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas vendas, orçamentos e metas
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Venda
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "PDV", desc: "Ponto de Venda", icon: ShoppingCart, color: "primary" },
            { title: "Orçamentos", desc: "Criar e gerenciar", icon: FileText, color: "accent" },
            { title: "Metas", desc: "Controle de metas", icon: Target, color: "success" },
            { title: "Comissões", desc: "Gestão de comissões", icon: Percent, color: "warning" },
          ].map((item, index) => (
            <button
              key={item.title}
              className="stat-card text-left hover:border-primary/30 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-${item.color}/10 mb-4`}>
                <item.icon className={`w-6 h-6 text-${item.color}`} />
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="stat-card">
          <h3 className="section-title mb-4">Vendas Recentes</h3>
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma venda registrada hoje</p>
            <p className="text-sm mt-1">Comece criando uma nova venda</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Vendas;
