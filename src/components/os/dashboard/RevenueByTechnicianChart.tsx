import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps } from "recharts";

interface TechnicianData {
    name: string;
    value: number; // Revenue
    count: number; // OS Count
}

interface RevenueByTechnicianChartProps {
    data: TechnicianData[];
}

export function RevenueByTechnicianChart({ data }: RevenueByTechnicianChartProps) {
    // Sort by revenue descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg shadow-lg">
                    <p className="font-bold text-sm mb-1">{label}</p>
                    <p className="text-sm text-green-600 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value || 0)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                        {payload[0].payload.count} OSs concluídas
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Faturamento por Técnico (Concluídas/Entregues)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {sortedData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={sortedData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                                <XAxis
                                    type="number"
                                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                                    stroke="#888888"
                                    fontSize={12}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {sortedData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? '#22c55e' : '#3b82f6'} // Top 1 Green, others Blue
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Sem dados de faturamento para exibir
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
