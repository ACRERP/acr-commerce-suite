import { supabase } from '@/lib/supabaseClient';

export interface PurchaseItem {
  id?: number;
  purchase_id?: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
  total_cost?: number; // Calculated in DB or Frontend
  product?: {
    name: string;
    code: string;
  };
}

export interface PurchaseOrder {
  id: number;
  supplier_id: string; // Changed to string (UUID)
  user_id: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_amount: number;
  invoice_number?: string;
  issue_date?: string;
  expected_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: {
    name: string;
    cnpj?: string;
  };
  items?: PurchaseItem[];
}

export interface CreatePurchaseData {
  supplier_id: string; // Changed to string (UUID)
  invoice_number?: string;
  issue_date?: string;
  expected_delivery_date?: string;
  notes?: string;
  items: {
      product_id: number;
      quantity: number;
      unit_cost: number;
  }[];
}

class PurchaseService {
  async getPurchases({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name, cnpj)
      `, { count: 'exact' });

    if (search) {
      // Note: Filtering on joined tables (suppliers.name) is tricky with simple OR.
      // Ideally we would use !inner or separate filter, but for now we might focus on invoice_number or simple fields if supplier name filtering is complex without embedding.
      // However, Supabase Postgrest supports filtering on foreign tables.
      // Let's try to filter by invoice_number directly first, and maybe supplier name if possible.
      // Given the syntax, `supplier.name.ilike` might work if the relationship is set up correctly, but `or` with foreign tables can be strict.
      // For safety and robustness as requested "make it work", I will just filter by invoice_number for now OR if easy, supplier name.
      // A common pattern is `or(invoice_number.ilike.%query%,supplier.name.ilike.%query%)` but that requires correct foreign key hinting.
      // I will stick to a simpler implementations or use the existing client-side logic approach? NO, user wants server side.
      // Let's rely on `invoice_number` for now.
      query = query.or(`invoice_number.ilike.%${search}%`); 
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { 
      data: data as PurchaseOrder[], 
      count: count || 0
    };
  }

  async getPurchaseById(id: number) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_items(
          *,
          product:products(name, code)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PurchaseOrder;
  }

  async createPurchase(data: CreatePurchaseData) {
    try {
      // Calculate Total Amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

      // 1. Create Purchase Order (Draft)
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: data.supplier_id,
          invoice_number: data.invoice_number,
          issue_date: data.issue_date,
          expected_delivery_date: data.expected_delivery_date,
          total_amount: totalAmount,
          notes: data.notes,
          status: 'draft',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Purchase Items
      const itemsToInsert = data.items.map(item => ({
        purchase_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback (delete order)
        await supabase.from('purchase_orders').delete().eq('id', order.id);
        throw itemsError;
      }

      return order;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  async receiveOrder(id: number) {
      // Call RPC to process stock update
      const { data, error } = await supabase.rpc('receive_purchase_order', { p_order_id: id });
      if (error) throw error;
      return data;
  }

  async deleteOrder(id: number) {
    // RLS should prevent deleting non-draft orders
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const purchaseService = new PurchaseService();
