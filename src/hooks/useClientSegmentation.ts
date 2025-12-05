import { useState, useEffect, useCallback } from 'react';
import { 
  ClientSegment,
  ClientSegmentation,
  SegmentationAnalytics,
  SegmentationSuggestion,
  CreditRiskAnalysis,
  createDefaultSegments,
  generateSegmentationSuggestions,
  applySegmentationRules,
  calculateSegmentMetrics,
  exportSegmentToCSV,
  calculateRFMScore,
  predictChurnProbability,
  calculateCLV,
  analyzeCreditRisk
} from '@/lib/clientSegmentation';
import { Client } from '@/components/dashboard/clients/ClientList';

export interface UseClientSegmentationOptions {
  clientId: number;
  autoLoad?: boolean;
  refreshInterval?: number;
}

export interface UseClientSegmentationReturn {
  segments: ClientSegment[];
  clientSegmentations: ClientSegmentation[];
  analytics: SegmentationAnalytics | null;
  suggestions: SegmentationSuggestion[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  createSegment: (segmentData: Partial<ClientSegment>) => Promise<ClientSegment>;
  updateSegment: (segmentId: string, updates: Partial<ClientSegment>) => Promise<ClientSegment>;
  deleteSegment: (segmentId: string) => Promise<void>;
  applySegmentation: (clientId: number) => Promise<ClientSegmentation[]>;
  exportSegment: (segmentId: string, clients: Client[]) => string;
  
  // Analytics
  analyzeRisk: (client: Client, purchaseHistory: unknown[]) => CreditRiskAnalysis;
  getSegmentMetrics: (segmentId: string) => Promise<{
  clientCount: number;
  totalRevenue: number;
  averageTicket: number;
  retentionRate: number;
  churnRate: number;
  growthRate: number;
}>;
  getRFMScore: (clientId: number) => ReturnType<typeof calculateRFMScore>;
  getChurnPrediction: (clientId: number) => ReturnType<typeof predictChurnProbability>;
  getCLV: (clientId: number) => number;
}

export function useClientSegmentation({
  clientId,
  autoLoad = true,
  refreshInterval,
}: UseClientSegmentationOptions): UseClientSegmentationReturn {
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [clientSegmentations, setClientSegmentations] = useState<ClientSegmentation[]>([]);
  const [analytics, setAnalytics] = useState<SegmentationAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<SegmentationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load segmentation data
  const loadSegmentationData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load default segments
      const defaultSegments = createDefaultSegments();
      setSegments(defaultSegments);

      // Generate suggestions
      const suggestions = generateSegmentationSuggestions([], []); // Would pass actual data
      setSuggestions(suggestions);

      // Mock client segmentations
      const mockSegmentations: ClientSegmentation[] = [
        {
          clientId,
          segmentId: 'champions',
          segmentName: 'Campeões',
          score: 85,
          confidence: 92,
          assignedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          assignedBy: 'system',
        },
        {
          clientId,
          segmentId: 'loyal-customers',
          segmentName: 'Clientes Fiéis',
          score: 78,
          confidence: 85,
          assignedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          assignedBy: 'system',
        },
      ];
      setClientSegmentations(mockSegmentations);

      // Mock analytics
      const mockAnalytics: SegmentationAnalytics = {
        totalClients: 150,
        segmentDistribution: defaultSegments.map(segment => ({
          segmentId: segment.id,
          segmentName: segment.name,
          clientCount: Math.floor(Math.random() * 50) + 10,
          percentage: 0,
          totalRevenue: Math.floor(Math.random() * 10000) + 1000,
          averageTicket: Math.floor(Math.random() * 500) + 100,
          growthRate: (Math.random() - 0.5) * 20,
        })),
        performanceMetrics: {
          retentionRate: 75,
          acquisitionRate: 12,
          churnRate: 8,
          averageLifetimeValue: 2500,
        },
        trends: [],
      };

      // Calculate percentages
      const totalClients = mockAnalytics.segmentDistribution.reduce((sum, segment) => sum + segment.clientCount, 0);
      mockAnalytics.segmentDistribution = mockAnalytics.segmentDistribution.map(segment => ({
        ...segment,
        percentage: totalClients > 0 ? (segment.clientCount / totalClients) * 100 : 0,
      }));

      setAnalytics(mockAnalytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados de segmentação';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadSegmentationData();
  }, [loadSegmentationData]);

  // Create segment
  const createSegment = useCallback(async (segmentData: Partial<ClientSegment>) => {
    try {
      const newSegment: ClientSegment = {
        id: Date.now().toString(),
        name: segmentData.name || '',
        description: segmentData.description || '',
        color: segmentData.color || '#6b7280',
        criteria: segmentData.criteria || {
          recency: { enabled: false, daysSinceLastPurchase: {} },
          frequency: { enabled: false, purchaseFrequency: { period: 'month' } },
          monetary: { enabled: false, totalSpent: {}, averageTicket: {} },
          demographics: { enabled: false },
          behavior: { enabled: false },
          custom: [],
        },
        rules: segmentData.rules || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      setSegments(prev => [...prev, newSegment]);
      return newSegment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar segmento';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update segment
  const updateSegment = useCallback(async (segmentId: string, updates: Partial<ClientSegment>) => {
    try {
      const updatedSegment = {
        ...segments.find(s => s.id === segmentId),
        ...updates,
        updatedAt: new Date().toISOString(),
      } as ClientSegment;

      setSegments(prev => prev.map(s => s.id === segmentId ? updatedSegment : s));
      return updatedSegment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar segmento';
      setError(errorMessage);
      throw err;
    }
  }, [segments]);

  // Delete segment
  const deleteSegment = useCallback(async (segmentId: string) => {
    try {
      setSegments(prev => prev.filter(s => s.id !== segmentId));
      setClientSegmentations(prev => prev.filter(cs => cs.segmentId !== segmentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir segmento';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Apply segmentation to client
  const applySegmentation = useCallback(async (clientId: number) => {
    try {
      const mockClientData = {
        lastPurchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        purchaseFrequency: 4.5,
        totalSpent: 2500,
        averageTicket: 180,
        creditLimit: 1000,
        creditUsed: 300,
      };

      const mockClient = { id: clientId, name: '', phone: '', cpf_cnpj: '' } as Client;
      const segmentations = applySegmentationRules(mockClient, segments, mockClientData);
      
      setClientSegmentations(prev => [
        ...prev.filter(cs => cs.clientId !== clientId),
        ...segmentations
      ]);

      return segmentations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aplicar segmentação';
      setError(errorMessage);
      throw err;
    }
  }, [segments]);

  // Export segment
  const exportSegment = useCallback((segmentId: string, clients: Client[]) => {
    try {
      const segment = segments.find(s => s.id === segmentId);
      if (!segment) {
        throw new Error('Segmento não encontrado');
      }

      const csv = exportSegmentToCSV(segment, clientSegmentations, clients);
      return csv;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar segmento';
      setError(errorMessage);
      throw err;
    }
  }, [segments, clientSegmentations]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && clientId) {
      loadSegmentationData();
    }
  }, [autoLoad, clientId, loadSegmentationData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !autoLoad) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoLoad, refresh]);

  // Get segment metrics
  const getSegmentMetrics = useCallback(async (segmentId: string) => {
    try {
      const metrics = calculateSegmentMetrics(segmentId, clientSegmentations, []);
      return metrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular métricas do segmento';
      setError(errorMessage);
      throw err;
    }
  }, [clientSegmentations]);

  // Analyze client risk
  const analyzeRisk = useCallback((client: Client, purchaseHistory: unknown[]) => {
    return analyzeCreditRisk(client, purchaseHistory);
  }, []);

  // Get RFM score
  const getRFMScore = useCallback((clientId: number) => {
    // Mock implementation - would calculate from actual data
    return calculateRFMScore(
      new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      4.5,
      2500
    );
  }, []);

  // Get churn prediction
  const getChurnPrediction = useCallback((clientId: number) => {
    // Mock implementation - would calculate from actual data
    return predictChurnProbability(15, 4.5, 180, 8);
  }, []);

  // Get CLV
  const getCLV = useCallback((clientId: number) => {
    // Mock implementation - would calculate from actual data
    return calculateCLV(180, 4.5, 24);
  }, []);

  return {
    segments,
    clientSegmentations,
    analytics,
    suggestions,
    loading,
    error,
    
    refresh,
    createSegment,
    updateSegment,
    deleteSegment,
    applySegmentation,
    exportSegment,
    
    analyzeRisk,
    getSegmentMetrics,
    getRFMScore,
    getChurnPrediction,
    getCLV,
  };
}

// Hook for segmentation analytics
export function useSegmentationAnalytics() {
  const [analytics, setAnalytics] = useState<SegmentationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (filters?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    segmentId?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // This would fetch actual analytics from the database
      // For now, return mock data
      const mockAnalytics: SegmentationAnalytics = {
        totalClients: 500,
        segmentDistribution: [
          {
            segmentId: 'champions',
            segmentName: 'Campeões',
            clientCount: 75,
            percentage: 15,
            totalRevenue: 75000,
            averageTicket: 1000,
            growthRate: 12.5,
          },
          {
            segmentId: 'loyal-customers',
            segmentName: 'Clientes Fiéis',
            clientCount: 125,
            percentage: 25,
            totalRevenue: 100000,
            averageTicket: 800,
            growthRate: 8.3,
          },
          {
            segmentId: 'new-customers',
            segmentName: 'Clientes Novos',
            clientCount: 100,
            percentage: 20,
            totalRevenue: 30000,
            averageTicket: 300,
            growthRate: 25.0,
          },
          {
            segmentId: 'at-risk',
            segmentName: 'Em Risco',
            clientCount: 80,
            percentage: 16,
            totalRevenue: 40000,
            averageTicket: 500,
            growthRate: -5.2,
          },
        ],
        performanceMetrics: {
          retentionRate: 78,
          acquisitionRate: 15,
          churnRate: 7,
          averageLifetimeValue: 3200,
        },
        trends: [],
      };

      setAnalytics(mockAnalytics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar análises';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    await loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    refreshAnalytics,
  };
}

// Hook for segmentation management (admin level)
export function useSegmentationManagement() {
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSegments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const defaultSegments = createDefaultSegments();
      setSegments(defaultSegments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar segmentos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSegment = useCallback(async (segmentData: Partial<ClientSegment>) => {
    try {
      const newSegment: ClientSegment = {
        id: Date.now().toString(),
        name: segmentData.name || '',
        description: segmentData.description || '',
        color: segmentData.color || '#6b7280',
        criteria: segmentData.criteria || {
          recency: { enabled: false, daysSinceLastPurchase: {} },
          frequency: { enabled: false, purchaseFrequency: { period: 'month' } },
          monetary: { enabled: false, totalSpent: {}, averageTicket: {} },
          demographics: { enabled: false },
          behavior: { enabled: false },
          custom: [],
        },
        rules: segmentData.rules || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      setSegments(prev => [...prev, newSegment]);
      return newSegment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar segmento';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateSegment = useCallback(async (segmentId: string, updates: Partial<ClientSegment>) => {
    try {
      const updatedSegment = {
        ...segments.find(s => s.id === segmentId),
        ...updates,
        updatedAt: new Date().toISOString(),
      } as ClientSegment;

      setSegments(prev => prev.map(s => s.id === segmentId ? updatedSegment : s));
      return updatedSegment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar segmento';
      setError(errorMessage);
      throw err;
    }
  }, [segments]);

  const deleteSegment = useCallback(async (segmentId: string) => {
    try {
      setSegments(prev => prev.filter(s => s.id !== segmentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir segmento';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const toggleSegment = useCallback(async (segmentId: string) => {
    try {
      const segment = segments.find(s => s.id === segmentId);
      if (segment) {
        const updatedSegment = { ...segment, isActive: !segment.isActive };
        setSegments(prev => prev.map(s => s.id === segmentId ? updatedSegment : s));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alternar segmento';
      setError(errorMessage);
      throw err;
    }
  }, [segments]);

  const applyToAllClients = useCallback(async (segmentId: string) => {
    try {
      // This would apply the segment to all eligible clients
      // For now, just return success
      console.log(`Applying segment ${segmentId} to all eligible clients`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aplicar segmento a todos os clientes';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  return {
    segments,
    loading,
    error,
    loadSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    toggleSegment,
    applyToAllClients,
  };
}
