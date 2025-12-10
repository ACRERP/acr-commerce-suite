import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboardService } from '@/lib/dashboard/dashboard-service';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Queries
    const { data: salesToday, isLoading: loadingSalesToday, refetch: refetchSalesToday } = useQuery({
        queryKey: ['dashboard', 'sales-today'],
        queryFn: () => dashboardService.getSalesToday(),
        refetchInterval: autoRefresh ? 30000 : false,
    });

    const { data: salesByDay, isLoading: loadingSalesByDay } = useQuery({
        queryKey: ['dashboard', 'sales-by-day', 30],
        queryFn: () => dashboardService.getSalesByDay(30),
    });

    const { data: salesByPayment, isLoading: loadingSalesByPayment } = useQuery({
        queryKey: ['dashboard', 'sales-by-payment', period],
        queryFn: () => {
            const today = new Date();
            let startDate = new Date(today);

            if (period === 'week') {
                startDate.setDate(today.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(today.getMonth() - 1);
            }

            return dashboardService.getSalesByPaymentMethod(
                startDate.toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
            );
        },
    });

    const { data: topProducts, isLoading: loadingTopProducts } = useQuery({
        queryKey: ['dashboard', 'top-products', period],
        queryFn: () => {
            const today = new Date();
            let startDate = new Date(today);

            if (period === 'week') {
                startDate.setDate(today.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(today.getMonth() - 1);
            }

            return dashboardService.getTopProducts(
                10,
                startDate.toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
            );
        },
    });

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
                    <p className="text-muted-foreground">
                        Visão geral do seu negócio em tempo real
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchSalesToday()}
                        disabled={loadingSalesToday}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingSalesToday ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                    </Button>
                </div>
            </div>

            {/* Filtro de Período */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="today">Hoje</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                </TabsList>

                <TabsContent value={period} className="space-y-6 mt-6">
                    {/* Cards de Métricas Simples */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    R$ {salesToday?.valor_total?.toFixed(2) || '0,00'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {salesToday?.total_vendas || 0} vendas realizadas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    R$ {salesToday?.ticket_medio?.toFixed(2) || '0,00'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Valor médio por venda
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {salesToday?.clientes_atendidos || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Clientes atendidos hoje
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Delivery vs Balcão</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {salesToday?.vendas_delivery || 0} / {salesToday?.vendas_balcao || 0}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Delivery / Balcão
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráficos */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Vendas por Dia */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vendas por Dia</CardTitle>
                                <CardDescription>Últimos 30 dias</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingSalesByDay ? (
                                    <div className="h-[300px] flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={salesByDay || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="data"
                                                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value: any) => `R$ ${value.toFixed(2)}`}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="valor_total"
                                                stroke="#8884d8"
                                                name="Valor Total"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Vendas por Forma de Pagamento */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Formas de Pagamento</CardTitle>
                                <CardDescription>Distribuição por método</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingSalesByPayment ? (
                                    <div className="h-[300px] flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={salesByPayment || []}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ payment_method, percentual }) => `${payment_method}: ${percentual}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="valor_total"
                                            >
                                                {(salesByPayment || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Produtos Mais Vendidos */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Produtos Mais Vendidos</CardTitle>
                                <CardDescription>Top 10 produtos do período</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingTopProducts ? (
                                    <div className="h-[300px] flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={topProducts || []} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" />
                                            <YAxis
                                                dataKey="product_name"
                                                type="category"
                                                width={200}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip formatter={(value: any) => value.toFixed(2)} />
                                            <Legend />
                                            <Bar dataKey="quantidade_vendida" fill="#82ca9d" name="Quantidade" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
