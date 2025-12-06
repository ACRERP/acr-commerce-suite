import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { EnhancedSystemOverview } from '@/components/dashboard/EnhancedSystemOverview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MainLayout } from '@/components/layout/MainLayout';
import { QuickActionsGrid } from '@/components/dashboard/QuickActionsGrid';
import { Card, CardContent } from '@/components/ui/card';

export function SystemOverviewPage() {
  const { stats, isLoadingStats } = useDashboardMetrics();

  // loading state dealt with inside specific components or here?
  // If we wrap in MainLayout, we should show layout even if loading stats.

  // Transform backend stats to UI metrics format
  const metrics = {
    totalRevenue: stats?.total_sales_amount || 0,
    revenueGrowth: 0,
    totalSales: stats?.total_orders || 0,
    salesGrowth: 0,
    totalProducts: stats?.total_products || 0,
    lowStockProducts: stats?.products_low_stock || 0,
    lowStockProductsCount: stats?.products_low_stock || 0,
    totalCustomers: stats?.total_clients || 0,
    customerGrowth: 0,
    totalExpenses: 0,
    expenseGrowth: 0,
    netProfit: 0,
    profitMargin: 0
  };

  if (isLoadingStats) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h2>
          {/* Quick Actions Grid (F-Keys) */}
          <QuickActionsGrid />
        </div>

        {/* System Overview (Charts/Metrics) */}
        <EnhancedSystemOverview metrics={metrics} isLoading={isLoadingStats} />
      </div>
    </MainLayout>
  );
}
