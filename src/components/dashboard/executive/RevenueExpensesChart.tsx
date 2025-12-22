import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RevenueExpensesChartProps {
    data: { name: string; revenue: number; expenses: number }[];
}

export function RevenueExpensesChart({ data }: RevenueExpensesChartProps) {
    return (
        <Card className="shadow-sm border-neutral-100">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-neutral-800">Receita vs Despesas</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#888', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend iconType="circle" />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                name="Receita"
                                stroke="#22c55e"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                name="Despesas"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
