import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "Jan", vendas: 12400, meta: 10000 },
  { name: "Fev", vendas: 15200, meta: 12000 },
  { name: "Mar", vendas: 18100, meta: 14000 },
  { name: "Abr", vendas: 16800, meta: 15000 },
  { name: "Mai", vendas: 21500, meta: 16000 },
  { name: "Jun", vendas: 24200, meta: 18000 },
  { name: "Jul", vendas: 22800, meta: 20000 },
];

export function SalesChart() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-title">Desempenho de Vendas</h3>
          <p className="text-sm text-muted-foreground">
            Comparativo vendas vs meta
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Vendas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Meta</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
              tickFormatter={(value) => `R$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 11%)",
                border: "none",
                borderRadius: "8px",
                color: "hsl(210, 40%, 96%)",
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
            />
            <Area
              type="monotone"
              dataKey="meta"
              stroke="hsl(174, 72%, 40%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMeta)"
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="hsl(217, 91%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVendas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
