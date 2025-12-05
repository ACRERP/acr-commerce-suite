import { Client } from './clients';
import { Sale, SaleItem } from './sales';
import { Discount } from './discounts';
import { PaymentMethod } from './paymentMethods';

export interface PurchaseHistoryItem {
  id: number;
  sale_id: number;
  client_id: number;
  sale_date: string;
  total_amount: number;
  status: 'completed' | 'cancelled' | 'refunded' | 'pending';
  payment_method: string;
  items: SaleItem[];
  discounts?: Discount[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseHistorySummary {
  total_purchases: number;
  total_spent: number;
  average_purchase_value: number;
  last_purchase_date?: string;
  favorite_products: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    total_spent: number;
  }>;
  purchase_frequency: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  payment_preferences: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface PurchaseHistoryFilters {
  start_date?: string;
  end_date?: string;
  status?: string[];
  payment_method?: string[];
  min_amount?: number;
  max_amount?: number;
  product_id?: number;
  limit?: number;
  offset?: number;
  sort_by?: 'date' | 'amount' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface PurchaseAnalytics {
  period: string;
  total_sales: number;
  total_revenue: number;
  average_ticket: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    revenue: number;
  }>;
  revenue_by_month: Array<{
    month: string;
    revenue: number;
    sales_count: number;
  }>;
  client_retention: {
    new_clients: number;
    returning_clients: number;
    retention_rate: number;
  };
}

/**
 * Get purchase history for a specific client
 */
export async function getClientPurchaseHistory(
  clientId: number,
  filters: PurchaseHistoryFilters = {}
): Promise<{
  items: PurchaseHistoryItem[];
  summary: PurchaseHistorySummary;
  total: number;
}> {
  // This would typically query the database
  // For now, we'll implement the logic structure
  
  const {
    start_date,
    end_date,
    status,
    payment_method,
    min_amount,
    max_amount,
    product_id,
    limit = 50,
    offset = 0,
    sort_by = 'date',
    sort_order = 'desc'
  } = filters;

  // Build query conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [clientId];

  if (start_date) {
    conditions.push(`sale_date >= $${params.length + 1}`);
    params.push(start_date);
  }

  if (end_date) {
    conditions.push(`sale_date <= $${params.length + 1}`);
    params.push(end_date);
  }

  if (status && status.length > 0) {
    conditions.push(`status = ANY($${params.length + 1})`);
    params.push(status as any);
  }

  if (payment_method && payment_method.length > 0) {
    conditions.push(`payment_method = ANY($${params.length + 1})`);
    params.push(payment_method as any);
  }

  if (min_amount) {
    conditions.push(`total_amount >= $${params.length + 1}`);
    params.push(min_amount);
  }

  if (max_amount) {
    conditions.push(`total_amount <= $${params.length + 1}`);
    params.push(max_amount);
  }

  if (product_id) {
    conditions.push(`EXISTS (
      SELECT 1 FROM sale_items si 
      WHERE si.sale_id = s.id AND si.product_id = $${params.length + 1}
    )`);
    params.push(product_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = `ORDER BY ${sort_by} ${sort_order}`;
  const limitClause = `LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  // This would be the actual SQL query
  const query = `
    SELECT 
      s.id,
      s.sale_date,
      s.total_amount,
      s.status,
      s.payment_method,
      s.created_at,
      s.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', si.id,
            'product_id', si.product_id,
            'product_name', p.name,
            'quantity', si.quantity,
            'price', si.price,
            'total', si.quantity * si.price
          )
        ) FILTER (WHERE si.id IS NOT NULL),
        '[]'::json
      ) as items,
      COALESCE(
        json_agg(
          json_build_object(
            'id', d.id,
            'name', d.name,
            'type', d.type,
            'value', d.value
          )
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
      ) as discounts
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    LEFT JOIN sale_discounts sd ON s.id = sd.sale_id
    LEFT JOIN discounts d ON sd.discount_id = d.id
    ${whereClause}
    GROUP BY s.id
    ${orderClause}
    ${limitClause}
  `;

  // For now, return mock data structure
  const mockItems: PurchaseHistoryItem[] = [];
  const mockSummary: PurchaseHistorySummary = {
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
  };

  return {
    items: mockItems,
    summary: mockSummary,
    total: 0,
  };
}

/**
 * Calculate purchase history summary for a client
 */
export function calculatePurchaseSummary(purchases: PurchaseHistoryItem[]): PurchaseHistorySummary {
  if (purchases.length === 0) {
    return {
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
    };
  }

  const completedPurchases = purchases.filter(p => p.status === 'completed');
  const totalSpent = completedPurchases.reduce((sum, p) => sum + p.total_amount, 0);
  const averagePurchaseValue = totalSpent / completedPurchases.length;

  // Calculate favorite products
  const productMap = new Map<number, { name: string; quantity: number; spent: number }>();
  
  completedPurchases.forEach(purchase => {
    purchase.items.forEach(item => {
      const existing = productMap.get(item.product_id) || { name: '', quantity: 0, spent: 0 };
      productMap.set(item.product_id, {
        name: existing.name || item.product?.name || '',
        quantity: existing.quantity + item.quantity,
        spent: existing.spent + (item.quantity * item.price),
      });
    });
  });

  const favoriteProducts = Array.from(productMap.entries())
    .map(([product_id, data]) => ({
      product_id,
      product_name: data.name,
      quantity: data.quantity,
      total_spent: data.spent,
    }))
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 10);

  // Calculate purchase frequency
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const purchaseFrequency = {
    daily: completedPurchases.filter(p => new Date(p.sale_date) >= oneDayAgo).length,
    weekly: completedPurchases.filter(p => new Date(p.sale_date) >= oneWeekAgo).length,
    monthly: completedPurchases.filter(p => new Date(p.sale_date) >= oneMonthAgo).length,
    yearly: completedPurchases.filter(p => new Date(p.sale_date) >= oneYearAgo).length,
  };

  // Calculate payment preferences
  const paymentMap = new Map<string, number>();
  completedPurchases.forEach(purchase => {
    const count = paymentMap.get(purchase.payment_method) || 0;
    paymentMap.set(purchase.payment_method, count + 1);
  });

  const paymentPreferences = Array.from(paymentMap.entries())
    .map(([method, count]) => ({
      method,
      count,
      percentage: (count / completedPurchases.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate status distribution
  const statusMap = new Map<string, number>();
  purchases.forEach(purchase => {
    const count = statusMap.get(purchase.status) || 0;
    statusMap.set(purchase.status, count + 1);
  });

  const statusDistribution = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: (count / purchases.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total_purchases: completedPurchases.length,
    total_spent: totalSpent,
    average_purchase_value: averagePurchaseValue,
    last_purchase_date: completedPurchases.length > 0 
      ? completedPurchases.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0].sale_date
      : undefined,
    favorite_products: favoriteProducts,
    purchase_frequency: purchaseFrequency,
    payment_preferences: paymentPreferences,
    status_distribution: statusDistribution,
  };
}

/**
 * Get top clients by purchase volume
 */
export async function getTopClients(
  period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  limit: number = 10
): Promise<Array<{
  client: Client;
  summary: PurchaseHistorySummary;
  rank: number;
}>> {
  // This would query the database for top clients
  // For now, return empty array
  return [];
}

/**
 * Get client purchase analytics
 */
export async function getClientPurchaseAnalytics(
  clientId: number,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<PurchaseAnalytics> {
  // This would calculate analytics for a specific client
  // For now, return mock data
  return {
    period,
    total_sales: 0,
    total_revenue: 0,
    average_ticket: 0,
    top_products: [],
    revenue_by_month: [],
    client_retention: {
      new_clients: 0,
      returning_clients: 0,
      retention_rate: 0,
    },
  };
}

/**
 * Export purchase history to CSV
 */
export function exportPurchaseHistoryToCSV(
  purchases: PurchaseHistoryItem[],
  client?: Client
): string {
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
    client ? `Histórico de Compras - ${client.name}` : 'Histórico de Compras',
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export purchase summary to PDF (placeholder)
 */
export function exportPurchaseSummaryToPDF(
  summary: PurchaseHistorySummary,
  client: Client
): Blob {
  // This would generate a PDF using a library like jsPDF
  // For now, return empty blob
  return new Blob();
}

/**
 * Calculate client lifetime value (CLV)
 */
export function calculateClientLifetimeValue(
  purchases: PurchaseHistoryItem[],
  clientSinceDate?: string
): {
  clv: number;
  averageMonthlyValue: number;
  purchaseFrequency: number;
  clientAgeInMonths: number;
} {
  const completedPurchases = purchases.filter(p => p.status === 'completed');
  
  if (completedPurchases.length === 0) {
    return {
      clv: 0,
      averageMonthlyValue: 0,
      purchaseFrequency: 0,
      clientAgeInMonths: 0,
    };
  }

  const totalSpent = completedPurchases.reduce((sum, p) => sum + p.total_amount, 0);
  
  // Calculate client age
  const firstPurchase = completedPurchases.sort((a, b) => 
    new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  )[0];
  
  const startDate = clientSinceDate ? new Date(clientSinceDate) : new Date(firstPurchase.sale_date);
  const now = new Date();
  const clientAgeInMonths = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  const averageMonthlyValue = totalSpent / clientAgeInMonths;
  const purchaseFrequency = completedPurchases.length / clientAgeInMonths;
  
  // Simple CLV calculation (can be enhanced with predictive models)
  const clv = averageMonthlyValue * 12; // Annual value projection

  return {
    clv,
    averageMonthlyValue,
    purchaseFrequency,
    clientAgeInMonths,
  };
}

/**
 * Get client segmentation based on purchase behavior
 */
export function getClientSegmentation(
  summary: PurchaseHistorySummary,
  clv: { clv: number; averageMonthlyValue: number }
): {
  segment: 'vip' | 'loyal' | 'regular' | 'new' | 'at-risk' | 'inactive';
  score: number;
  reasons: string[];
} {
  const { total_purchases, total_spent, purchase_frequency } = summary;
  const { clv: lifetimeValue, averageMonthlyValue } = clv;

  const reasons: string[] = [];
  let score = 0;

  // VIP Client: High value and frequent purchases
  if (lifetimeValue > 10000 && purchase_frequency.monthly >= 2) {
    return {
      segment: 'vip',
      score: 100,
      reasons: ['Alto valor de vida do cliente', 'Compras frequentes', 'Alto ticket médio'],
    };
  }

  // Loyal Client: Regular purchases over time
  if (total_purchases >= 10 && purchase_frequency.monthly >= 1) {
    score += 40;
    reasons.push('Cliente fiel com compras recorrentes');
  }

  // High value
  if (lifetimeValue > 5000) {
    score += 30;
    reasons.push('Alto valor de vida do cliente');
  }

  // Recent activity
  if (purchase_frequency.monthly > 0) {
    score += 20;
    reasons.push('Atividade recente');
  }

  // Average ticket
  if (summary.average_purchase_value > 500) {
    score += 10;
    reasons.push('Alto ticket médio');
  }

  // Determine segment based on score
  if (score >= 70) {
    return { segment: 'loyal', score, reasons };
  } else if (score >= 40) {
    return { segment: 'regular', score, reasons };
  } else if (total_purchases <= 2) {
    return { segment: 'new', score, reasons: ['Cliente novo'] };
  } else if (purchase_frequency.monthly === 0 && purchase_frequency.weekly === 0) {
    return { segment: 'at-risk', score, reasons: ['Sem compras recentes'] };
  } else {
    return { segment: 'inactive', score, reasons: ['Baixa atividade'] };
  }
}

/**
 * Predict next purchase date (simple heuristic)
 */
export function predictNextPurchase(
  purchases: PurchaseHistoryItem[]
): {
  predictedDate?: string;
  confidence: number;
  reasoning: string;
} {
  const completedPurchases = purchases
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime());

  if (completedPurchases.length < 2) {
    return {
      confidence: 0,
      reasoning: 'Dados insuficientes para previsão',
    };
  }

  // Calculate average days between purchases
  const intervals: number[] = [];
  for (let i = 1; i < completedPurchases.length; i++) {
    const daysDiff = (new Date(completedPurchases[i].sale_date).getTime() - 
                     new Date(completedPurchases[i-1].sale_date).getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }

  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const lastPurchase = completedPurchases[completedPurchases.length - 1];
  const predictedDate = new Date(lastPurchase.sale_date);
  predictedDate.setDate(predictedDate.getDate() + Math.round(averageInterval));

  // Calculate confidence based on consistency
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - averageInterval, 2);
  }, 0) / intervals.length;
  
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / averageInterval;
  
  const confidence = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  
  let reasoning = `Baseado no histórico de ${completedPurchases.length} compras`;
  if (confidence > 70) {
    reasoning += ' com alta regularidade';
  } else if (confidence > 40) {
    reasoning += ' com moderada regularidade';
  } else {
    reasoning += ' com baixa regularidade';
  }

  return {
    predictedDate: predictedDate.toISOString().split('T')[0],
    confidence,
    reasoning,
  };
}
