import { useQuery } from '@tanstack/react-query';
import { useProducts } from './useProducts';
import { useInventorySummary } from './useInventory';

export interface LowStockAlert {
  id: number;
  name: string;
  code: string;
  current_stock: number;
  minimum_stock: number;
  status: 'critical' | 'warning';
  price?: number;
}

export function useLowStockAlerts() {
  const { data: products } = useProducts();
  const { data: inventorySummary } = useInventorySummary();

  const lowStockAlerts = products?.reduce((alerts: LowStockAlert[], product) => {
    const currentStock = product.stock_quantity || 0;
    const minimumStock = product.minimum_stock_level || 0;

    if (currentStock <= minimumStock) {
      alerts.push({
        id: product.id,
        name: product.name,
        code: product.code,
        current_stock: currentStock,
        minimum_stock: minimumStock,
        status: currentStock === 0 ? 'critical' : 'warning',
        price: product.price,
      });
    }

    return alerts;
  }, []) || [];

  const criticalAlerts = lowStockAlerts.filter(alert => alert.status === 'critical');
  const warningAlerts = lowStockAlerts.filter(alert => alert.status === 'warning');

  return {
    alerts: lowStockAlerts,
    criticalAlerts,
    warningAlerts,
    totalAlerts: lowStockAlerts.length,
    hasAlerts: lowStockAlerts.length > 0,
    summary: inventorySummary,
  };
}

// Hook for real-time stock monitoring with WebSocket or polling
export function useRealTimeStockMonitoring() {
  const { data: products } = useProducts();
  const { data: inventorySummary } = useInventorySummary();

  return useQuery({
    queryKey: ['real-time-stock'],
    queryFn: async () => {
      // This could be enhanced with WebSocket or Supabase real-time subscriptions
      // For now, we'll just return the current stock status
      const lowStockProducts = products?.filter(product => 
        product.stock_quantity <= (product.minimum_stock_level || 0)
      ) || [];

      return {
        lowStockCount: lowStockProducts.length,
        criticalCount: lowStockProducts.filter(p => p.stock_quantity === 0).length,
        warningCount: lowStockProducts.filter(p => 
          p.stock_quantity > 0 && p.stock_quantity <= (p.minimum_stock_level || 0)
        ).length,
        lastUpdated: new Date().toISOString(),
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
