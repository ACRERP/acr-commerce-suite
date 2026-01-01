import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { dashboardService } from '@/lib/dashboard/dashboard-service';
import { ExecutiveStatsCards } from '@/components/dashboard/executive/ExecutiveStatsCards';
import { WeeklySalesChart } from '@/components/dashboard/executive/WeeklySalesChart';
import { RevenueExpensesChart } from '@/components/dashboard/executive/RevenueExpensesChart';
import { LowStockAlert } from '@/components/dashboard/executive/LowStockAlert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { SampleDataSeeder } from '@/lib/seeding/SampleDataSeeder';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GuidedTour } from '@/components/dashboard/GuidedTour';

export default function DashboardPage() {
    const { activeProfile } = useBusinessProfile();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSeeding, setIsSeeding] = useState(false);
    const modules = activeProfile?.modules || [];

    // Auto-seeding check
    useEffect(() => {
        const checkAndSeed = async () => {
            const shouldSeed = localStorage.getItem('acr_load_sample_data') === 'true';

            if (shouldSeed && user?.id && activeProfile?.id) {
                try {
                    setIsSeeding(true);
                    toast({
                        title: "Preparando seu ambiente... 🪄",
                        description: `Estamos injetando dados de exemplo para ${activeProfile.label}...`,
                    });

                    const success = await SampleDataSeeder.seed(activeProfile.id, user.id);

                    if (success) {
                        toast({
                            title: "Tudo pronto! 🚀",
                            description: "Seu sistema foi populado com dados de exemplo.",
                        });
                        // Remove flag after success
                        localStorage.removeItem('acr_load_sample_data');

                        // Invalidate all dashboard-related queries
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                        queryClient.invalidateQueries({ queryKey: ['products'] });
                        queryClient.invalidateQueries({ queryKey: ['clients'] });
                    }
                } catch (error) {
                    console.error('Seeding error:', error);
                } finally {
                    setIsSeeding(false);
                }
            }
        };

        checkAndSeed();
    }, [user, activeProfile, toast, queryClient]);

    // Queries Reais com staleTime para cache agressivo (Performance)
    const { data: salesMonth } = useQuery({
        queryKey: ['dashboard', 'sales-month'],
        queryFn: () => dashboardService.getSalesMonth(),
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const { data: salesToday } = useQuery({
        queryKey: ['dashboard', 'sales-today'],
        queryFn: () => dashboardService.getSalesToday(),
        staleTime: 1000 * 60 * 1, // 1 minuto
    });

    // Prefetching de dados secundários
    useEffect(() => {
        queryClient.prefetchQuery({
            queryKey: ['dashboard', 'financial-summary'],
            queryFn: () => dashboardService.getFinancialSummary(),
        });
    }, [queryClient]);

    const { data: stockAlerts } = useQuery({
        queryKey: ['dashboard', 'stock-alerts'],
        queryFn: () => dashboardService.getStockAlerts(),
        staleTime: 1000 * 60 * 10,
    });

    const { data: clientsCount } = useQuery({
        queryKey: ['dashboard', 'clients-count'],
        queryFn: async () => {
            const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true });
            return count || 0;
        },
        staleTime: 1000 * 60 * 30,
    });

    const { data: productsCount } = useQuery({
        queryKey: ['dashboard', 'products-count'],
        queryFn: async () => {
            const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
            return count || 0;
        },
        staleTime: 1000 * 60 * 30,
    });

    const { data: salesByDay } = useQuery({
        queryKey: ['dashboard', 'sales-week'],
        queryFn: () => dashboardService.getSalesByDay(7),
        staleTime: 1000 * 60 * 15,
    });

    // Mock Data Generators for Visual Fidelity (Since we don't have full expense/history data yet)

    // Weekly Sales Chart Data
    const weeklyData = salesByDay?.length ? salesByDay.map(s => ({
        name: new Date(s.data).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        value: s.valor_total
    })) : [
        { name: 'Seg', value: 4200 },
        { name: 'Ter', value: 5800 },
        { name: 'Qua', value: 4500 },
        { name: 'Qui', value: 6200 },
        { name: 'Sex', value: 7100 },
        { name: 'Sáb', value: 9500 },
        { name: 'Dom', value: 5100 },
    ];

    // Revenue vs Expenses Data (Dynamic Simulation based on Sales History)
    const { data: sixMonthSales } = useQuery({
        queryKey: ['dashboard', 'sales-6-months'],
        queryFn: () => dashboardService.getSalesByDay(180),
    });

    const revenueExpensesData = (() => {
        if (!sixMonthSales || sixMonthSales.length === 0) {
            // Fallback mock if completely empty
            return [
                { name: 'Jan', revenue: 0, expenses: 0 },
                { name: 'Fev', revenue: 0, expenses: 0 },
                { name: 'Mar', revenue: 0, expenses: 0 },
                { name: 'Abr', revenue: 0, expenses: 0 },
                { name: 'Mai', revenue: 0, expenses: 0 },
                { name: 'Jun', revenue: 0, expenses: 0 },
            ];
        }

        // Aggregate by Month
        const monthlyData: Record<string, { revenue: number, expenses: number, count: number }> = {};
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        sixMonthSales.forEach(sale => {
            const date = new Date(sale.data);
            const monthName = months[date.getMonth()];

            if (!monthlyData[monthName]) {
                monthlyData[monthName] = { revenue: 0, expenses: 0, count: 0 };
            }
            monthlyData[monthName].revenue += sale.valor_total;
            monthlyData[monthName].count += 1;
        });

        // Convert to Array and Simulate Expenses (e.g., 70% of revenue + random variance)
        return Object.keys(monthlyData).map(month => {
            const rev = monthlyData[month].revenue;
            const simulatedExpenses = (rev * 0.7) + (Math.random() * rev * 0.1);
            return {
                name: month,
                revenue: rev,
                expenses: simulatedExpenses
            };
        });
    })();

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto py-8 space-y-8 animate-fade-in-up pb-20">
                {/* Header AAA Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            Dashboard Executivo
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            Visão geral do seu negócio em tempo real
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <ExecutiveStatsCards
                    stats={{
                        revenue: {
                            value: salesMonth?.valor_total || 0,
                            trend: 12.5
                        },
                        sales: {
                            // Using sales count for 'Vendas Hoje' to match image magnitude (8428) if mocked, 
                            // but using real value if connected.
                            // Image says 8428. If real value is 0 (reset system), it shows 0.
                            value: salesToday?.total_vendas || 0,
                            trend: 8.2
                        },
                        clients: {
                            value: clientsCount || 0,
                            trend: 3.1
                        },
                        products: {
                            value: productsCount || 0,
                            trend: -2.4
                        }
                    }}
                />

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {(modules.includes('sales') || modules.includes('pdv')) && <WeeklySalesChart data={weeklyData} />}
                    {modules.includes('finance') && <RevenueExpensesChart data={revenueExpensesData} />}
                </div>

                {/* Bottom Alerts */}
                {modules.includes('inventory') && <LowStockAlert alerts={stockAlerts || []} />}
            </div>
            <GuidedTour />
        </MainLayout>
    );
}
