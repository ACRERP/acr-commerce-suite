import { Transaction, TransactionSummary } from '../finance';

export interface CashFlowProjection {
  date: string;
  expectedBalance: number;
  expectedIncome: number;
  expectedExpense: number;
}

export interface FinancialAnomaly {
  transactionId: number;
  type: 'unusual_expense' | 'unexpected_drop' | 'duplicate_vibe';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface FinancialInsight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'info';
}

/**
 * Predicts balance for the next 30 days based on pending transactions 
 * and average daily burn rate/income.
 */
export const predictCashFlow = (transactions: Transaction[], currentBalance: number): CashFlowProjection[] => {
  const projections: CashFlowProjection[] = [];
  let runningBalance = currentBalance;

  // Simplified projection logic
  const now = new Date();
  for (let i = 1; i <= 30; i++) {
    const projectionDate = new Date(now);
    projectionDate.setDate(now.getDate() + i);
    const dateStr = projectionDate.toISOString().split('T')[0];

    // Find pending transactions due on this day
    const dayTransactions = transactions.filter(t => 
      t.status === 'pending' && t.due_date && t.due_date.startsWith(dateStr)
    );

    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const dayExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    runningBalance += (dayIncome - dayExpense);

    projections.push({
      date: dateStr,
      expectedBalance: runningBalance,
      expectedIncome: dayIncome,
      expectedExpense: dayExpense
    });
  }

  return projections;
};

/**
 * Detects suspicious or unusual transactions.
 */
export const detectAnomalies = (transactions: Transaction[]): FinancialAnomaly[] => {
  const anomalies: FinancialAnomaly[] = [];
  
  // Group by category to find averages
  const categories: Record<string, number[]> = {};
  transactions.forEach(t => {
    if (t.category_name) {
      if (!categories[t.category_name]) categories[t.category_name] = [];
      categories[t.category_name].push(Number(t.amount));
    }
  });

  transactions.slice(0, 50).forEach(t => {
    const amount = Number(t.amount);
    
    // Rule 1: High expense relative to category average
    if (t.type === 'expense' && t.category_name) {
      const catAmounts = categories[t.category_name];
      const avg = catAmounts.reduce((a, b) => a + b, 0) / catAmounts.length;
      if (amount > avg * 2.5 && amount > 500) {
        anomalies.push({
          transactionId: t.id,
          type: 'unusual_expense',
          severity: 'medium',
          message: `Gasto em "${t.category_name}" está 150% acima da média habitual.`
        });
      }
    }

    // Rule 2: Potential duplicates (same amount and description in short time)
    // (Logic omitted for brevity but planned)
  });

  return anomalies;
};

/**
 * Generates strategic insights based on financial health.
 */
export const getFinancialInsights = (summary: TransactionSummary): FinancialInsight[] => {
  const insights: FinancialInsight[] = [];
  
  const burnRate = summary.expenses;
  const runwayValue = summary.income > 0 ? (summary.balance / summary.expenses) : 0;

  if (summary.balance < 0) {
    insights.push({
      title: 'Atenção ao Saldo Negativo',
      description: 'Seu saldo está negativo. Priorize a cobrança de contas pendentes.',
      type: 'warning'
    });
  } else if (summary.balance > summary.expenses * 2) {
    insights.push({
      title: 'Liquidez Saudável',
      description: 'Você tem reserva para cobrir 2 meses de despesas. Considere investir o excedente.',
      type: 'positive'
    });
  }

  if (summary.pending_income > summary.income * 0.5) {
    insights.push({
      title: 'Alta Inadimplência Detectada',
      description: 'Volume de contas a receber pendentes é alto. Inicie réguas de cobrança.',
      type: 'info'
    });
  }

  return insights;
};

export const calculateHealthScore = (summary: TransactionSummary): number => {
  if (summary.expenses === 0) return 100;
  
  let score = 70; // Baseline
  
  // Ratio balance vs expense
  const ratio = summary.balance / summary.expenses;
  if (ratio > 1) score += 15;
  if (ratio < 0.2) score -= 20;
  
  // Pending ratio
  const pendingRatio = summary.pending_income / (summary.income || 1);
  if (pendingRatio > 0.4) score -= 10;
  
  return Math.min(Math.max(score, 0), 100);
};
