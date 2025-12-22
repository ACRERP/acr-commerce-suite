import { supabase } from './supabaseClient';

export interface InventoryTransaction {
  id: string;
  product_id: number;
  transaction_type: 'entry' | 'exit';
  quantity: number;
  reason: string;
  reference_id?: string;
  reference_type?: 'sale' | 'purchase' | 'adjustment' | 'return';
  created_at: string;
  created_by?: string;
  product?: {
    name: string;
    code: string;
  };
}

export interface CreateInventoryTransactionData {
  product_id: number;
  transaction_type: 'entry' | 'exit';
  quantity: number;
  reason: string;
  reference_id?: string;
  reference_type?: 'sale' | 'purchase' | 'adjustment' | 'return';
}

export interface UpdateInventoryTransactionData {
  quantity?: number;
  reason?: string;
}

// Get inventory transactions for a product
export async function getInventoryTransactions(productId: number): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      product:products(name, code)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as InventoryTransaction[];
}

// Get all inventory transactions
export async function getAllInventoryTransactions(): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      product:products(name, code)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as InventoryTransaction[];
}

// Create inventory transaction
export async function createInventoryTransaction(transaction: CreateInventoryTransactionData): Promise<InventoryTransaction> {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert(transaction)
    .select(`
      *,
      product:products(name, code)
    `)
    .single();

  if (error) throw error;
  
  // Update product stock
  await updateProductStock(transaction.product_id, transaction.quantity, transaction.transaction_type);
  
  return data as InventoryTransaction;
}

// Update inventory transaction
export async function updateInventoryTransaction(id: string, updates: UpdateInventoryTransactionData): Promise<InventoryTransaction> {
  // Get original transaction to calculate stock adjustment
  const { data: original, error: fetchError } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Update transaction
  const { data, error } = await supabase
    .from('inventory_transactions')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      product:products(name, code)
    `)
    .single();

  if (error) throw error;

  // Adjust product stock based on changes
  if (updates.quantity && original) {
    const quantityDiff = updates.quantity - original.quantity;
    const adjustmentType = quantityDiff > 0 ? 'entry' : 'exit';
    await updateProductStock(original.product_id, Math.abs(quantityDiff), adjustmentType);
  }

  return data as InventoryTransaction;
}

// Delete inventory transaction
export async function deleteInventoryTransaction(id: string): Promise<void> {
  // Get transaction before deleting to adjust stock stock
  const { data: transaction, error: fetchError } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Delete transaction
  const { error } = await supabase
    .from('inventory_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Reverse the stock change
  if (transaction) {
    const reverseType = transaction.transaction_type === 'entry' ? 'exit' : 'entry';
    await updateProductStock(transaction.product_id, transaction.quantity, reverseType);
  }
}

// Helper function to update product stock补
async function updateProductStock(productId: number, quantity: number, type: 'entry' | 'exit'): Promise<void> {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();

  if (fetchError) throw fetchError;

  const currentStock = product?.stock_quantity || 0;
  const newStock = type === 'entry' 
    ? currentStock + quantity 
    : Math.max(0, currentStock - quantity);

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: newStock })
    .eq('id', productId);

  if (updateError) throw updateError;
}

// Get inventory summary
export async function getInventorySummary(): Promise<{
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  recentTransactions: InventoryTransaction[];
}> {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, stock_quantity, minimum_stock_level');

  if (productsError) throw productsError;

  const { data: transactions, error: transactionsError } = await supabase
    .from('inventory_transactions')
    .select(`
      *,
      product:products(name, code)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (transactionsError) throw transactionsError;

  const totalProducts = products?.length || 0;
  const totalStock = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
  const lowStockProducts = products?.filter(p => 
    p.stock_quantity <= (p.minimum_stock_level || 0)
  ).length || 0;

  return {
    totalProducts,
    totalStock,
    lowStockProducts,
    recentTransactions: transactions as InventoryTransaction[]
  };
}
