import { supabase } from './supabaseClient';

export interface ReconciliationResult {
  module: 'academic' | 'os';
  id: string | number;
  description: string;
  expectedAmount: number;
  foundInFinance: boolean;
  status: 'error' | 'warning' | 'ok';
  message: string;
}

/**
 * Audits Academic Enrollments vs Financial Transactions.
 */
export async function auditAcademicFinance(): Promise<ReconciliationResult[]> {
  const { data: enrollments, error: enrollError } = await supabase
    .from('academic_enrollments')
    .select('id, student_name, monthly_fee, status');

  if (enrollError) return [];

  const results: ReconciliationResult[] = [];

  for (const enrollment of enrollments) {
    // Search for transactions that mention this enrollment student/id in description
    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('amount')
      .ilike('description', `%${enrollment.student_name}%`)
      .eq('type', 'income');

    const totalPaid = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

    if (totalPaid < enrollment.monthly_fee) {
      results.push({
        module: 'academic',
        id: enrollment.id,
        description: `Mensalidade: ${enrollment.student_name}`,
        expectedAmount: enrollment.monthly_fee,
        foundInFinance: totalPaid > 0,
        status: totalPaid === 0 ? 'error' : 'warning',
        message: totalPaid === 0 ? 'Nenhum pagamento encontrado.' : `Valor parcial encontrado: R$ ${totalPaid}`
      });
    }
  }

  return results;
}

/**
 * Audits Service Orders vs Financial Exits (Commissions).
 */
export async function auditOSFinance(): Promise<ReconciliationResult[]> {
    // Similar logic for OS -> Expense mappings
    return []; // Placeholder for expansion
}
