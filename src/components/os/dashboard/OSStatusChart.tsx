import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceOrder } from "@/lib/os/os-service";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface OSStatusChartProps {
    data: ServiceOrder[];
}

export function OSStatusChart({ data }: OSStatusChartProps) {
    // Group by status
    const statusGroups = data.reduce((acc, os) => {
        const status = os.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Format for Recharts
    const chartData = [
        { name: 'Aberta', value: statusGroups['aberta'] || 0, color: '#f5f5f5', labelColor: '#333' }, // Neutral
        { name: 'Em Andamento', value: statusGroups['em_andamento'] || 0, color: '#3b82f6' }, // Blue
        { name: 'Aguard. Peça', value: statusGroups['aguardando_peca'] || 0, color: '#eab308' }, // Yellow
        { name: 'Concluída', value: statusGroups['concluida'] || 0, color: '#22c55e' }, // Green
        { name: 'Entregue', value: statusGroups['entregue'] || 0, color: '#a855f7' }, // Purple
        { name: 'Cancelada', value: statusGroups['cancelada'] || 0, color: '#ef4444' }, // Red
    ].filter(item => item.value > 0);

    const formatLabel = (value: string) => {
        return value.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [value, 'Quantidade']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend
                                    formatter={(value) => <span className="text-xs font-medium text-neutral-600">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Sem dados para exibir
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
