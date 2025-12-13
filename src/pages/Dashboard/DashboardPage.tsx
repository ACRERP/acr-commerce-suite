import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboardService } from '@/lib/dashboard/dashboard-service';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { RefreshCw, Activity, ShoppingBag, DollarSign, Target, Users, TrendingUp } from 'lucide-react';
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

        <div className="container-premium py-8 space-y-8 animate-fade-in-up">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                        Dashboard Gerencial
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Visão geral do seu negócio em tempo real
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="btn-secondary hover-lift"
                        onClick={() => refetchSalesToday()}
                        disabled={loadingSalesToday}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingSalesToday ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        className={autoRefresh ? "btn-primary hover-lift" : "btn-secondary hover-lift"}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                    </Button>
                </div>
            </div>

            {/* Filtro de Período */}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
                <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-6">
                    <TabsTrigger value="today" className="rounded-lg">Hoje</TabsTrigger>
                    <TabsTrigger value="week" className="rounded-lg">Semana</TabsTrigger>
                    <TabsTrigger value="month" className="rounded-lg">Mês</TabsTrigger>
                </TabsList>

                <TabsContent value={period} className="space-y-6 mt-0">
                    {/* Cards de Métricas Premium */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="card-premium hover-lift group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Vendas Hoje</p>
                                    <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                        R$ {salesToday?.valor_total?.toFixed(2) || '0,00'}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>{salesToday?.total_vendas || 0} vendas realizadas</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="card-premium hover-lift group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Ticket Médio</p>
                                    <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                        R$ {salesToday?.ticket_medio?.toFixed(2) || '0,00'}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Valor médio/venda</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Target className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="card-premium hover-lift group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Clientes Atendidos</p>
                                    <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                        {salesToday?.clientes_atendidos || 0}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 font-medium">
                                        <Users className="w-3 h-3" />
                                        <span>Clientes únicos hoje</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="card-premium hover-lift group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Delivery vs Balcão</p>
                                    <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                        {salesToday?.vendas_delivery || 0} <span className="text-lg text-neutral-400 font-normal">/</span> {salesToday?.vendas_balcao || 0}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 font-medium">
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>Canais de Venda</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 transition-transform duration-300 group-hover:scale-110">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Vendas por Dia */}
                        <div className="card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Vendas por Dia</h3>
                                    <p className="text-sm text-neutral-500">Comportamento dos últimos 30 dias</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {loadingSalesByDay ? (
                                    <div className="h-full flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesByDay || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                                            <XAxis
                                                dataKey="data"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#737373', fontSize: 12 }}
                                                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#737373', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Valor Total']}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="valor_total"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Vendas por Forma de Pagamento */}
                        <div className="card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Formas de Pagamento</h3>
                                    <p className="text-sm text-neutral-500">Preferência dos clientes</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {loadingSalesByPayment ? (
                                    <div className="h-full flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={salesByPayment || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="valor_total"
                                            >
                                                {(salesByPayment || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                                formatter={(value: any) => `R$ ${value.toFixed(2)}`}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Produtos Mais Vendidos */}
                        <div className="md:col-span-2 card-premium p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Produtos Mais Vendidos</h3>
                                    <p className="text-sm text-neutral-500">Rank dos top 10 produtos</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {loadingTopProducts ? (
                                    <div className="h-full flex items-center justify-center">
                                        <RefreshCw className="h-8 w-8 animate-spin text-neutral-300" />
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topProducts || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e5e5" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="product_name"
                                                type="category"
                                                width={200}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 13, fill: '#525252' }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f5f5f5' }}
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="quantidade_vendida" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );

}
