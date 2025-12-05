import { supabase } from './supabaseClient';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'fiado';
export type SaleStatus = 'concluida' | 'pendente' | 'cancelada';

export interface Sale {
  id: number;
  client_id?: number;
  user_id?: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    name: string;
    phone?: string;
  };
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    code?: string;
  };
}

export interface CreateSaleData {
  client_id?: number;
  total_amount: number;
  payment_method: PaymentMethod;
  status?: SaleStatus;
  items: Omit<SaleItem, 'id' | 'sale_id' | 'product'>[];
}

export interface UpdateSaleData extends Partial<Omit<CreateSaleData, 'items'>> {
  id: number;
}

// Get all sales with items and client info
export async function getSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sale[];
}

// Get sale by ID with items and client info
export async function getSaleById(id: number) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Sale;
}

// Create new sale with items
export async function createSale(sale: CreateSaleData) {
  // Use a transaction to ensure data consistency
  const { data, error } = await supabase.rpc('create_sale_with_items', {
    sale_data: {
      client_id: sale.client_id,
      total_amount: sale.total_amount,
      payment_method: sale.payment_method,
      status: sale.status || 'concluida'
    },
    sale_items: sale.items
  });

  if (error) throw error;
  return data;
}

// Update sale
export async function updateSale(sale: UpdateSaleData) {
  const { id, ...updateData } = sale;
  
  const { data, error } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Sale;
}

// Delete sale (will cascade delete items)
export async function deleteSale(id: number) {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get sales by date range
export async function getSalesByDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sale[];
}

// Get sales by status
export async function getSalesByStatus(status: SaleStatus) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Sale[];
}
