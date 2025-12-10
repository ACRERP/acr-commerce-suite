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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visão geral do seu negócio
                </p>
            </div>

            {/* Métricas Principais - 6 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Vendas do Mês
                                </p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics?.salesMonth || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    OS Abertas
                                </p>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                                    {metrics?.osOpen || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Clientes
                                </p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    {metrics?.clients || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Estoque Baixo
                                </p>
                                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                                    {metrics?.lowStock || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Entregas em Rota
                                </p>
                                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
                                    {metrics?.deliveries || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                                <Truck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Contas Vencidas
                                </p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                                    {metrics?.overdue || 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico + Atividades */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Vendas */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Vendas - Últimos 7 Dias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={salesChart || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: number) =>
                                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                                    }
                                />
                                <Bar dataKey="vendas" fill="#9333ea" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Atividades Recentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Atividades Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities?.map((activity, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${activity.color}`}>
                                        <activity.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {activity.title}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos Premium - Grid 2x2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PieChart - OS por Status */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-orange-600" />
                            OS por Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {osStatusChart && osStatusChart.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={osStatusChart}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {osStatusChart.map((entry, index) => {
                                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                        })}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-400">
                                <p>Sem dados disponíveis</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* LineChart - Fluxo de Caixa */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            Fluxo de Caixa (6 meses)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cashFlowChart && cashFlowChart.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={cashFlowChart}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) =>
                                            new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                                        }
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="receitas"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        name="Receitas"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="despesas"
                                        stroke="#EF4444"
                                        strokeWidth={2}
                                        name="Despesas"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="saldo"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        name="Saldo"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-gray-400">
                                <p>Sem dados disponíveis</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            {/* Links Rápidos */}
            <Card>
                <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.id}
                                to={link.path}
                                className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-200 ${link.color}`}>
                                    <link.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300 text-center group-hover:text-gray-900 dark:group-hover:text-white">
                                    {link.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
