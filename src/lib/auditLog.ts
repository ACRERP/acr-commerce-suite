import { supabase } from './supabaseClient';

export type AuditAction = 
  | 'cash_open'
  | 'cash_close'
  | 'sale_create'
  | 'sale_cancel'
  | 'sale_suspend'
  | 'sale_resume'
  | 'withdrawal'
  | 'reinforcement'
  | 'discount_apply'
  | 'item_add'
  | 'item_remove'
  | 'payment_add'
  | 'login'
  | 'logout';

export type EntityType = 
  | 'sale'
  | 'cash_register'
  | 'cash_movement'
  | 'sale_item'
  | 'sale_payment'
  | 'user';

export interface AuditLogEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  cashRegisterId?: number;
  notes?: string;
}

export interface AuditLog {
  id: number;
  user_id: string;
  user_name: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: number;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  cash_register_id: number;
  ip_address: string;
  user_agent: string;
  notes: string;
  created_at: string;
}

// Create audit log entry
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    await supabase.from('pdv_audit_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      old_values: entry.oldValues,
      new_values: entry.newValues,
      cash_register_id: entry.cashRegisterId,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      notes: entry.notes,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Get client IP (approximate)
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

// Query audit logs with filters
export async function queryAuditLogs(filters: {
  startDate?: string;
  endDate?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: number;
  userId?: string;
  cashRegisterId?: number;
  limit?: number;
}): Promise<AuditLog[]> {
  let query = supabase
    .from('pdv_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00`);
  }
  if (filters.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59`);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }
  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.cashRegisterId) {
    query = query.eq('cash_register_id', filters.cashRegisterId);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data } = await query;
  return data || [];
}

// Audit log helper functions
export const auditHelpers = {
  logCashOpen: (cashRegisterId: number, openingBalance: number) => 
    createAuditLog({
      action: 'cash_open',
      entityType: 'cash_register',
      entityId: cashRegisterId,
      newValues: { opening_balance: openingBalance },
      cashRegisterId,
    }),

  logCashClose: (cashRegisterId: number, closingBalance: number, difference: number) => 
    createAuditLog({
      action: 'cash_close',
      entityType: 'cash_register',
      entityId: cashRegisterId,
      newValues: { closing_balance: closingBalance, difference },
      cashRegisterId,
    }),

  logSaleCreate: (saleId: number, total: number, cashRegisterId?: number) => 
    createAuditLog({
      action: 'sale_create',
      entityType: 'sale',
      entityId: saleId,
      newValues: { total },
      cashRegisterId,
    }),

  logSaleCancel: (saleId: number, reason: string, cashRegisterId?: number) => 
    createAuditLog({
      action: 'sale_cancel',
      entityType: 'sale',
      entityId: saleId,
      newValues: { cancelled_reason: reason },
      cashRegisterId,
    }),

  logWithdrawal: (amount: number, description: string, cashRegisterId: number) => 
    createAuditLog({
      action: 'withdrawal',
      entityType: 'cash_movement',
      newValues: { amount, description },
      cashRegisterId,
    }),

  logReinforcement: (amount: number, cashRegisterId: number) => 
    createAuditLog({
      action: 'reinforcement',
      entityType: 'cash_movement',
      newValues: { amount },
      cashRegisterId,
    }),

  logDiscountApply: (saleId: number, discountValue: number, cashRegisterId?: number) => 
    createAuditLog({
      action: 'discount_apply',
      entityType: 'sale',
      entityId: saleId,
      newValues: { discount_value: discountValue },
      cashRegisterId,
    }),
};

// Action labels in Portuguese
export const ACTION_LABELS: Record<AuditAction, string> = {
  cash_open: 'Abertura de Caixa',
  cash_close: 'Fechamento de Caixa',
  sale_create: 'Venda Criada',
  sale_cancel: 'Venda Cancelada',
  sale_suspend: 'Venda Suspensa',
  sale_resume: 'Venda Retomada',
  withdrawal: 'Sangria',
  reinforcement: 'Reforço',
  discount_apply: 'Desconto Aplicado',
  item_add: 'Item Adicionado',
  item_remove: 'Item Removido',
  payment_add: 'Pagamento Adicionado',
  login: 'Login',
  logout: 'Logout',
};

// Entity labels
export const ENTITY_LABELS: Record<EntityType, string> = {
  sale: 'Venda',
  cash_register: 'Caixa',
  cash_movement: 'Movimentação',
  sale_item: 'Item',
  sale_payment: 'Pagamento',
  user: 'Usuário',
};
