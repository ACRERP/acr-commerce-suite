import { useState, useEffect, useCallback } from 'react';
import { 
  PurchaseHistoryItem, 
  PurchaseHistorySummary, 
  PurchaseHistoryFilters,
  getClientPurchaseHistory,
  calculatePurchaseSummary,
  getClientPurchaseAnalytics,
  PurchaseAnalytics,
  getClientSegmentation,
  calculateClientLifetimeValue,
  predictNextPurchase as predictNextPurchaseUtil
} from '@/lib/purchaseHistory';

export interface UsePurchaseHistoryOptions {
  clientId: number;
  autoLoad?: boolean;
  refreshInterval?: number;
  initialFilters?: PurchaseHistoryFilters;
}

export interface UsePurchaseHistoryReturn {
  purchases: PurchaseHistoryItem[];
  summary: PurchaseHistorySummary | null;
  analytics: PurchaseAnalytics | null;
  loading: boolean;
  error: string | null;
  filters: PurchaseHistoryFilters;
  total: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  
  // Actions
  loadPurchases: (filters?: PurchaseHistoryFilters) => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: Partial<PurchaseHistoryFilters>) => void;
  clearFilters: () => void;
  exportToCSV: () => void;
  
  // Analytics
  loadAnalytics: (period?: 'week' | 'month' | 'quarter' | 'year') => Promise<void>;
  getSegmentation: () => ReturnType<typeof getClientSegmentation>;
  getLifetimeValue: () => ReturnType<typeof calculateClientLifetimeValue>;
  predictNextPurchase: () => ReturnType<typeof predictNextPurchaseUtil>;
  
  // Pagination
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function usePurchaseHistory({
  clientId,
  autoLoad = true,
  refreshInterval,
  initialFilters = {},
}: UsePurchaseHistoryOptions): UsePurchaseHistoryReturn {
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [summary, setSummary] = useState<PurchaseHistorySummary | null>(null);
  const [analytics, setAnalytics] = useState<PurchaseAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PurchaseHistoryFilters>({
    limit: 20,
    offset: 0,
    ...initialFilters,
  });
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  // Calculate pagination based on filters
  useEffect(() => {
    const pageSize = filters.limit || 20;
    const currentPage = Math.floor((filters.offset || 0) / pageSize) + 1;
    const totalPages = Math.ceil(total / pageSize);

    setPagination({
      page: currentPage,
      pageSize,
      totalPages,
    });
  }, [filters, total]);

  // Load purchases
  const loadPurchases = useCallback(async (newFilters?: PurchaseHistoryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = newFilters || filters;
      const result = await getClientPurchaseHistory(clientId, filtersToUse);
      
      setPurchases(result.items);
      setSummary(result.summary);
      setTotal(result.total);
      setFiltersState(filtersToUse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar histórico de compras';
      setError(errorMessage);
      console.error('Error loading purchase history:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, filters]);

  // Load analytics
  const loadAnalytics = useCallback(async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    try {
      const analyticsData = await getClientPurchaseAnalytics(clientId, period);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  }, [clientId]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadPurchases();
    if (analytics) {
      await loadAnalytics();
    }
  }, [loadPurchases, analytics, loadAnalytics]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<PurchaseHistoryFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFiltersState(updatedFilters);
  }, [filters]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      limit: 20,
      offset: 0,
    };
    setFiltersState(defaultFilters);
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (purchases.length === 0) return;

    // Create CSV content
    const headers = [
      'ID da Venda',
      'Data',
      'Status',
      'Valor Total',
      'Método de Pagamento',
      'Produtos',
      'Quantidade',
      'Valor Unitário',
      'Descontos',
    ];

    const rows = purchases.flatMap(purchase => 
      purchase.items.map(item => [
        purchase.id,
        new Date(purchase.sale_date).toLocaleDateString('pt-BR'),
        purchase.status,
        purchase.total_amount.toFixed(2),
        purchase.payment_method,
        item.product?.name || '',
        item.quantity.toString(),
        item.price.toFixed(2),
        purchase.discounts?.map(d => d.name).join('; ') || '',
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_compras_cliente_${clientId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [purchases, clientId]);

  // Get segmentation
  const getSegmentation = useCallback(() => {
    if (!summary) return null;
    const clv = calculateClientLifetimeValue(purchases);
    return getClientSegmentation(summary, clv);
  }, [summary, purchases]);

  // Get lifetime value
  const getLifetimeValue = useCallback(() => {
    return calculateClientLifetimeValue(purchases, '');
  }, [purchases]);

  // Predict next purchase
  const predictNextPurchase = useCallback(() => {
    return predictNextPurchaseUtil(purchases);
  }, [purchases]);

  // Pagination functions
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      const newOffset = pagination.page * pagination.pageSize;
      setFilters({ offset: newOffset });
    }
  }, [pagination, setFilters]);

  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      const newOffset = (pagination.page - 2) * pagination.pageSize;
      setFilters({ offset: Math.max(0, newOffset) });
    }
  }, [pagination, setFilters]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      const newOffset = (page - 1) * pagination.pageSize;
      setFilters({ offset: newOffset });
    }
  }, [pagination, setFilters]);

  const setPageSize = useCallback((pageSize: number) => {
    const newOffset = 0;
    setFilters({ limit: pageSize, offset: newOffset });
  }, [setFilters]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && clientId) {
      loadPurchases();
    }
  }, [autoLoad, clientId, loadPurchases]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !autoLoad) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoLoad, refresh]);

  return {
    purchases,
    summary,
    analytics,
    loading,
    error,
    filters,
    total,
    pagination,
    
    loadPurchases,
    refresh,
    setFilters,
    clearFilters,
    exportToCSV,
    
    loadAnalytics,
    getSegmentation,
    getLifetimeValue,
    predictNextPurchase,
    
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
  };
}

// Hook for multiple clients purchase history
export function useBulkPurchaseHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Map<number, {
    purchases: PurchaseHistoryItem[];
    summary: PurchaseHistorySummary;
  }>>(new Map());

  const loadMultipleClients = useCallback(async (clientIds: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const resultsMap = new Map();

      // Load clients in parallel with concurrency limit
      const concurrencyLimit = 5;
      const chunks = [];
      
      for (let i = 0; i < clientIds.length; i += concurrencyLimit) {
        chunks.push(clientIds.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const promises = chunk.map(async (clientId) => {
          try {
            const result = await getClientPurchaseHistory(clientId);
            return { clientId, result };
          } catch (error) {
            console.error(`Error loading purchase history for client ${clientId}:`, error);
            return { clientId, error };
          }
        });

        const chunkResults = await Promise.all(promises);
        
        chunkResults.forEach(({ clientId, result, error: err }) => {
          if (err) {
            // Still add empty result to maintain consistency
            resultsMap.set(clientId, {
              purchases: [],
              summary: {
                total_purchases: 0,
                total_spent: 0,
                average_purchase_value: 0,
                favorite_products: [],
                purchase_frequency: {
                  daily: 0,
                  weekly: 0,
                  monthly: 0,
                  yearly: 0,
                },
                payment_preferences: [],
                status_distribution: [],
              },
            });
          } else {
            resultsMap.set(clientId, {
              purchases: result.items,
              summary: result.summary,
            });
          }
        });
      }

      setResults(resultsMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar históricos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getClientData = useCallback((clientId: number) => {
    return results.get(clientId);
  }, [results]);

  const clearResults = useCallback(() => {
    setResults(new Map());
  }, []);

  return {
    loading,
    error,
    results,
    loadMultipleClients,
    getClientData,
    clearResults,
  };
}

// Hook for purchase history statistics
export function usePurchaseHistoryStatistics() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    averageTicket: 0,
    topClients: [] as Array<{
      clientId: number;
      clientName: string;
      totalSpent: number;
      purchaseCount: number;
    }>,
    revenueByMonth: [] as Array<{
      month: string;
      revenue: number;
      purchases: number;
    }>,
  });

  const loadStatistics = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      // This would call an API endpoint to get aggregated statistics
      // For now, we'll set mock data
      setStats({
        totalClients: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        averageTicket: 0,
        topClients: [],
        revenueByMonth: [],
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  return {
    stats,
    loadStatistics,
  };
}
