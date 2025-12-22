import { Client } from './clients';

export interface CreditLimit {
  id: number;
  client_id: number;
  limit_amount: number;
  used_amount: number;
  available_amount: number;
  status: 'active' | 'suspended' | 'blocked';
  created_at: string;
  updated_at: string;
  approved_by?: string;
  notes?: string;
}

export interface CreditTransaction {
  id: number;
  credit_limit_id: number;
  client_id: number;
  sale_id?: number;
  transaction_type: 'purchase' | 'payment' | 'adjustment' | 'limit_change';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
  created_by: string;
  reference_id?: string;
}

export interface CreditApplication {
  id: number;
  client_id: number;
  requested_limit: number;
  current_limit: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  client_history?: string;
  analysis_notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditRiskAnalysis {
  client_id: number;
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  factors: {
    payment_history: number;
    purchase_frequency: number;
    average_ticket: number;
    days_since_last_purchase: number;
    credit_utilization: number;
  };
  recommendations: string[];
  suggested_limit: number;
  analysis_date: string;
}

export interface CreditLimitSettings {
  auto_approve_limit: number;
  require_analysis_threshold: number;
  block_threshold: number;
  interest_rate: number;
  late_fee: number;
  grace_period_days: number;
  max_credit_days: number;
}

/**
 * Calculate available credit for a client
 */
export function calculateAvailableCredit(creditLimit: CreditLimit): number {
  return Math.max(0, creditLimit.limit_amount - creditLimit.used_amount);
}

/**
 * Check if client can make a purchase with credit
 */
export function canMakePurchase(creditLimit: CreditLimit, amount: number): {
  canPurchase: boolean;
  availableCredit: number;
  shortage?: number;
  reason?: string;
} {
  const availableCredit = calculateAvailableCredit(creditLimit);
  
  if (creditLimit.status !== 'active') {
    return {
      canPurchase: false,
      availableCredit: 0,
      reason: `Crédito ${creditLimit.status}`,
    };
  }

  if (availableCredit >= amount) {
    return {
      canPurchase: true,
      availableCredit,
    };
  }

  return {
    canPurchase: false,
    availableCredit,
    shortage: amount - availableCredit,
    reason: 'Limite de crédito insuficiente',
  };
}

/**
 * Update credit limit after transaction
 */
export function updateCreditAfterTransaction(
  creditLimit: CreditLimit,
  amount: number,
  type: 'purchase' | 'payment' | 'adjustment'
): CreditLimit {
  const newUsedAmount = type === 'payment' 
    ? Math.max(0, creditLimit.used_amount - amount)
    : creditLimit.used_amount + amount;

  return {
    ...creditLimit,
    used_amount: newUsedAmount,
    available_amount: calculateAvailableCredit({
      ...creditLimit,
      used_amount: newUsedAmount,
    }),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Calculate credit utilization percentage
 */
export function calculateCreditUtilization(creditLimit: CreditLimit): number {
  if (creditLimit.limit_amount === 0) return 0;
  return (creditLimit.used_amount / creditLimit.limit_amount) * 100;
}

/**
 * Get credit status based on utilization
 */
export function getCreditStatus(creditLimit: CreditLimit): {
  status: 'healthy' | 'warning' | 'critical' | 'over_limit';
  color: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
} {
  const utilization = calculateCreditUtilization(creditLimit);
  
  if (utilization >= 100) {
    return {
      status: 'over_limit',
      color: 'red',
      message: 'Limite de crédito excedido',
    };
  } else if (utilization >= 80) {
    return {
      status: 'critical',
      color: 'red',
      message: 'Utilização crítica do crédito',
    };
  } else if (utilization >= 60) {
    return {
      status: 'warning',
      color: 'yellow',
      message: 'Utilização elevada do crédito',
    };
  } else {
    return {
      status: 'healthy',
      color: 'green',
      message: 'Crédito saudável',
    };
  }
}

/**
 * Analyze credit risk for a client
 */
export function analyzeCreditRisk(
  client: Client,
  purchaseHistory: unknown[], // Would be PurchaseHistoryItem[]
  currentLimit?: CreditLimit
): CreditRiskAnalysis {
  // This would typically analyze real data
  // For now, we'll implement the logic structure
  
  const totalPurchases = purchaseHistory.filter(p => p.status === 'completed').length;
  const totalSpent = purchaseHistory
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.total_amount, 0);
  const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  
  const lastPurchase = purchaseHistory
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0];
  
  const daysSinceLastPurchase = lastPurchase 
    ? Math.floor((Date.now() - new Date(lastPurchase.sale_date).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Calculate risk factors (0-100 scale, lower is better)
  const paymentHistory = Math.min(100, Math.max(0, 100 - (totalPurchases * 2))); // More purchases = better history
  const purchaseFrequency = Math.min(100, Math.max(0, 100 - (totalPurchases > 10 ? 0 : 50))); // Regular purchases = lower risk
  const averageTicketScore = Math.min(100, Math.max(0, 100 - (averageTicket > 1000 ? 20 : 0))); // High tickets = slightly higher risk
  const daysSinceLastScore = Math.min(100, Math.max(0, daysSinceLastPurchase / 3)); // Recent activity = lower risk
  const creditUtilization = currentLimit ? Math.min(100, calculateCreditUtilization(currentLimit)) : 0;

  // Calculate overall risk score
  const riskScore = (
    paymentHistory * 0.3 +
    purchaseFrequency * 0.25 +
    averageTicketScore * 0.15 +
    daysSinceLastScore * 0.2 +
    creditUtilization * 0.1
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  if (riskScore <= 30) {
    riskLevel = 'low';
  } else if (riskScore <= 50) {
    riskLevel = 'medium';
  } else if (riskScore <= 70) {
    riskLevel = 'high';
  } else {
    riskLevel = 'very_high';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (paymentHistory > 70) recommendations.push('Histórico limitado - considerar limite menor');
  if (purchaseFrequency > 60) recommendations.push('Baixa frequência - monitorar atividade');
  if (daysSinceLastScore > 60) recommendations.push('Cliente inativo - reavaliar crédito');
  if (creditUtilization > 80) recommendations.push('Alta utilização - cuidado com aumento');

  // Suggest credit limit based on risk
  const baseLimit = averageTicket * 3; // 3x average ticket as base
  const riskMultiplier = riskLevel === 'low' ? 1.5 : riskLevel === 'medium' ? 1 : riskLevel === 'high' ? 0.7 : 0.5;
  const suggestedLimit = Math.round(baseLimit * riskMultiplier);

  return {
    client_id: client.id,
    risk_score: Math.round(riskScore),
    risk_level: riskLevel,
    factors: {
      payment_history: Math.round(paymentHistory),
      purchase_frequency: Math.round(purchaseFrequency),
      average_ticket: Math.round(averageTicketScore),
      days_since_last_purchase: Math.round(daysSinceLastScore),
      credit_utilization: Math.round(creditUtilization),
    },
    recommendations,
    suggestedLimit,
    analysis_date: new Date().toISOString(),
  };
}

/**
 * Get credit limit for client
 */
export async function getClientCreditLimit(clientId: number): Promise<CreditLimit | null> {
  // This would query the database
  // For now, return null
  return null;
}

/**
 * Create or update credit limit
 */
export async function upsertCreditLimit(
  clientId: number,
  limitAmount: number,
  approvedBy?: string,
  notes?: string
): Promise<CreditLimit> {
  // This would create/update in database
  // For now, return mock data
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    client_id: clientId,
    limit_amount: limitAmount,
    used_amount: 0,
    available_amount: limitAmount,
    status: 'active',
    created_at: now,
    updated_at: now,
    approved_by: approvedBy,
    notes,
  };
}

/**
 * Create credit application
 */
export async function createCreditApplication(
  clientId: number,
  requestedLimit: number,
  reason: string,
  currentLimit?: number
): Promise<CreditApplication> {
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    client_id: clientId,
    requested_limit: requestedLimit,
    current_limit: currentLimit || 0,
    status: 'pending',
    reason,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Process credit application
 */
export async function processCreditApplication(
  applicationId: number,
  decision: 'approved' | 'rejected',
  approvedBy?: string,
  approvedLimit?: number,
  rejectedReason?: string
): Promise<CreditApplication> {
  // This would update the application in database
  // For now, return mock data
  const now = new Date().toISOString();
  return {
    id: applicationId,
    client_id: 0, // Would be fetched from DB
    requested_limit: 0,
    current_limit: 0,
    status: decision,
    reason: '',
    approved_by: approvedBy,
    approved_at: decision === 'approved' ? now : undefined,
    rejected_reason: rejectedReason,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Get credit transactions for client
 */
export async function getCreditTransactions(
  clientId: number,
  limit: number = 50
): Promise<CreditTransaction[]> {
  // This would query the database
  // For now, return empty array
  return [];
}

/**
 * Record credit transaction
 */
export async function recordCreditTransaction(
  creditLimitId: number,
  clientId: number,
  transactionType: 'purchase' | 'payment' | 'adjustment' | 'limit_change',
  amount: number,
  balanceBefore: number,
  balanceAfter: number,
  description: string,
  createdBy: string,
  saleId?: number,
  referenceId?: string
): Promise<CreditTransaction> {
  const now = new Date().toISOString();
  return {
    id: Date.now(),
    credit_limit_id: creditLimitId,
    client_id: clientId,
    sale_id: saleId,
    transaction_type: transactionType,
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    description,
    created_at: now,
    created_by: createdBy,
    reference_id: referenceId,
  };
}

/**
 * Get credit limit settings
 */
export async function getCreditLimitSettings(): Promise<CreditLimitSettings> {
  // This would fetch from settings table
  // For now, return default settings
  return {
    auto_approve_limit: 1000,
    require_analysis_threshold: 5000,
    block_threshold: 10000,
    interest_rate: 5.0,
    late_fee: 10.0,
    grace_period_days: 7,
    max_credit_days: 30,
  };
}

/**
 * Update credit limit settings
 */
export async function updateCreditLimitSettings(
  settings: Partial<CreditLimitSettings>
): Promise<CreditLimitSettings> {
  // This would update settings in database
  // For now, return updated settings
  const currentSettings = await getCreditLimitSettings();
  return { ...currentSettings, ...settings };
}

/**
 * Check if client is eligible for credit limit increase
 */
export function checkCreditIncreaseEligibility(
  creditLimit: CreditLimit,
  riskAnalysis: CreditRiskAnalysis
): {
  eligible: boolean;
  reason: string;
  suggestedIncrease?: number;
} {
  const utilization = calculateCreditUtilization(creditLimit);
  const creditStatus = getCreditStatus(creditLimit);

  // Not eligible if credit is not healthy
  if (creditStatus.status !== 'healthy') {
    return {
      eligible: false,
      reason: `Crédito não está saudável: ${creditStatus.message}`,
    };
  }

  // Not eligible if risk is high
  if (riskAnalysis.risk_level === 'high' || riskAnalysis.risk_level === 'very_high') {
    return {
      eligible: false,
      reason: `Risco de crédito elevado: ${riskAnalysis.risk_level}`,
    };
  }

  // Calculate suggested increase based on utilization and risk
  let suggestedIncrease = 0;
  if (utilization < 30 && riskAnalysis.risk_level === 'low') {
    suggestedIncrease = creditLimit.limit_amount * 0.5; // 50% increase
  } else if (utilization < 50 && riskAnalysis.risk_level === 'medium') {
    suggestedIncrease = creditLimit.limit_amount * 0.25; // 25% increase
  }

  return {
    eligible: suggestedIncrease > 0,
    reason: suggestedIncrease > 0 
      ? 'Cliente elegível para aumento de crédito'
      : 'Cliente não elegível para aumento no momento',
    suggestedIncrease: suggestedIncrease > 0 ? suggestedIncrease : undefined,
  };
}

/**
 * Generate credit limit report
 */
export function generateCreditReport(
  creditLimit: CreditLimit,
  transactions: CreditTransaction[],
  riskAnalysis?: CreditRiskAnalysis
): {
  summary: {
    currentLimit: number;
    usedAmount: number;
    availableAmount: number;
    utilization: number;
    status: string;
  };
  recentTransactions: CreditTransaction[];
  riskAnalysis?: CreditRiskAnalysis;
  recommendations: string[];
} {
  const utilization = calculateCreditUtilization(creditLimit);
  const creditStatus = getCreditStatus(creditLimit);

  const recommendations: string[] = [];
  if (utilization > 80) {
    recommendations.push('Considerar contato com cliente sobre pagamento');
  }
  if (creditStatus.status === 'warning') {
    recommendations.push('Monitorar utilização de crédito');
  }
  if (riskAnalysis?.risk_level === 'high') {
    recommendations.push('Reavaliar limite de crédito');
  }

  return {
    summary: {
      currentLimit: creditLimit.limit_amount,
      usedAmount: creditLimit.used_amount,
      availableAmount: creditLimit.available_amount,
      utilization,
      status: creditStatus.message,
    },
    recentTransactions: transactions.slice(0, 10),
    riskAnalysis,
    recommendations,
  };
}
