import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';

export function InventoryDashboard() {
    const { data: stats } = useQuery({
        queryKey: ['inventory-stats'],
        queryFn: async () => {
            // 1. Total Value & Stock Count
            const { data: products } = await supabase
                .from('products')
                .select('stock_quantity, cost_price, minimum_stock_level, active')
                .eq('active', true);

            // 2. Movements Today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: movementsCount } = await supabase
                .from('stock_movements')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            const totalValue = products?.reduce((acc, p) => acc + (p.stock_quantity * (p.cost_price || 0)), 0) || 0;
            const lowStockCount = products?.filter(p => p.stock_quantity <= (p.minimum_stock_level || 0)).length || 0;
            const totalItems = products?.length || 0;

            return {
                totalValue,
                lowStockCount,
                totalItems,
                movementsCount: movementsCount || 0
            };
        }
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total em Estoque</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {formatCurrency(stats?.totalValue || 0)}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-red-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estoque Baixo</p>
                            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                                {stats?.lowStockCount || 0} <span className="text-sm font-normal text-gray-500">itens</span>
                            </h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Itens Ativos</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {stats?.totalItems || 0}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-purple-500 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Movimentações Hoje</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {stats?.movementsCount || 0}
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <ArrowUpRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
