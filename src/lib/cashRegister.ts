import { supabase } from './supabaseClient';

export interface CashRegister {
  id: string;
  name: string;
  description?: string;
  location?: string;
  is_active: boolean;
  initial_balance: number;
  current_balance: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterOperation {
  id: string;
  cash_register_id: string;
  operation_type: 'open' | 'close' | 'adjustment';
  opening_balance: number;
  closing_balance?: number;
  expected_balance?: number;
  difference?: number;
  notes?: string;
  operator_id?: string;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
  cash_register?: CashRegister;
  operator?: {
    id: string;
    name: string;
    email: string;
  };
  movements?: CashMovement[];
}

export interface CashMovement {
  id: string;
  cash_register_operation_id: string;
  movement_type: 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'adjustment';
  amount: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
  operator_id?: string;
  created_at: string;
  operator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCashRegisterData {
  name: string;
  description?: string;
  location?: string;
  is_active?: boolean;
  initial_balance?: number;
}

export interface UpdateCashRegisterData extends Partial<CreateCashRegisterData> {
  id: string;
}

export interface CreateCashRegisterOperationData {
  cash_register_id: string;
  operation_type: 'open' | 'close' | 'adjustment';
  opening_balance: number;
  closing_balance?: number;
  notes?: string;
}

export interface UpdateCashRegisterOperationData extends Partial<CreateCashRegisterOperationData> {
  id: string;
  status?: 'open' | 'closed' | 'cancelled';
  expected_balance?: number;
  difference?: number;
  closed_at?: string;
}

export interface CreateCashMovementData {
  cash_register_operation_id: string;
  movement_type: 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'adjustment';
  amount: number;
  description?: string;
  reference_id?: string;
  reference_type?: string;
}

// Get all cash registers
export async function getCashRegisters(includeInactive = false) {
  let query = supabase
    .from('cash_registers')
    .select('*')
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as CashRegister[];
}

// Get cash register by ID
export async function getCashRegisterById(id: string) {
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as CashRegister;
}

// Get active cash registers
export async function getActiveCashRegisters() {
  const { data, error } = await supabase
    .from('cash_registers')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as CashRegister[];
}

// Create new cash register
export async function createCashRegister(cashRegister: CreateCashRegisterData) {
  const { data, error } = await supabase
    .from('cash_registers')
    .insert([cashRegister])
    .select()
    .single();

  if (error) throw error;
  return data as CashRegister;
}

// Update cash register
export async function updateCashRegister(cashRegister: UpdateCashRegisterData) {
  const { id, ...updateData } = cashRegister;
  
  const { data, error } = await supabase
    .from('cash_registers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CashRegister;
}

// Delete cash register (soft delete)
export async function deleteCashRegister(id: string) {
  const { data, error } = await supabase
    .from('cash_registers')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CashRegister;
}

// Get cash register operations
export async function getCashRegisterOperations(cashRegisterId?: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('cash_register_operations')
    .select(`
      *,
      cash_register:cash_registers(*)
    `)
    .order('opened_at', { ascending: false });

  if (cashRegisterId) {
    query = query.eq('cash_register_id', cashRegisterId);
  }

  if (startDate) {
    query = query.gte('opened_at', startDate);
  }

  if (endDate) {
    query = query.lte('opened_at', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Fetch operator data separately to avoid join issues
  const operations = data as CashRegisterOperation[];
  
  if (operations.length > 0) {
    const { data: operators } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .in('id', operations.map(op => op.operator_id).filter(Boolean));
    
    // Merge operator data
    operations.forEach(operation => {
      if (operation.operator_id) {
        operation.operator = operators?.find(op => op.id === operation.operator_id);
      }
    });
  }
  
  return operations;
}

// Get current open operation
export async function getCurrentCashRegisterOperation(cashRegisterId: string) {
  const { data, error } = await supabase
    .from('cash_register_operations')
    .select(`
      *,
      cash_register:cash_registers(*)
    `)
    .eq('cash_register_id', cashRegisterId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  if (!data) return null;
  
  const operation = data as CashRegisterOperation;
  
  // Fetch operator data separately
  if (operation.operator_id) {
    const { data: operator } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .eq('id', operation.operator_id)
      .single();
    
    operation.operator = operator;
  }
  
  return operation;
}

// Create cash register operation
export async function createCashRegisterOperation(operation: CreateCashRegisterOperationData) {
  const { data, error } = await supabase
    .from('cash_register_operations')
    .insert([operation])
    .select(`
      *,
      cash_register:cash_registers(*)
    `)
    .single();

  if (error) throw error;
  
  const newOperation = data as CashRegisterOperation;
  
  // Fetch operator data separately
  if (newOperation.operator_id) {
    const { data: operator } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .eq('id', newOperation.operator_id)
      .single();
    
    newOperation.operator = operator;
  }
  
  return newOperation;
}

// Update cash register operation
export async function updateCashRegisterOperation(operation: UpdateCashRegisterOperationData) {
  const { id, ...updateData } = operation;
  
  const { data, error } = await supabase
    .from('cash_register_operations')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      cash_register:cash_registers(*)
    `)
    .single();

  if (error) throw error;
  
  const updatedOperation = data as CashRegisterOperation;
  
  // Fetch operator data separately
  if (updatedOperation.operator_id) {
    const { data: operator } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .eq('id', updatedOperation.operator_id)
      .single();
    
    updatedOperation.operator = operator;
  }
  
  return updatedOperation;
}

// Close cash register operation
export async function closeCashRegisterOperation(
  operationId: string, 
  closingBalance: number, 
  expectedBalance: number,
  notes?: string
) {
  const difference = closingBalance - expectedBalance;
  
  const { data, error } = await supabase
    .from('cash_register_operations')
    .update({
      status: 'closed',
      closing_balance: closingBalance,
      expected_balance: expectedBalance,
      difference: difference,
      closed_at: new Date().toISOString(),
      notes: notes,
    })
    .eq('id', operationId)
    .select(`
      *,
      cash_register:cash_registers(*)
    `)
    .single();

  if (error) throw error;
  
  const closedOperation = data as CashRegisterOperation;
  
  // Fetch operator data separately
  if (closedOperation.operator_id) {
    const { data: operator } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .eq('id', closedOperation.operator_id)
      .single();
    
    closedOperation.operator = operator;
  }
  
  return closedOperation;
}

// Cancel cash register operation
export async function cancelCashRegisterOperation(operationId: string, notes?: string) {
  const { data, error } = await supabase
    .from('cash_register_operations')
    .update({
      status: 'cancelled',
      notes: notes,
    })
    .eq('id', operationId)
    .select(`
      *,
      cash_register:cash_registers(*)
    `)
    .single();

  if (error) throw error;
  
  const cancelledOperation = data as CashRegisterOperation;
  
  // Fetch operator data separately
  if (cancelledOperation.operator_id) {
    const { data: operator } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .eq('id', cancelledOperation.operator_id)
      .single();
    
    cancelledOperation.operator = operator;
  }
  
  return cancelledOperation;
}

// Get cash movements
export async function getCashMovements(operationId: string) {
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('cash_register_operation_id', operationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  const movements = data as CashMovement[];
  
  if (movements.length > 0) {
    const { data: operators } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .in('id', movements.map(m => m.operator_id).filter(Boolean));
    
    // Merge operator data
    movements.forEach(movement => {
      if (movement.operator_id) {
        movement.operator = operators?.find(op => op.id === movement.operator_id);
      }
    });
  }
  
  return movements;
}

// Create cash movement
export async function createCashMovement(movement: CreateCashMovementData) {
  const { data, error } = await supabase
    .from('cash_movements')
    .insert([movement])
    .select('*')
    .single();

  if (error) throw error;
  
  const newMovement = data as CashMovement;
  
  // Fetch operator data separately
  if (newMovement.operator_id) {
    const { data: operator } = await supabase
      .from('auth.users')
      .select('id, name, email')
      .eq('id', newMovement.operator_id)
      .single();
    
    newMovement.operator = operator;
  }
  
  return newMovement;
}

// Calculate expected balance
export function calculateExpectedBalance(openingBalance: number, movements: CashMovement[]): number {
  return movements.reduce((balance, movement) => {
    switch (movement.movement_type) {
      case 'sale':
      case 'cash_in':
        return balance + movement.amount;
      case 'refund':
      case 'cash_out':
      case 'adjustment':
        return balance - movement.amount;
      default:
        return balance;
    }
  }, openingBalance);
}

// Validate cash register data
export function validateCashRegisterData(cashRegister: CreateCashRegisterData): string[] {
  const errors: string[] = [];
  
  if (!cashRegister.name || cashRegister.name.trim().length === 0) {
    errors.push('Nome do caixa é obrigatório');
  }
  
  if (cashRegister.name && cashRegister.name.length > 100) {
    errors.push('Nome do caixa muito longo (máximo 100 caracteres)');
  }
  
  if (cashRegister.initial_balance && cashRegister.initial_balance < 0) {
    errors.push('Saldo inicial não pode ser negativo');
  }
  
  return errors;
}

// Validate cash register operation data
export function validateCashRegisterOperationData(operation: CreateCashRegisterOperationData): string[] {
  const errors: string[] = [];
  
  if (!operation.cash_register_id || operation.cash_register_id.trim().length === 0) {
    errors.push('ID do caixa é obrigatório');
  }
  
  if (!operation.operation_type || !['open', 'close', 'adjustment'].includes(operation.operation_type)) {
    errors.push('Tipo de operação é inválido');
  }
  
  if (operation.opening_balance < 0) {
    errors.push('Saldo de abertura não pode ser negativo');
  }
  
  if (operation.closing_balance !== undefined && operation.closing_balance < 0) {
    errors.push('Saldo de fechamento não pode ser negativo');
  }
  
  return errors;
}

// Format operation type display
export function formatOperationTypeDisplay(type: CashRegisterOperation['operation_type']): string {
  switch (type) {
    case 'open': return 'Abertura';
    case 'close': return 'Fechamento';
    case 'adjustment': return 'Ajuste';
    default: return type;
  }
}

// Format operation status display
export function formatOperationStatusDisplay(status: CashRegisterOperation['status']): string {
  switch (status) {
    case 'open': return 'Aberto';
    case 'closed': return 'Fechado';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
}

// Format movement type display
export function formatMovementTypeDisplay(type: CashMovement['movement_type']): string {
  switch (type) {
    case 'sale': return 'Venda';
    case 'refund': return 'Devolução';
    case 'cash_in': return 'Entrada';
    case 'cash_out': return 'Saída';
    case 'adjustment': return 'Ajuste';
    default: return type;
  }
}

// Get operation status color
export function getOperationStatusColor(status: CashRegisterOperation['status']): string {
  switch (status) {
    case 'open': return '#10B981'; // green
    case 'closed': return '#3B82F6'; // blue
    case 'cancelled': return '#EF4444'; // red
    default: return '#6B7280'; // gray
  }
}

// Get movement type color
export function getMovementTypeColor(type: CashMovement['movement_type']): string {
  switch (type) {
    case 'sale': return '#10B981'; // green
    case 'refund': return '#F59E0B'; // yellow
    case 'cash_in': return '#3B82F6'; // blue
    case 'cash_out': return '#EF4444'; // red
    case 'adjustment': return '#8B5CF6'; // purple
    default: return '#6B7280'; // gray
  }
}

// Check if cash register is open
export function isCashRegisterOpen(cashRegisterId: string): Promise<boolean> {
  return getCurrentCashRegisterOperation(cashRegisterId).then(operation => operation !== null);
}

// Get cash register statistics
export async function getCashRegisterStatistics(cashRegisterId: string, startDate?: string, endDate?: string) {
  const operations = await getCashRegisterOperations(cashRegisterId, startDate, endDate);
  
  const totalOperations = operations.length;
  const openOperations = operations.filter(op => op.status === 'open').length;
  const closedOperations = operations.filter(op => op.status === 'closed').length;
  const cancelledOperations = operations.filter(op => op.status === 'cancelled').length;
  
  const totalRevenue = operations
    .filter(op => op.status === 'closed')
    .reduce((sum, op) => sum + (op.closing_balance || 0), 0);
  
  const totalDifferences = operations
    .filter(op => op.status === 'closed' && op.difference)
    .reduce((sum, op) => sum + Math.abs(op.difference || 0), 0);
  
  return {
    totalOperations,
    openOperations,
    closedOperations,
    cancelledOperations,
    totalRevenue,
    totalDifferences,
    averageDifference: closedOperations > 0 ? totalDifferences / closedOperations : 0,
  };
}
