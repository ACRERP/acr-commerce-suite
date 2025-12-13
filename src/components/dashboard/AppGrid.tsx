import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ShoppingCart,
    Package,
    Wrench,
    Users,
    DollarSign,
    TrendingUp,
    AlertCircle,
    Truck,
    Calendar,
    ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const quickLinks = [
    { id: "sales", label: "Nova Venda", icon: ShoppingCart, color: "bg-purple-600", path: "/vendas" },
    { id: "os", label: "Nova OS", icon: Wrench, color: "bg-orange-600", path: "/os" },
    { id: "client", label: "Novo Cliente", icon: Users, color: "bg-green-600", path: "/clientes/novo" },
    { id: "product", label: "Novo Produto", icon: Package, color: "bg-blue-600", path: "/produtos/novo" },
];

export function AppGrid() {
    // Buscar métricas consolidadas
    const { data: metrics } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // Vendas
            const { data: sales } = await supabase
                .from('sales')
                .select('total_amount, created_at');

            const salesThisMonth = sales?.filter(s =>
                new Date(s.created_at) >= firstDayOfMonth
            ) || [];
            const totalSalesMonth = salesThisMonth.reduce((sum, s) => sum + (s.total_amount || 0), 0);

            // OS
            const { data: os } = await supabase
                .from('service_orders')
                .select('status, created_at');

            const osOpen = os?.filter(o => o.status !== 'concluida' && o.status !== 'cancelada').length || 0;

            // Clientes
            const { data: clients } = await supabase
                .from('clients')
                .select('id');
            const totalClients = clients?.length || 0;

            // Produtos
            const { data: products } = await supabase
                .from('products')
                .select('stock, min_stock');
            const lowStock = products?.filter(p => p.stock > 0 && p.stock <= (p.min_stock || 5)).length || 0;

            // Entregas
            const { data: deliveries } = await supabase
                .from('deliveries')
                .select('status');
            const deliveriesInProgress = deliveries?.filter(d =>
                d.status === 'aguardando_coleta' || d.status === 'em_transito'
            ).length || 0;

            // Financeiro
            const { data: transactions } = await supabase
                .from('financial_transactions')
                .select('amount, type, status, due_date');

            const overdue = transactions?.filter(t =>
                t.status === 'pendente' && new Date(t.due_date) < today
            ).length || 0;

            return {
                salesMonth: totalSalesMonth,
                osOpen,
                clients: totalClients,
                lowStock,
                deliveries: deliveriesInProgress,
                overdue
            };
        }
    });

    // Dados do gráfico de vendas (últimos 7 dias)
    const { data: salesChart } = useQuery({
        queryKey: ['sales-chart-week'],
        queryFn: async () => {
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i);
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);

                const { data: sales } = await supabase
                    .from('sales')
                    .select('total_amount')
                    .gte('created_at', dayStart.toISOString())
                    .lte('created_at', dayEnd.toISOString());

                const total = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

                data.push({
                    date: format(date, 'dd/MM', { locale: ptBR }),
                    vendas: total
                });
            }
            return data;
        }
    });

    // Dados do gráfico de OS por status (PieChart)
    const { data: osStatusChart } = useQuery({
        queryKey: ['os-status-chart'],
        queryFn: async () => {
            const { data: os } = await supabase
                .from('service_orders')
                .select('status');

            const statusCount: Record<string, number> = {};
            os?.forEach(o => {
                statusCount[o.status] = (statusCount[o.status] || 0) + 1;
            });

            return Object.entries(statusCount).map(([status, count]) => ({
                name: status,
                value: count
            }));
        }
    });

    // Dados do gráfico de Fluxo de Caixa (LineChart - últimos 6 meses)
    const { data: cashFlowChart } = useQuery({
        queryKey: ['cash-flow-chart'],
        queryFn: async () => {
            const data = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                const { data: transactions } = await supabase
                    .from('financial_transactions')
                    .select('amount, type')
                    .gte('created_at', monthStart.toISOString())
                    .lte('created_at', monthEnd.toISOString());

                const receitas = transactions?.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0) || 0;
                const despesas = transactions?.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0) || 0;

                data.push({
                    mes: format(date, 'MMM/yy', { locale: ptBR }),
                    receitas,
                    despesas,
                    saldo: receitas - despesas
                });
            }
            return data;
        }
    });

    // Atividades recentes
    const { data: activities } = useQuery({
        queryKey: ['recent-activities'],
        queryFn: async () => {
            const activities = [];

            // Últimas vendas
            const { data: sales } = await supabase
                .from('sales')
                .select('id, total_amount, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            sales?.forEach(s => {
                activities.push({
                    type: 'sale',
                    icon: ShoppingCart,
                    color: 'text-purple-600',
                    title: 'Nova Venda',
                    description: `Venda #${s.id} - ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.total_amount)}`,
                    time: format(new Date(s.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })
                });
            });

            // Últimas OS
            const { data: os } = await supabase
                .from('service_orders')
                .select('id, status, created_at')
                .order('created_at', { ascending: false })
                .limit(2);

            os?.forEach(o => {
                activities.push({
                    type: 'os',
                    icon: Wrench,
                    color: 'text-orange-600',
                    title: 'Nova OS',
                    description: `OS #${o.id} - ${o.status}`,
                    time: format(new Date(o.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })
                });
            });

            return activities.sort((a, b) =>
                new Date(b.time).getTime() - new Date(a.time).getTime()
            ).slice(0, 5);
        }
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-3 rounded-xl shadow-xl">
                    <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-bold">
                                {typeof entry.value === 'number' && entry.name !== 'OS Open' && entry.name !== 'Clients'
                                    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.value)
                                    : entry.value}
                            </span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header with Welcome Message */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight mb-2">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Visão geral do desempenho do seu negócio
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Sistema Operacional</span>
                </div>
            </div>

            {/* Métricas Principais - Premium Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/10">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-purple-100/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-purple-200/50"></div>
                    <CardContent className="pt-8 pb-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-purple-600/80 dark:text-purple-400 font-semibold uppercase tracking-wider">Vendas do Mês</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">
                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics?.salesMonth || 0)}
                                </h3>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-900 dark:to-orange-900/10">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-orange-100/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-orange-200/50"></div>
                    <CardContent className="pt-8 pb-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-orange-600/80 dark:text-orange-400 font-semibold uppercase tracking-wider">OS Abertas</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">
                                    {metrics?.osOpen || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none bg-gradient-to-br from-white to-green-50/50 dark:from-gray-900 dark:to-green-900/10">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-green-100/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-200/50"></div>
                    <CardContent className="pt-8 pb-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-green-600/80 dark:text-green-400 font-semibold uppercase tracking-wider">Total Clientes</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-4 tracking-tight">
                                    {metrics?.clients || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Metrics Row - Compact */}
                <div className="grid grid-cols-3 gap-4 lg:col-span-3">
                    <Card className="hover:border-yellow-200 transition-colors border-l-4 border-l-yellow-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Estoque Baixo</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{metrics?.lowStock || 0}</p>
                            </div>
                            <Package className="w-5 h-5 text-yellow-500" />
                        </CardContent>
                    </Card>
                    <Card className="hover:border-cyan-200 transition-colors border-l-4 border-l-cyan-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Entregas</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{metrics?.deliveries || 0}</p>
                            </div>
                            <Truck className="w-5 h-5 text-cyan-500" />
                        </CardContent>
                    </Card>
                    <Card className="hover:border-red-200 transition-colors border-l-4 border-l-red-500 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold uppercase">Atrasadas</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{metrics?.overdue || 0}</p>
                            </div>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Charts Section - Enhanced */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-lg border-none ring-1 ring-gray-100 dark:ring-gray-800">
                    <CardHeader className="border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            Performance de Vendas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesChart || []} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                <Bar
                                    dataKey="vendas"
                                    fill="url(#colorVendas)"
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={1500}
                                />
                                <defs>
                                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#9333ea" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#9333ea" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Activity List */}
                <Card className="shadow-lg border-none ring-1 ring-gray-100 dark:ring-gray-800">
                    <CardHeader className="border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Feed de Atividades
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {activities?.map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 group cursor-default">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                                        ${activity.type === 'sale' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}
                                    `}>
                                        <activity.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {activity.title}
                                            </p>
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-500 font-medium">
                                                {activity.time.split('às')[0]}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate font-medium">
                                            {activity.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!activities || activities.length === 0) && (
                                <p className="text-center text-sm text-muted-foreground py-8">Nenhuma atividade recente</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-lg border-none ring-1 ring-gray-100 dark:ring-gray-800">
                    <CardHeader>
                        <CardTitle>OS por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={osStatusChart || []}
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(osStatusChart || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} stroke="" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} /> // Reusing generic tooltip
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-none ring-1 ring-gray-100 dark:ring-gray-800">
                    <CardHeader>
                        <CardTitle>Fluxo de Caixa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={cashFlowChart || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="mes" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="receitas" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickLinks.map((link) => (
                    <Link
                        key={link.id}
                        to={link.path}
                        className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${link.color.split('-')[1]}-50 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:scale-150`}></div>
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`${link.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <link.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors">
                                {link.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
