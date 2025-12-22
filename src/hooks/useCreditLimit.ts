import { useState, useEffect, useCallback } from 'react';
import { 
  CreditLimit,
  CreditTransaction,
  CreditApplication,
  CreditRiskAnalysis,
  CreditLimitSettings,
  getClientCreditLimit,
  upsertCreditLimit,
  getCreditTransactions,
  recordCreditTransaction,
  createCreditApplication,
  processCreditApplication,
  analyzeCreditRisk,
  canMakePurchase,
  getCreditLimitSettings,
  updateCreditLimitSettings
} from '@/lib/creditLimit';
import { Client } from '@/components/dashboard/clients/ClientList';

export interface UseCreditLimitOptions {
  clientId: number;
  autoLoad?: boolean;
  refreshInterval?: number;
}

export interface UseCreditLimitReturn {
  creditLimit: CreditLimit | null;
  transactions: CreditTransaction[];
  applications: CreditApplication[];
  riskAnalysis: CreditRiskAnalysis | null;
  settings: CreditLimitSettings | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  createCreditLimit: (limitAmount: number, notes?: string) => Promise<CreditLimit>;
  updateCreditLimit: (limitAmount: number, notes?: string) => Promise<CreditLimit>;
  checkPurchaseEligibility: (amount: number) => ReturnType<typeof canMakePurchase>;
  createApplication: (requestedLimit: number, reason: string) => Promise<CreditApplication>;
  processApplication: (applicationId: number, decision: 'approved' | 'rejected', approvedLimit?: number, rejectedReason?: string) => Promise<void>;
  recordTransaction: (type: 'purchase' | 'payment' | 'adjustment', amount: number, description: string, saleId?: number) => Promise<CreditTransaction>;
  
  // Analytics
  analyzeRisk: (client: Client, purchaseHistory: unknown[]) => CreditRiskAnalysis;
  getCreditStatus: () => { status: string; color: string; message: string };
  getUtilization: () => number;
}

export function useCreditLimit({
  clientId,
  autoLoad = true,
  refreshInterval,
}: UseCreditLimitOptions): UseCreditLimitReturn {
  const [creditLimit, setCreditLimit] = useState<CreditLimit | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<CreditRiskAnalysis | null>(null);
  const [settings, setSettings] = useState<CreditLimitSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load credit data
  const loadCreditData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [limitData, transactionsData, settingsData] = await Promise.all([
        getClientCreditLimit(clientId),
        getCreditTransactions(clientId),
        getCreditLimitSettings(),
      ]);

      setCreditLimit(limitData);
      setTransactions(transactionsData);
      setSettings(settingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados de crédito';
      setError(errorMessage);
      console.error('Error loading credit data:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadCreditData();
  }, [loadCreditData]);

  // Create credit limit
  const createCreditLimit = useCallback(async (limitAmount: number, notes?: string) => {
    try {
      const newLimit = await upsertCreditLimit(clientId, limitAmount, 'current_user', notes);
      setCreditLimit(newLimit);
      return newLimit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar limite de crédito';
      setError(errorMessage);
      throw err;
    }
  }, [clientId]);

  // Update credit limit
  const updateCreditLimit = useCallback(async (limitAmount: number, notes?: string) => {
    try {
      const updatedLimit = await upsertCreditLimit(clientId, limitAmount, 'current_user', notes);
      setCreditLimit(updatedLimit);
      
      // Record limit change transaction
      if (creditLimit) {
        const transaction = await recordCreditTransaction(
          updatedLimit.id,
          clientId,
          'limit_change',
          limitAmount - creditLimit.limit_amount,
          creditLimit.used_amount,
          updatedLimit.used_amount,
          `Limite alterado de R$ ${creditLimit.limit_amount} para R$ ${limitAmount}`,
          'current_user'
        );
        setTransactions(prev => [transaction, ...prev]);
      }
      
      return updatedLimit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar limite de crédito';
      setError(errorMessage);
      throw err;
    }
  }, [clientId, creditLimit]);

  // Check purchase eligibility
  const checkPurchaseEligibility = useCallback((amount: number) => {
    if (!creditLimit) {
      return {
        canPurchase: false,
        availableCredit: 0,
        reason: 'Cliente não possui limite de crédito',
      };
    }
    return canMakePurchase(creditLimit, amount);
  }, [creditLimit]);

  // Create credit application
  const createApplication = useCallback(async (requestedLimit: number, reason: string) => {
    try {
      const application = await createCreditApplication(
        clientId,
        requestedLimit,
        reason,
        creditLimit?.limit_amount
      );
      setApplications(prev => [application, ...prev]);
      return application;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar solicitação';
      setError(errorMessage);
      throw err;
    }
  }, [clientId, creditLimit]);

  // Process credit application
  const processApplication = useCallback(async (
    applicationId: number,
    decision: 'approved' | 'rejected',
    approvedLimit?: number,
    rejectedReason?: string
  ) => {
    try {
      await processCreditApplication(applicationId, decision, 'current_user', approvedLimit, rejectedReason);
      
      // Update applications list
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: decision, approved_by: 'current_user', approved_at: decision === 'approved' ? new Date().toISOString() : undefined, rejectedReason }
          : app
      ));

      // If approved, update credit limit
      if (decision === 'approved' && approvedLimit && creditLimit) {
        await updateCreditLimit(approvedLimit, `Aprovado através de solicitação #${applicationId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar solicitação';
      setError(errorMessage);
      throw err;
    }
  }, [creditLimit, updateCreditLimit]);

  // Record transaction
  const recordTransaction = useCallback(async (
    type: 'purchase' | 'payment' | 'adjustment',
    amount: number,
    description: string,
    saleId?: number
  ) => {
    if (!creditLimit) {
      throw new Error('Cliente não possui limite de crédito');
    }

    try {
      const balanceBefore = creditLimit.used_amount;
      const balanceAfter = type === 'payment' 
        ? Math.max(0, balanceBefore - amount)
        : balanceBefore + amount;

      const transaction = await recordCreditTransaction(
        creditLimit.id,
        clientId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        'current_user',
        saleId
      );

      // Update credit limit
      const updatedLimit = {
        ...creditLimit,
        used_amount: balanceAfter,
        available_amount: creditLimit.limit_amount - balanceAfter,
        updated_at: new Date().toISOString(),
      };
      setCreditLimit(updatedLimit);

      // Add transaction to list
      setTransactions(prev => [transaction, ...prev]);

      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar transação';
      setError(errorMessage);
      throw err;
    }
  }, [creditLimit, clientId]);

  // Analyze risk
  const analyzeRisk = useCallback((client: Client, purchaseHistory: unknown[]) => {
    if (!creditLimit) {
      throw new Error('Cliente não possui limite de crédito para análise');
    }
    
    const analysis = analyzeCreditRisk(client, purchaseHistory, creditLimit);
    setRiskAnalysis(analysis);
    return analysis;
  }, [creditLimit]);

  // Get credit status
  const getCreditStatus = useCallback(() => {
    if (!creditLimit) {
      return {
        status: 'no_limit',
        color: 'gray',
        message: 'Sem limite de crédito',
      };
    }

    const utilization = (creditLimit.used_amount / creditLimit.limit_amount) * 100;
    
    if (creditLimit.status !== 'active') {
      return {
        status: creditLimit.status,
        color: creditLimit.status === 'suspended' ? 'orange' : 'red',
        message: `Crédito ${creditLimit.status}`,
      };
    }

    if (utilization >= 100) {
      return {
        status: 'over_limit',
        color: 'red',
        message: 'Limite excedido',
      };
    } else if (utilization >= 80) {
      return {
        status: 'critical',
        color: 'red',
        message: 'Utilização crítica',
      };
    } else if (utilization >= 60) {
      return {
        status: 'warning',
        color: 'yellow',
        message: 'Utilização elevada',
      };
    } else {
      return {
        status: 'healthy',
        color: 'green',
        message: 'Crédito saudável',
      };
    }
  }, [creditLimit]);

  // Get utilization percentage
  const getUtilization = useCallback(() => {
    if (!creditLimit) return 0;
    return (creditLimit.used_amount / creditLimit.limit_amount) * 100;
  }, [creditLimit]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && clientId) {
      loadCreditData();
    }
  }, [autoLoad, clientId, loadCreditData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !autoLoad) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoLoad, refresh]);

  return {
    creditLimit,
    transactions,
    applications,
    riskAnalysis,
    settings,
    loading,
    error,
    
    refresh,
    createCreditLimit,
    updateCreditLimit,
    checkPurchaseEligibility,
    createApplication,
    processApplication,
    recordTransaction,
    
    analyzeRisk,
    getCreditStatus,
    getUtilization,
  };
}

// Hook for credit limit settings management
export function useCreditLimitSettings() {
  const [settings, setSettings] = useState<CreditLimitSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const settingsData = await getCreditLimitSettings();
      setSettings(settingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<CreditLimitSettings>) => {
    setLoading(true);
    setError(null);

    try {
      const updatedSettings = await updateCreditLimitSettings(newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
  };
}

// Hook for credit analytics
export function useCreditAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalClients: 0,
    activeLimits: 0,
    totalCredit: 0,
    totalUsed: 0,
    averageUtilization: 0,
    riskDistribution: {
      low: 0,
      medium: 0,
      high: 0,
      very_high: 0,
    },
    statusDistribution: {
      active: 0,
      suspended: 0,
      blocked: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // This would call an API endpoint to get aggregated analytics
      // For now, we'll set mock data
      setAnalytics({
        totalClients: 0,
        activeLimits: 0,
        totalCredit: 0,
        totalUsed: 0,
        averageUtilization: 0,
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0,
          very_high: 0,
        },
        statusDistribution: {
          active: 0,
          suspended: 0,
          blocked: 0,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar análises';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
  };
}

// Hook for credit risk monitoring
export function useCreditRiskMonitoring() {
  const [alerts, setAlerts] = useState<Array<{
    id: number;
    clientId: number;
    clientName: string;
    type: 'high_utilization' | 'over_limit' | 'payment_delay' | 'risk_increase';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // This would fetch actual alerts from the database
      // For now, return empty array
      setAlerts([]);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: number) => {
    try {
      // This would mark the alert as dismissed in the database
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return {
    alerts,
    loading,
    loadAlerts,
    dismissAlert,
  };
}
