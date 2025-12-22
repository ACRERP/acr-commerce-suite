import { supabase } from './supabaseClient';

// ==================== TYPES ====================

export interface Supplier {
  id: string;
  code: string;
  name: string;
  company_name?: string;
  cnpj?: string;
  cpf?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  notes?: string;
  payment_terms?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'perda' | 'devolucao' | 'transferencia';
export type ReferenceType = 'sale' | 'purchase' | 'adjustment' | 'manual' | 'service_order';

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: MovementType;
  quantity: number;
  cost_price?: number;
  reference_type?: ReferenceType;
  reference_id?: number;
  reason?: string;
  notes?: string;
  user_id?: number;
  created_at: string;
}

export interface StockMovementHistory extends StockMovement {
  product_code: string;
  product_name: string;
  unit: string;
  user_name?: string;
  supplier_name?: string;
}

export interface ProductLowStock {
  id: number;
  code: string;
  name: string;
  category?: string;
  stock_quantity: number;
  minimum_stock_level: number;
  cost_price: number;
  price: number;
  supplier_name?: string;
  quantity_to_order: number;
}

export interface CreateSupplierData {
  name: string;
  company_name?: string;
  cnpj?: string;
  cpf?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  notes?: string;
  payment_terms?: string;
  active?: boolean;
}

export interface CreateStockMovementData {
  product_id: number;
  movement_type: MovementType;
  quantity: number;
  cost_price?: number;
  reference_type?: ReferenceType;
  reference_id?: number;
  reason?: string;
  notes?: string;
}

// ==================== SUPPLIERS ====================

export async function getSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Supplier[];
}

export async function getActiveSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('active', true)
    .order('name');
  
  if (error) throw error;
  return data as Supplier[];
}

export async function getSupplierById(id: number) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Supplier;
}

export async function createSupplier(supplierData: CreateSupplierData) {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplierData])
    .select()
    .single();
  
  if (error) throw error;
  return data as Supplier;
}

export async function updateSupplier(id: number, supplierData: Partial<CreateSupplierData>) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplierData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Supplier;
}

export async function deleteSupplier(id: number) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== STOCK MOVEMENTS ====================

export async function getStockMovements(productId?: number, limit = 100) {
  let query = supabase
    .from('stock_movement_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (productId) {
    query = query.eq('product_id', productId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as StockMovementHistory[];
}

export async function createStockMovement(movementData: CreateStockMovementData) {
  const { data, error } = await supabase
    .from('stock_movements')
    .insert([movementData])
    .select()
    .single();
  
  if (error) throw error;
  return data as StockMovement;
}

export async function getProductsLowStock() {
  const { data, error } = await supabase
    .from('products_low_stock')
    .select('*');
  
  if (error) throw error;
  return data as ProductLowStock[];
}

// ==================== STOCK OPERATIONS ====================

export async function stockEntry(
  productId: number,
  quantity: number,
  costPrice?: number,
  supplierId?: number,
  notes?: string
) {
  return createStockMovement({
    product_id: productId,
    movement_type: 'entrada',
    quantity,
    cost_price: costPrice,
    reference_type: 'manual',
    notes
  });
}

export async function stockExit(
  productId: number,
  quantity: number,
  reason: string,
  notes?: string
) {
  return createStockMovement({
    product_id: productId,
    movement_type: 'saida',
    quantity,
    reason,
    reference_type: 'manual',
    notes
  });
}

export async function stockAdjustment(
  productId: number,
  newQuantity: number,
  reason: string,
  notes?: string
) {
  return createStockMovement({
    product_id: productId,
    movement_type: 'ajuste',
    quantity: newQuantity,
    reason,
    reference_type: 'adjustment',
    notes
  });
}

export async function stockLoss(
  productId: number,
  quantity: number,
  reason: string,
  notes?: string
) {
  return createStockMovement({
    product_id: productId,
    movement_type: 'perda',
    quantity,
    reason,
    reference_type: 'manual',
    notes
  });
}

// ==================== REPORTS ====================

export async function getStockMovementsByPeriod(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('stock_movement_history')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as StockMovementHistory[];
}

export async function getStockMovementsByType(movementType: MovementType, limit = 100) {
  const { data, error } = await supabase
    .from('stock_movement_history')
    .select('*')
    .eq('movement_type', movementType)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data as StockMovementHistory[];
}

export async function getStockValueReport() {
  const { data, error } = await supabase
    .from('products')
    .select('id, code, name, stock_quantity, cost_price, price, category')
    .eq('active', true);
  
  if (error) throw error;
  
  const report = data.map(product => ({
    ...product,
    cost_value: product.stock_quantity * (product.cost_price || 0),
    sale_value: product.stock_quantity * product.price,
    potential_profit: product.stock_quantity * (product.price - (product.cost_price || 0))
  }));
  
  const totals = report.reduce((acc, item) => ({
    total_cost: acc.total_cost + item.cost_value,
    total_sale: acc.total_sale + item.sale_value,
    total_profit: acc.total_profit + item.potential_profit
  }), { total_cost: 0, total_sale: 0, total_profit: 0 });
  
  return { items: report, totals };
}
