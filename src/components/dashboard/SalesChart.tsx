import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesChartProps {
  data: { sale_date: string; total: number }[] | null | undefined;
  isLoading: boolean;
}

const chartConfig = { total: { label: "Vendas", color: "hsl(var(--chart-1))" } };

export function SalesChart({ data, isLoading }: SalesChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vendas nos Últimos 30 Dias</CardTitle>
          <CardDescription>Nenhum dado de venda disponível para o período.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">Sem dados</p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map(item => ({
    date: new Date(item.sale_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: item.total,
  }));

  const totalSales = data.reduce((acc, item) => acc + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas nos Últimos 30 Dias</CardTitle>
        <CardDescription>
          Faturamento total de <span className="font-bold">R$ {totalSales.toFixed(2)}</span> no período.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickFormatter={(value) => `R$${value}`} />
              <Tooltip content={<ChartTooltipContent indicator="line" />} />
              <Line dataKey="total" type="monotone" stroke="var(--color-total)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
