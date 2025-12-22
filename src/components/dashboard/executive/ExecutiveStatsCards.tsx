import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useBusinessProfile } from "@/contexts/BusinessProfileContext";

interface StatCardProps {
    title: string;
    value: string;
    trend: number;
    trendLabel: string;
    icon: React.ElementType;
}

function StatCard({ title, value, trend, trendLabel, icon: Icon }: StatCardProps) {
    const isPositive = trend >= 0;

    return (
        <Card className="shadow-sm border-neutral-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="p-2 w-fit rounded-lg bg-neutral-50 mb-4">
                            <Icon className="w-5 h-5 text-neutral-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-neutral-900 tracking-tight mb-1">{value}</h3>
                        <p className="text-sm font-medium text-neutral-500">{title}</p>
                    </div>
                    {trend !== 0 && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{Math.abs(trend)}%</span>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{trendLabel}</span>
                </div>
            </CardContent>
        </Card>
    );
}

interface ExecutiveStatsCardsProps {
    stats: {
        revenue: { value: number; trend: number };
        sales: { value: number; trend: number };
        clients: { value: number; trend: number };
        products: { value: number; trend: number };
    };
}

export function ExecutiveStatsCards({ stats }: ExecutiveStatsCardsProps) {
    const { activeProfile } = useBusinessProfile();
    const modules = activeProfile?.modules || [];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {modules.includes('finance') && (
                <StatCard
                    title="Receita Total"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue.value)}
                    trend={stats.revenue.trend}
                    trendLabel="Últimos 30 dias"
                    icon={DollarSign}
                />
            )}
            {(modules.includes('pdv') || modules.includes('sales')) && (
                <StatCard
                    title="Vendas Hoje"
                    value={stats.sales.value.toString()}
                    trend={stats.sales.trend}
                    trendLabel="Últimas 24 horas"
                    icon={ShoppingCart}
                />
            )}
            {modules.includes('clients') && (
                <StatCard
                    title="Clientes Ativos"
                    value={stats.clients.value.toString()}
                    trend={stats.clients.trend}
                    trendLabel="Últimos 30 dias"
                    icon={Users}
                />
            )}
            {modules.includes('inventory') && (
                <StatCard
                    title="Produtos Cadastrados"
                    value={stats.products.value.toString()}
                    trend={stats.products.trend}
                    trendLabel="Últimos 30 dias"
                    icon={Package}
                />
            )}
        </div>
    );
}
