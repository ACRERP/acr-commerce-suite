import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  TrendingUp,
  Users,
  Package,
  DollarSign,
} from "lucide-react";

const reportBgColorClasses: Record<string, string> = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  warning: "bg-warning/10",
  success: "bg-success/10",
};

const reportTextColorClasses: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
  success: "text-success",
};

const reports = [
  {
    title: "Relatório de Vendas",
    desc: "Análise detalhada das vendas por período",
    icon: TrendingUp,
    color: "primary",
  },
  {
    title: "Relatório de Clientes",
    desc: "Comportamento e segmentação de clientes",
    icon: Users,
    color: "accent",
  },
  {
    title: "Relatório de Estoque",
    desc: "Posição de estoque e movimentação",
    icon: Package,
    color: "warning",
  },
  {
    title: "Relatório Financeiro",
    desc: "DRE, balanço e fluxo de caixa",
    icon: DollarSign,
    color: "success",
  },
];

const Relatorios = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Análises e indicadores do seu negócio
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Criar Relatório
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, index) => (
            <div
              key={report.title}
              className="stat-card hover:border-primary/30 cursor-pointer transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${reportBgColorClasses[report.color]}`}>
                  <report.icon className={`w-6 h-6 ${reportTextColorClasses[report.color]}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.desc}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title">Indicadores de Desempenho</h3>
            <select className="px-3 py-1.5 rounded-lg bg-secondary text-sm border-0 focus:ring-2 focus:ring-primary/30">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
              <option>Este mês</option>
              <option>Este ano</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Taxa de Conversão", value: "24.8%", trend: "+2.4%" },
              { label: "Margem Média", value: "32.5%", trend: "+1.2%" },
              { label: "Giro de Estoque", value: "4.2x", trend: "-0.3x" },
              { label: "NPS Score", value: "72", trend: "+5" },
            ].map((kpi, index) => (
              <div
                key={kpi.label}
                className="p-4 rounded-lg bg-secondary/30 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                <p className={`text-xs mt-1 ${kpi.trend.startsWith("+") ? "text-success" : "text-destructive"}`}>
                  {kpi.trend} vs período anterior
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Relatorios;
