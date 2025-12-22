import { supabase } from './supabaseClient';

export interface Discount {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  applicable_to: 'all' | 'products' | 'categories' | 'clients';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  usage_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  applications?: DiscountApplication[];
}

export interface DiscountApplication {
  id: string;
  discount_id: string;
  target_type: 'product' | 'category' | 'client';
  target_id: string;
  created_at: string;
}

export interface SaleDiscount {
  id: string;
  sale_id: string;
  discount_id?: string;
  discount_name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  discount_amount: number;
  created_at: string;
}

export interface CreateDiscountData {
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  applicable_to: 'all' | 'products' | 'categories' | 'clients';
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  application_targets?: Array<{
    target_type: 'product' | 'category' | 'client';
    target_id: string;
  }>;
}

export interface UpdateDiscountData extends Partial<CreateDiscountData> {
  id: string;
}

// Get all discounts
export async function getDiscounts(includeInactive = false) {
  let query = supabase
    .from('discounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Discount[];
}

// Get discount by ID
export async function getDiscountById(id: string) {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Discount;
}

// Get active discounts for a specific date
export async function getActiveDiscounts(date = new Date().toISOString()) {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${date}`)
    .or(`end_date.is.null,end_date.gte.${date}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Discount[];
}

// Create new discount
export async function createDiscount(discount: CreateDiscountData) {
  const { data, error } = await supabase
    .from('discounts')
    .insert([discount])
    .select()
    .single();

  if (error) throw error;
  
  // Add application targets if provided
  if (discount.application_targets && discount.application_targets.length > 0) {
    const applications = discount.application_targets.map(target => ({
      discount_id: data.id,
      target_type: target.target_type,
      target_id: target.target_id,
    }));

    const { error: appError } = await supabase
      .from('discount_applications')
      .insert(applications);

    if (appError) throw appError;
  }

  return data as Discount;
}

// Update discount
export async function updateDiscount(discount: UpdateDiscountData) {
  const { id, ...updateData } = discount;
  
  const { data, error } = await supabase
    .from('discounts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Discount;
}

// Delete discount (soft delete)
export async function deleteDiscount(id: string) {
  const { data, error } = await supabase
    .from('discounts')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Discount;
}

// Hard delete discount
export async function hardDeleteDiscount(id: string) {
  const { error } = await supabase
    .from('discounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get discount applications
export async function getDiscountApplications(discountId: string) {
  const { data, error } = await supabase
    .from('discount_applications')
    .select('*')
    .eq('discount_id', discountId);

  if (error) throw error;
  return data as DiscountApplication[];
}

// Add discount application target
export async function addDiscountApplication(discountId: string, targetType: 'product' | 'category' | 'client', targetId: string) {
  const { data, error } = await supabase
    .from('discount_applications')
    .insert([{
      discount_id: discountId,
      target_type: targetType,
      target_id: targetId,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as DiscountApplication;
}

// Remove discount application target
export async function removeDiscountApplication(applicationId: string) {
  const { error } = await supabase
    .from('discount_applications')
    .delete()
    .eq('id', applicationId);

  if (error) throw error;
}

// Calculate discount amount
export function calculateDiscountAmount(discount: Discount, subtotal: number): number {
  if (discount.type === 'percentage') {
    const discountAmount = subtotal * (discount.value / 100);
    
    // Apply max discount limit if set
    if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
      return discount.max_discount_amount;
    }
    
    return discountAmount;
  } else {
    return Math.min(discount.value, subtotal);
  }
}

// Check if discount is applicable to subtotal
export function isDiscountApplicable(discount: Discount, subtotal: number): boolean {
  // Check minimum purchase amount
  if (discount.min_purchase_amount && subtotal < discount.min_purchase_amount) {
    return false;
  }

  // Check usage limit
  if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
    return false;
  }

  // Check date validity
  const now = new Date();
  if (discount.start_date && new Date(discount.start_date) > now) {
    return false;
  }
  if (discount.end_date && new Date(discount.end_date) < now) {
    return false;
  }

  return true;
}

// Get applicable discounts for cart
export async function getApplicableDiscounts(subtotal: number, productIds?: string[], categoryIds?: string[], clientIds?: string[]) {
  const activeDiscounts = await getActiveDiscounts();
  
  return activeDiscounts.filter(discount => {
    if (!isDiscountApplicable(discount, subtotal)) {
      return false;
    }

    // If discount applies to all, it's applicable
    if (discount.applicable_to === 'all') {
      return true;
    }

    // For other applicability types, we'd need to check specific applications
    // This would require additional queries to discount_applications table
    return true; // Simplified for now
  });
}

// Apply discount to sale
export async function applyDiscountToSale(saleId: string, discount: Discount, discountAmount: number) {
  const { data, error } = await supabase
    .from('sale_discounts')
    .insert([{
      sale_id: saleId,
      discount_id: discount.id,
      discount_name: discount.name,
      discount_type: discount.type,
      discount_value: discount.value,
      discount_amount: discountAmount,
    }])
    .select()
    .single();

  if (error) throw error;

  // Increment usage count
  await supabase
    .from('discounts')
    .update({ usage_count: discount.usage_count + 1 })
    .eq('id', discount.id);

  return data as SaleDiscount;
}

// Get sale discounts
export async function getSaleDiscounts(saleId: string) {
  const { data, error } = await supabase
    .from('sale_discounts')
    .select('*')
    .eq('sale_id', saleId);

  if (error) throw error;
  return data as SaleDiscount[];
}

// Validate discount data
export function validateDiscountData(discount: CreateDiscountData): string[] {
  const errors: string[] = [];
  
  if (!discount.name || discount.name.trim().length === 0) {
    errors.push('Nome do desconto é obrigatório');
  }
  
  if (discount.name && discount.name.length > 100) {
    errors.push('Nome do desconto muito longo (máximo 100 caracteres)');
  }
  
  if (!discount.type || !['percentage', 'fixed_amount'].includes(discount.type)) {
    errors.push('Tipo do desconto é inválido');
  }
  
  if (!discount.value || discount.value <= 0) {
    errors.push('Valor do desconto deve ser maior que zero');
  }
  
  if (discount.type === 'percentage' && discount.value > 100) {
    errors.push('Desconto percentual não pode ser maior que 100%');
  }
  
  if (discount.min_purchase_amount && discount.min_purchase_amount < 0) {
    errors.push('Valor mínimo de compra não pode ser negativo');
  }
  
  if (discount.max_discount_amount && discount.max_discount_amount < 0) {
    errors.push('Valor máximo de desconto não pode ser negativo');
  }
  
  if (discount.usage_limit && discount.usage_limit <= 0) {
    errors.push('Limite de uso deve ser maior que zero');
  }
  
  if (discount.start_date && discount.end_date && new Date(discount.start_date) >= new Date(discount.end_date)) {
    errors.push('Data de início deve ser anterior à data de fim');
  }
  
  return errors;
}

// Format discount display
export function formatDiscountDisplay(discount: Discount): string {
  if (discount.type === 'percentage') {
    return `${discount.value}%`;
  } else {
    return `R$${discount.value.toFixed(2)}`;
  }
}

// Check if discount is expired
export function isDiscountExpired(discount: Discount): boolean {
  if (!discount.end_date) return false;
  return new Date(discount.end_date) < new Date();
}

// Check if discount is upcoming
export function isDiscountUpcoming(discount: Discount): boolean {
  if (!discount.start_date) return false;
  return new Date(discount.start_date) > new Date();
}

// Get discount status
export function getDiscountStatus(discount: Discount): 'active' | 'expired' | 'upcoming' | 'inactive' {
  if (!discount.is_active) return 'inactive';
  if (isDiscountExpired(discount)) return 'expired';
  if (isDiscountUpcoming(discount)) return 'upcoming';
  return 'active';
}
