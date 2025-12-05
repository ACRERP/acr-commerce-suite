import { useQuery } from '@tanstack/react-query';
import { useSales, useSalesByDateRange } from './useSales';
import { useProducts, useLowStockProducts } from './useProducts';
import { useClients } from './useClients';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (period?: string) => [...dashboardKeys.all, 'stats', period] as const,
  kpis: (period?: string) => [...dashboardKeys.all, 'kpis', period] as const,
};

// Dashboard statistics interface
export interface DashboardStats {
  totalSales: number;
  salesCount: number;
  averageTicket: number;
  productsInStock: number;
  activeClients: number;
  lowStockCount: number;
  salesChange: number;
  stockChange: number;
  clientsChange: number;
  ticketChange: number;
}

// Top selling product interface
export interface TopProduct {
  id: number;
  name: string;
  code: string;
  totalSold: number;
  revenue: number;
}

// Recent sale interface for dashboard
export interface RecentSale {
  id: number;
  client_name?: string;
  total_amount: number;
  created_at: string;
  status: string;
  items_count: number;
}

// Get dashboard statistics
export function useDashboardStats(period: string = 'hoje') {
  // Get date range based on period
  const getDateRange = (period: string) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'hoje':
        return {
          start: startOfDay.toISOString(),
          end: now.toISOString()
        };
      case 'semana':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          start: startOfWeek.toISOString(),
          end: now.toISOString()
        };
      case 'mes':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: startOfMonth.toISOString(),
          end: now.toISOString()
        };
      default:
        return {
          start: startOfDay.toISOString(),
          end: now.toISOString()
        };
    }
  };

  const { start, end } = getDateRange(period);
  const previousStart = getPreviousDateRange(start, period);

  // Current period data
  const currentSales = useSalesByDateRange(start, end);
  const allProducts = useProducts();
  const allClients = useClients();
  const lowStock = useLowStockProducts();

  // Previous period data for comparison
  const previousSales = useSalesByDateRange(previousStart.start, previousStart.end);

  return useQuery({
    queryKey: dashboardKeys.stats(period),
    queryFn: async () => {
      if (!currentSales.data || !allProducts.data || !allClients.data || !lowStock.data) {
        throw new Error('Required data not loaded');
      }

      const currentSalesData = currentSales.data;
      const previousSalesData = previousSales.data || [];
      
      // Calculate statistics
      const totalSales = currentSalesData.reduce((sum, sale) => sum + sale.total_amount, 0);
      const salesCount = currentSalesData.length;
      const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;
      const productsInStock = allProducts.data.reduce((sum, product) => sum + product.stock_quantity, 0);
      const activeClients = allClients.data.length;
      const lowStockCount = lowStock.data.length;

      // Calculate previous period stats for comparison
      const previousTotalSales = previousSalesData.reduce((sum, sale) => sum + sale.total_amount, 0);
      const previousSalesCount = previousSalesData.length;
      const previousAverageTicket = previousSalesCount > 0 ? previousTotalSales / previousSalesCount : 0;

      // Calculate percentage changes
      const salesChange = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0;
      const ticketChange = previousAverageTicket > 0 ? ((averageTicket - previousAverageTicket) / previousAverageTicket) * 100 : 0;

      return {
        totalSales,
        salesCount,
        averageTicket,
        productsInStock,
        activeClients,
        lowStockCount,
        salesChange,
        stockChange: 0, // TODO: Calculate from historical data
        clientsChange: 0, // TODO: Calculate from historical data
        ticketChange
      } as DashboardStats;
    },
    enabled: !!(currentSales.data && allProducts.data && allClients.data && lowStock.data),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get top selling products
export function useTopProducts(period: string = 'hoje', limit: number = 5) {
  const getDateRange = (period: string) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'hoje':
        return {
          start: startOfDay.toISOString(),
          end: now.toISOString()
        };
      case 'semana':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return {
          start: startOfWeek.toISOString(),
          end: now.toISOString()
        };
      case 'mes':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: startOfMonth.toISOString(),
          end: now.toISOString()
        };
      default:
        return {
          start: startOfDay.toISOString(),
          end: now.toISOString()
        };
    }
  };

  const { start, end } = getDateRange(period);
  const sales = useSalesByDateRange(start, end);

  return useQuery({
    queryKey: [...dashboardKeys.all, 'top-products', period, limit],
    queryFn: async () => {
      if (!sales.data) return [];

      // Aggregate sales by product
      const productSales = new Map<number, { count: number; revenue: number; name: string; code: string }>();

      sales.data.forEach(sale => {
        sale.items?.forEach(item => {
          const existing = productSales.get(item.product_id) || { count: 0, revenue: 0, name: '', code: '' };
          productSales.set(item.product_id, {
            count: existing.count + item.quantity,
            revenue: existing.revenue + (item.price * item.quantity),
            name: item.product?.name || 'Produto desconhecido',
            code: item.product?.code || ''
          });
        });
      });

      // Convert to array and sort by revenue
      const topProducts = Array.from(productSales.entries())
        .map(([productId, data]) => ({
          id: productId,
          name: data.name,
          code: data.code,
          totalSold: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      return topProducts as TopProduct[];
    },
    enabled: !!sales.data,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Get recent sales for dashboard
export function useRecentSales(limit: number = 5) {
  const sales = useSales();

  return useQuery({
    queryKey: [...dashboardKeys.all, 'recent-sales', limit],
    queryFn: async () => {
      if (!sales.data) return [];

      return sales.data.slice(0, limit).map(sale => ({
        id: sale.id,
        client_name: sale.client?.name,
        total_amount: sale.total_amount,
        created_at: sale.created_at,
        status: sale.status,
        items_count: sale.items?.length || 0
      })) as RecentSale[];
    },
    enabled: !!sales.data,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Helper function to get previous date range
function getPreviousDateRange(currentStart: string, period: string): { start: string; end: string } {
  const start = new Date(currentStart);
  let duration = 24 * 60 * 60 * 1000; // 1 day in milliseconds

  switch (period) {
    case 'hoje':
      duration = 24 * 60 * 60 * 1000; // 1 day
      break;
    case 'semana':
      duration = 7 * 24 * 60 * 60 * 1000; // 7 days
      break;
    case 'mes':
      duration = 30 * 24 * 60 * 60 * 1000; // 30 days
      break;
  }

  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration + 1);

  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString()
  };
}
