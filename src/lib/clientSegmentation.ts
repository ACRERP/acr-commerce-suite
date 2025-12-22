import { Client } from './clients';

export interface ClientSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  criteria: SegmentationCriteria;
  rules: SegmentationRule[];
  clientCount?: number;
  totalRevenue?: number;
  averageTicket?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface SegmentationCriteria {
  recency: RecencyCriteria;
  frequency: FrequencyCriteria;
  monetary: MonetaryCriteria;
  demographics: DemographicCriteria;
  behavior: BehavioralCriteria;
  custom: CustomCriteria[];
}

export interface RecencyCriteria {
  enabled: boolean;
  daysSinceLastPurchase: {
    min?: number;
    max?: number;
  };
  lastPurchaseDate?: {
    from?: string;
    to?: string;
  };
}

export interface FrequencyCriteria {
  enabled: boolean;
  purchaseFrequency: {
    min?: number;
    max?: number;
    period: 'week' | 'month' | 'quarter' | 'year';
  };
  totalPurchases?: {
    min?: number;
    max?: number;
  };
}

export interface MonetaryCriteria {
  enabled: boolean;
  totalSpent: {
    min?: number;
    max?: number;
  };
  averageTicket: {
    min?: number;
    max?: number;
  };
  creditUtilization?: {
    min?: number;
    max?: number;
  };
}

export interface DemographicCriteria {
  enabled: boolean;
  ageRange?: {
    min?: number;
    max?: number;
  };
  location?: {
    city?: string[];
    state?: string[];
    cep?: string[];
  };
  registrationDate?: {
    from?: string;
    to?: string;
  };
}

export interface BehavioralCriteria {
  enabled: boolean;
  preferredCategories?: string[];
  preferredPaymentMethods?: string[];
  hasCreditLimit?: boolean;
  creditRiskLevel?: ('low' | 'medium' | 'high' | 'very_high')[];
  purchasePatterns?: PurchasePattern[];
}

export interface CustomCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: string | number | boolean | string[] | number[];
  enabled: boolean;
}

export interface SegmentationRule {
  id: string;
  type: 'recency' | 'frequency' | 'monetary' | 'demographic' | 'behavioral' | 'custom';
  field: string;
  operator: string;
  value: string | number | boolean | string[] | number[];
  weight?: number;
  description?: string;
}

export interface PurchasePattern {
  type: 'seasonal' | 'bulk' | 'regular' | 'occasional';
  frequency: number;
  products: string[];
  averageAmount: number;
}

export interface ClientSegmentation {
  clientId: number;
  segmentId: string;
  segmentName: string;
  score: number;
  confidence: number;
  assignedAt: string;
  lastUpdated: string;
  assignedBy: 'system' | 'manual';
  notes?: string;
}

export interface SegmentationAnalytics {
  totalClients: number;
  segmentDistribution: Array<{
    segmentId: string;
    segmentName: string;
    clientCount: number;
    percentage: number;
    totalRevenue: number;
    averageTicket: number;
    growthRate: number;
  }>;
  performanceMetrics: {
    retentionRate: number;
    acquisitionRate: number;
    churnRate: number;
    averageLifetimeValue: number;
  };
  trends: Array<{
    period: string;
    segmentId: string;
    clientCount: number;
    revenue: number;
  }>;
}

export interface SegmentationSuggestion {
  type: 'rfm' | 'demographic' | 'behavioral' | 'hybrid' | 'monetary' | 'recency';
  name: string;
  description: string;
  criteria: Partial<SegmentationCriteria>;
  expectedSize: number;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface CreditLimit {
  id: string;
  client_id: number;
  limit_amount: number;
  used_amount: number;
  status: 'active' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreditRiskAnalysis {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  factors: string[];
  suggestedLimit?: number;
  confidence: number;
  lastUpdated: string;
}

/**
 * RFM Analysis - Recency, Frequency, Monetary
 */
export function calculateRFMScore(
  lastPurchaseDate: string,
  purchaseFrequency: number,
  totalSpent: number
): {
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  overallScore: number;
  segment: string;
} {
  const daysSinceLastPurchase = Math.floor(
    (Date.now() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Recency scoring (lower days = higher score)
  let recencyScore = 1;
  if (daysSinceLastPurchase <= 30) recencyScore = 5;
  else if (daysSinceLastPurchase <= 60) recencyScore = 4;
  else if (daysSinceLastPurchase <= 90) recencyScore = 3;
  else if (daysSinceLastPurchase <= 180) recencyScore = 2;

  // Frequency scoring (higher frequency = higher score)
  let frequencyScore = 1;
  if (purchaseFrequency >= 20) frequencyScore = 5;
  else if (purchaseFrequency >= 12) frequencyScore = 4;
  else if (purchaseFrequency >= 6) frequencyScore = 3;
  else if (purchaseFrequency >= 3) frequencyScore = 2;

  // Monetary scoring (higher spent = higher score)
  let monetaryScore = 1;
  if (totalSpent >= 10000) monetaryScore = 5;
  else if (totalSpent >= 5000) monetaryScore = 4;
  else if (totalSpent >= 2000) monetaryScore = 3;
  else if (totalSpent >= 500) monetaryScore = 2;

  const overallScore = (recencyScore + frequencyScore + monetaryScore) / 3;

  // Determine segment based on RFM pattern
  let segment = 'At Risk';
  if (recencyScore >= 4 && frequencyScore >= 4 && monetaryScore >= 4) {
    segment = 'Champions';
  } else if (recencyScore >= 3 && frequencyScore >= 3 && monetaryScore >= 3) {
    segment = 'Loyal Customers';
  } else if (recencyScore >= 4 && frequencyScore <= 2) {
    segment = 'New Customers';
  } else if (recencyScore <= 2 && frequencyScore >= 4) {
    segment = 'At Risk';
  } else if (recencyScore <= 2 && frequencyScore <= 2 && monetaryScore >= 4) {
    segment = 'Cant Lose Them';
  } else if (recencyScore >= 4 && monetaryScore >= 4) {
    segment = 'Potential Loyalists';
  } else if (recencyScore <= 2 && frequencyScore <= 2 && monetaryScore <= 2) {
    segment = 'Lost';
  } else {
    segment = 'Needs Attention';
  }

  return {
    recencyScore,
    frequencyScore,
    monetaryScore,
    overallScore,
    segment,
  };
}

/**
 * Calculate client lifetime value (CLV)
 */
export function calculateCLV(
  averageTicket: number,
  purchaseFrequency: number,
  customerLifetime: number
): number {
  return averageTicket * purchaseFrequency * customerLifetime;
}

/**
 * Predict customer churn probability
 */
export function predictChurnProbability(
  daysSinceLastPurchase: number,
  purchaseFrequency: number,
  averageTicket: number,
  totalPurchases: number
): {
  probability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Recency factor
  if (daysSinceLastPurchase > 180) {
    riskScore += 30;
    factors.push('Muito tempo sem comprar (180+ dias)');
  } else if (daysSinceLastPurchase > 90) {
    riskScore += 20;
    factors.push('Tempo moderado sem comprar (90+ dias)');
  }

  // Frequency factor
  if (purchaseFrequency < 1) {
    riskScore += 25;
    factors.push('Baixa frequência de compra');
  } else if (purchaseFrequency < 3) {
    riskScore += 15;
    factors.push('Frequência de compra baixa a moderada');
  }

  // Engagement factor
  if (totalPurchases <= 2) {
    riskScore += 20;
    factors.push('Poucas compras históricas');
  }

  // Value factor
  if (averageTicket < 100) {
    riskScore += 10;
    factors.push('Ticket médio baixo');
  }

  // Calculate probability (0-100)
  const probability = Math.min(100, Math.max(0, riskScore));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  if (probability <= 25) {
    riskLevel = 'low';
  } else if (probability <= 50) {
    riskLevel = 'medium';
  } else if (probability <= 75) {
    riskLevel = 'high';
  } else {
    riskLevel = 'very_high';
  }

  return {
    probability,
    riskLevel,
    factors,
  };
}

/**
 * Generate segmentation suggestions based on data analysis
 */
export function generateSegmentationSuggestions(
  clients: Client[],
  purchaseHistory: unknown[]
): SegmentationSuggestion[] {
  const suggestions: SegmentationSuggestion[] = [];

  // RFM-based suggestion
  suggestions.push({
    type: 'rfm',
    name: 'Segmentação RFM (Recency, Frequency, Monetary)',
    description: 'Classificação clássica baseada em comportamento de compra',
    criteria: {
      recency: { enabled: true, daysSinceLastPurchase: {} },
      frequency: { enabled: true, purchaseFrequency: { period: 'month' } },
      monetary: { enabled: true, totalSpent: {}, averageTicket: {} },
      demographics: { enabled: false },
      behavior: { enabled: false },
      custom: [],
    },
    expectedSize: clients.length,
    priority: 'high',
    reasoning: 'RFM é o método mais eficaz para segmentação comportamental',
  });

  // High-value customers suggestion
  suggestions.push({
    type: 'monetary',
    name: 'Clientes de Alto Valor',
    description: 'Clientes com maior ticket médio e frequência',
    criteria: {
      recency: { enabled: false, daysSinceLastPurchase: {} },
      frequency: { enabled: true, purchaseFrequency: { min: 5, period: 'month' } },
      monetary: { enabled: true, averageTicket: { min: 500 }, totalSpent: {} },
      demographics: { enabled: false },
      behavior: { enabled: false },
      custom: [],
    },
    expectedSize: Math.floor(clients.length * 0.2),
    priority: 'high',
    reasoning: 'Foco em clientes que geram maior receita',
  });

  // New customers suggestion
  suggestions.push({
    type: 'recency',
    name: 'Clientes Novos',
    description: 'Clientes que compraram recentemente',
    criteria: {
      recency: { enabled: true, daysSinceLastPurchase: { max: 30 } },
      frequency: { enabled: true, purchaseFrequency: { period: 'month' }, totalPurchases: { max: 3 } },
      monetary: { enabled: false, totalSpent: {}, averageTicket: {} },
      demographics: { enabled: false },
      behavior: { enabled: false },
      custom: [],
    },
    expectedSize: Math.floor(clients.length * 0.15),
    priority: 'medium',
    reasoning: 'Importante para retenção e engajamento inicial',
  });

  // At-risk customers suggestion
  suggestions.push({
    type: 'rfm',
    name: 'Clientes em Risco',
    description: 'Clientes com risco de churn',
    criteria: {
      recency: { enabled: true, daysSinceLastPurchase: { min: 90 } },
      frequency: { enabled: true, purchaseFrequency: { period: 'month', max: 2 } },
      monetary: { enabled: false, totalSpent: {}, averageTicket: {} },
      demographics: { enabled: false },
      behavior: { enabled: false },
      custom: [],
    },
    expectedSize: Math.floor(clients.length * 0.25),
    priority: 'high',
    reasoning: 'Ação preventiva para evitar perda de clientes',
  });

  return suggestions;
}

/**
 * Analyze credit risk for a client
 */
export function analyzeCreditRisk(
  client: Client,
  purchaseHistory: unknown[],
  currentLimit?: CreditLimit
): CreditRiskAnalysis {
  // Mock implementation - would analyze actual data
  const factors: string[] = [];
  let riskScore = 50; // Base score

  // Add factors based on client data
  if (client.cpf_cnpj) {
    factors.push('CPF/CNPJ verificado');
    riskScore -= 10;
  }

  if (purchaseHistory.length > 0) {
    factors.push('Histórico de compras disponível');
    riskScore -= 15;
  }

  if (currentLimit && currentLimit.limit_amount > 0) {
    factors.push('Limite de crédito existente');
    riskScore -= 5;
  }

  const riskLevel = riskScore <= 25 ? 'low' : 
                   riskScore <= 50 ? 'medium' : 
                   riskScore <= 75 ? 'high' : 'very_high';

  return {
    score: Math.max(0, Math.min(100, 100 - riskScore)),
    riskLevel,
    factors,
    suggestedLimit: currentLimit ? currentLimit.limit_amount * 1.2 : 1000,
    confidence: 85,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Apply segmentation rules to a client
 */
export function applySegmentationRules(
  client: Client,
  segments: ClientSegment[],
  clientData: {
    lastPurchaseDate?: string;
    purchaseFrequency?: number;
    totalSpent?: number;
    averageTicket?: number;
    creditLimit?: number;
    creditUsed?: number;
  }
): ClientSegmentation[] {
  const segmentations: ClientSegmentation[] = [];

  for (const segment of segments) {
    if (!segment.isActive) continue;

    let score = 0;
    let totalWeight = 0;
    let matchesRules = true;

    // Apply recency criteria
    if (segment.criteria.recency.enabled && clientData.lastPurchaseDate) {
      const daysSinceLastPurchase = Math.floor(
        (Date.now() - new Date(clientData.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const { min, max } = segment.criteria.recency.daysSinceLastPurchase;
      if ((min && daysSinceLastPurchase < min) || (max && daysSinceLastPurchase > max)) {
        matchesRules = false;
      } else {
        score += 25;
        totalWeight += 25;
      }
    }

    // Apply frequency criteria
    if (segment.criteria.frequency.enabled && clientData.purchaseFrequency) {
      const { min, max } = segment.criteria.frequency.purchaseFrequency;
      if ((min && clientData.purchaseFrequency < min) || (max && clientData.purchaseFrequency > max)) {
        matchesRules = false;
      } else {
        score += 25;
        totalWeight += 25;
      }
    }

    // Apply monetary criteria
    if (segment.criteria.monetary.enabled) {
      let monetaryMatches = true;

      if (clientData.totalSpent) {
        const { min, max } = segment.criteria.monetary.totalSpent;
        if ((min && clientData.totalSpent < min) || (max && clientData.totalSpent > max)) {
          monetaryMatches = false;
        }
      }

      if (clientData.averageTicket && monetaryMatches) {
        const { min, max } = segment.criteria.monetary.averageTicket;
        if ((min && clientData.averageTicket < min) || (max && clientData.averageTicket > max)) {
          monetaryMatches = false;
        }
      }

      if (monetaryMatches) {
        score += 25;
        totalWeight += 25;
      } else {
        matchesRules = false;
      }
    }

    // Apply behavioral criteria
    if (segment.criteria.behavior.enabled) {
      let behavioralMatches = true;

      if (segment.criteria.behavior.hasCreditLimit !== undefined) {
        const hasCredit = clientData.creditLimit !== undefined && clientData.creditLimit > 0;
        if (hasCredit !== segment.criteria.behavior.hasCreditLimit) {
          behavioralMatches = false;
        }
      }

      if (behavioralMatches) {
        score += 25;
        totalWeight += 25;
      } else {
        matchesRules = false;
      }
    }

    // Add segmentation if client matches rules
    if (matchesRules && totalWeight > 0) {
      const confidence = totalWeight > 0 ? (score / totalWeight) * 100 : 0;

      segmentations.push({
        clientId: client.id,
        segmentId: segment.id,
        segmentName: segment.name,
        score: Math.round(score),
        confidence: Math.round(confidence),
        assignedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        assignedBy: 'system',
      });
    }
  }

  return segmentations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get segment colors for visualization
 */
export function getSegmentColors(): Record<string, string> {
  return {
    'Champions': '#10b981',
    'Loyal Customers': '#3b82f6',
    'Potential Loyalists': '#8b5cf6',
    'New Customers': '#06b6d4',
    'At Risk': '#f59e0b',
    'Cant Lose Them': '#ef4444',
    'Needs Attention': '#f97316',
    'Lost': '#6b7280',
    'High Value': '#10b981',
    'Medium Value': '#3b82f6',
    'Low Value': '#f59e0b',
  };
}

/**
 * Calculate segment performance metrics
 */
export function calculateSegmentMetrics(
  segmentId: string,
  clientSegmentations: ClientSegmentation[],
  purchaseHistory: unknown[]
): {
  clientCount: number;
  totalRevenue: number;
  averageTicket: number;
  retentionRate: number;
  churnRate: number;
  growthRate: number;
} {
  const segmentClients = clientSegmentations.filter(cs => cs.segmentId === segmentId);
  const clientCount = segmentClients.length;

  // Calculate metrics based on purchase history
  // This would typically query the database for actual data
  const totalRevenue = 0; // Would calculate from purchase history
  const averageTicket = 0; // Would calculate from purchase history
  const retentionRate = 0; // Would calculate from period comparisons
  const churnRate = 0; // Would calculate from lost customers
  const growthRate = 0; // Would calculate from period comparisons

  return {
    clientCount,
    totalRevenue,
    averageTicket,
    retentionRate,
    churnRate,
    growthRate,
  };
}

/**
 * Export segment data to CSV
 */
export function exportSegmentToCSV(
  segment: ClientSegment,
  clientSegmentations: ClientSegmentation[],
  clients: Client[]
): string {
  const segmentClients = clientSegmentations
    .filter(cs => cs.segmentId === segment.id)
    .map(cs => clients.find(c => c.id === cs.clientId))
    .filter(Boolean) as Client[];

  const headers = [
    'ID',
    'Nome',
    'Telefone',
    'CPF/CNPJ',
    'Score',
    'Confiança',
    'Data de Atribuição',
  ];

  const rows = segmentClients.map(client => {
    const segmentation = clientSegmentations.find(cs => cs.clientId === client.id && cs.segmentId === segment.id);
    return [
      client.id.toString(),
      client.name,
      client.phone || '',
      client.cpf_cnpj || '',
      segmentation?.score.toString() || '',
      segmentation?.confidence.toString() || '',
      segmentation?.assignedAt || '',
    ];
  });

  const csvContent = [
    `Segmento: ${segment.name}`,
    `Descrição: ${segment.description}`,
    `Total de Clientes: ${segmentClients.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Create default segments
 */
export function createDefaultSegments(): ClientSegment[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'champions',
      name: 'Campeões',
      description: 'Clientes mais valiosos com alta frequência e valor',
      color: '#10b981',
      criteria: {
        recency: {
          enabled: true,
          daysSinceLastPurchase: { max: 30 },
        },
        frequency: {
          enabled: true,
          purchaseFrequency: { min: 5, period: 'month' },
        },
        monetary: {
          enabled: true,
          totalSpent: { min: 5000 },
          averageTicket: { min: 200 },
        },
        demographics: { enabled: false },
        behavior: { enabled: false },
        custom: [],
      },
      rules: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    },
    {
      id: 'loyal-customers',
      name: 'Clientes Fiéis',
      description: 'Clientes regulares com bom histórico',
      color: '#3b82f6',
      criteria: {
        recency: {
          enabled: true,
          daysSinceLastPurchase: { max: 60 },
        },
        frequency: {
          enabled: true,
          purchaseFrequency: { min: 3, period: 'month' },
        },
        monetary: {
          enabled: true,
          totalSpent: { min: 1000 },
          averageTicket: {},
        },
        demographics: { enabled: false },
        behavior: { enabled: false },
        custom: [],
      },
      rules: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    },
    {
      id: 'new-customers',
      name: 'Clientes Novos',
      description: 'Clientes recentes com potencial',
      color: '#06b6d4',
      criteria: {
        recency: {
          enabled: true,
          daysSinceLastPurchase: { max: 30 },
        },
        frequency: {
          enabled: true,
          purchaseFrequency: { period: 'month' },
          totalPurchases: { max: 3 },
        },
        monetary: { enabled: false, totalSpent: {}, averageTicket: {} },
        demographics: { enabled: false },
        behavior: { enabled: false },
        custom: [],
      },
      rules: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    },
    {
      id: 'at-risk',
      name: 'Em Risco',
      description: 'Clientes que podem abandonar',
      color: '#f59e0b',
      criteria: {
        recency: {
          enabled: true,
          daysSinceLastPurchase: { min: 90 },
        },
        frequency: {
          enabled: true,
          purchaseFrequency: { period: 'month', max: 2 },
        },
        monetary: { enabled: false, totalSpent: {}, averageTicket: {} },
        demographics: { enabled: false },
        behavior: { enabled: false },
        custom: [],
      },
      rules: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    },
  ];
}
