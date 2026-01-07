import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Settings 
} from "lucide-react";

const Index = () => {
  const modules = [
    { icon: LayoutDashboard, title: "Dashboard", description: "Visão geral do sistema", color: "bg-blue-500" },
    { icon: Package, title: "Produtos", description: "Gestão de produtos e estoque", color: "bg-green-500" },
    { icon: Users, title: "Clientes", description: "Cadastro de clientes", color: "bg-purple-500" },
    { icon: DollarSign, title: "Financeiro", description: "Controle financeiro", color: "bg-yellow-500" },
    { icon: ShoppingCart, title: "PDV", description: "Ponto de venda", color: "bg-red-500" },
    { icon: Truck, title: "Delivery", description: "Gestão de entregas", color: "bg-orange-500" },
    { icon: FileText, title: "Ordens de Serviço", description: "Gestão de OS", color: "bg-cyan-500" },
    { icon: Settings, title: "Configurações", description: "Configurar sistema", color: "bg-gray-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Sistema de Gestão</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu sistema de gestão empresarial</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module, index) => (
            <Card key={index} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Resumo do Dia</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">R$ 0,00</div>
                <p className="text-muted-foreground text-sm">Vendas Hoje</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground text-sm">Pedidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground text-sm">Clientes Novos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">0</div>
                <p className="text-muted-foreground text-sm">Entregas Pendentes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
