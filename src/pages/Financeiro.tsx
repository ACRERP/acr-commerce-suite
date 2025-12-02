import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Building,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const cashFlowData = [
  { name: "Seg", entrada: 8500, saida: 4200 },
  { name: "Ter", entrada: 12300, saida: 5800 },
  { name: "Qua", entrada: 9800, saida: 3500 },
  { name: "Qui", entrada: 15600, saida: 7200 },
  { name: "Sex", entrada: 18200, saida: 6100 },
  { name: "Sáb", entrada: 22500, saida: 4800 },
  { name: "Dom", entrada: 5200, saida: 1200 },
];

const financeiroStatBgColorClasses: Record<string, string> = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  destructive: "bg-destructive/10",
  warning: "bg-warning/10",
};

const financeiroStatTextColorClasses: Record<string, string> = {
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
};

const transactions = [
  { id: 1, desc: "Venda #1234", type: "entrada", value: 1250, date: "Hoje, 14:32" },
  { id: 2, desc: "Fornecedor ABC", type: "saida", value: 3500, date: "Hoje, 11:20" },
  { id: 3, desc: "Venda #1233", type: "entrada", value: 890, date: "Hoje, 10:15" },
  { id: 4, desc: "Aluguel", type: "saida", value: 5000, date: "Ontem, 09:00" },
  { id: 5, desc: "Venda #1232", type: "entrada", value: 2340, date: "Ontem, 16:45" },
];

const Financeiro = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Controle seu fluxo de caixa e finanças
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <ArrowUpRight className="w-4 h-4 text-success" />
              Nova Entrada
            </Button>
            <Button variant="outline" className="gap-2">
              <ArrowDownRight className="w-4 h-4 text-destructive" />
              Nova Saída
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Saldo Atual", value: "R$ 45.680", icon: Wallet, color: "primary", change: null },
            { label: "Entradas (Mês)", value: "R$ 128.450", icon: TrendingUp, color: "success", change: 12.5 },
            { label: "Saídas (Mês)", value: "R$ 82.770", icon: TrendingDown, color: "destructive", change: -3.2 },
            { label: "A Receber", value: "R$ 23.400", icon: CreditCard, color: "warning", change: null },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="metric-label">{stat.label}</p>
                  <p className={`metric-value ${stat.color === "success" ? "text-success" : stat.color === "destructive" ? "text-destructive" : ""}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${financeiroStatBgColorClasses[stat.color]}`}>
                  <stat.icon className={`w-5 h-5 ${financeiroStatTextColorClasses[stat.color]}`} />
                </div>
              </div>
              {stat.change !== null && (
                <div className="flex items-center gap-1 mt-2">
                  {stat.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-sm font-medium ${stat.change > 0 ? "text-success" : "text-destructive"}`}>
                    {stat.change > 0 ? "+" : ""}{stat.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 stat-card">
            <h3 className="section-title mb-4">Fluxo de Caixa - Última Semana</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222, 47%, 11%)", border: "none", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                    formatter={(value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
                  />
                  <Area type="monotone" dataKey="entrada" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fillOpacity={1} fill="url(#colorEntrada)" />
                  <Area type="monotone" dataKey="saida" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fillOpacity={1} fill="url(#colorSaida)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="stat-card">
            <h3 className="section-title mb-4">Transações Recentes</h3>
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "entrada" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {tx.type === "entrada" ? (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.desc}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.type === "entrada" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "entrada" ? "+" : "-"}
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Financeiro;
