import { supabase } from '@/lib/supabase';

export interface PurchaseItem {
  id?: string;
  purchase_id?: string;
  product_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  product?: {
    name: string;
    code: string;
  };
}

export interface Purchase {
  id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_series?: string;
  issue_date: string;
  entry_date: string;
  total_amount: number;
  discount_amount: number;
  additional_costs: number;
  status: 'draft' | 'pending' | 'completed' | 'canceled';
  notes?: string;
  user_id?: string;
  supplier?: {
    name: string;
    cnpj?: string;
  };
  items?: PurchaseItem[];
}

export interface CreatePurchaseData {
  supplier_id: string;
  invoice_number: string;
  invoice_series?: string;
  issue_date: string;
  entry_date: string;
  discount_amount?: number;
  additional_costs?: number;
  notes?: string;
  status: 'draft' | 'completed';
  items: Omit<PurchaseItem, 'id' | 'purchase_id' | 'total_cost'>[];
}

class PurchaseService {
  async getPurchases() {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:suppliers(name, cnpj)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Purchase[];
  }

  async getPurchaseById(id: string) {
    const { data, error } = await supabase
      .from('purchases')
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
    return data as Purchase;
  }

  async createPurchase(data: CreatePurchaseData) {
    try {
      // 1. Create Purchase Header (Draft initially)
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          supplier_id: data.supplier_id,
          invoice_number: data.invoice_number,
          invoice_series: data.invoice_series,
          issue_date: data.issue_date,
          entry_date: data.entry_date,
          discount_amount: data.discount_amount || 0,
          additional_costs: data.additional_costs || 0,
          notes: data.notes,
          status: 'draft',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // 2. Create Purchase Items
      const itemsToInsert = data.items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback (delete purchase)
        await supabase.from('purchases').delete().eq('id', purchase.id);
        throw itemsError;
      }

      // 3. Update status to 'completed' if requested (triggers stock update)
      if (data.status === 'completed') {
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ status: 'completed' })
          .eq('id', purchase.id);

        if (updateError) throw updateError;
      }

      return purchase;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  async deletePurchase(id: string) {
    // Only allow if not completed? Or allow and trigger reversal?
    // For now, allow deletion (cascade deletes items). 
    // If completed, we should ideally check stock or implement a reversal trigger.
    // The current migration doesn't have a specific reversal trigger on Purchase DELETE, 
    // but we can add one later.
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const purchaseService = new PurchaseService();
