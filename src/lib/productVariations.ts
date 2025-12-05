import { supabase } from './supabaseClient';

export interface ProductVariation {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  description?: string;
  sale_price: number;
  cost_price?: number;
  profit_margin?: number;
  profit_amount?: number;
  stock_quantity: number;
  minimum_stock: number;
  barcode?: string;
  image_url?: string;
  attributes: VariationAttributes;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VariationAttributes {
  color?: string;
  size?: string;
  material?: string;
  style?: string;
  weight?: string;
  dimensions?: string;
  [key: string]: unknown;
}

export interface VariationColor {
  id: string;
  name: string;
  hex_code: string;
  created_at: string;
}

export interface VariationSize {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface CreateVariationData {
  product_id: string;
  sku: string;
  name: string;
  description?: string;
  sale_price: number;
  cost_price?: number;
  stock_quantity: number;
  minimum_stock?: number;
  barcode?: string;
  image_url?: string;
  attributes: VariationAttributes;
}

export interface UpdateVariationData extends Partial<CreateVariationData> {
  id: string;
}

// Get all variations for a product
export async function getProductVariations(productId: string) {
  const { data, error } = await supabase
    .from('product_variations')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ProductVariation[];
}

// Get single variation by SKU
export async function getVariationBySku(sku: string) {
  const { data, error } = await supabase
    .from('product_variations')
    .select('*')
    .eq('sku', sku)
    .single();

  if (error) throw error;
  return data as ProductVariation;
}

// Create new variation
export async function createVariation(variation: CreateVariationData) {
  const { data, error } = await supabase
    .from('product_variations')
    .insert([variation])
    .select()
    .single();

  if (error) throw error;
  return data as ProductVariation;
}

// Update variation
export async function updateVariation(variation: UpdateVariationData) {
  const { id, ...updateData } = variation;
  
  const { data, error } = await supabase
    .from('product_variations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductVariation;
}

// Delete variation (soft delete)
export async function deleteVariation(id: string) {
  const { data, error } = await supabase
    .from('product_variations')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductVariation;
}

// Hard delete variation
export async function hardDeleteVariation(id: string) {
  const { error } = await supabase
    .from('product_variations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Update variation stock
export async function updateVariationStock(id: string, quantity: number) {
  const { data, error } = await supabase
    .from('product_variations')
    .update({ stock_quantity: quantity })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductVariation;
}

// Get available colors
export async function getVariationColors() {
  const { data, error } = await supabase
    .from('variation_colors')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as VariationColor[];
}

// Get available sizes
export async function getVariationSizes() {
  const { data, error } = await supabase
    .from('variation_sizes')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as VariationSize[];
}

// Generate variation SKU
export function generateVariationSKU(baseSKU: string, attributes: VariationAttributes): string {
  const parts = [baseSKU];
  
  if (attributes.color) {
    parts.push(attributes.color.substring(0, 3).toUpperCase());
  }
  
  if (attributes.size) {
    parts.push(attributes.size.toUpperCase());
  }
  
  return parts.join('-');
}

// Validate variation attributes
export function validateVariationAttributes(attributes: VariationAttributes): string[] {
  const errors: string[] = [];
  
  if (!attributes.color && !attributes.size && !attributes.material) {
    errors.push('Pelo menos um atributo (cor, tamanho ou material) deve ser informado');
  }
  
  if (attributes.color && attributes.color.length > 50) {
    errors.push('Nome da cor muito longo');
  }
  
  if (attributes.size && attributes.size.length > 20) {
    errors.push('Nome do tamanho muito longo');
  }
  
  return errors;
}

// Get variation display name
export function getVariationDisplayName(variation: ProductVariation): string {
  const parts = [variation.name];
  
  if (variation.attributes.color) {
    parts.push(variation.attributes.color);
  }
  
  if (variation.attributes.size) {
    parts.push(variation.attributes.size);
  }
  
  return parts.join(' - ');
}

// Check if variation is low stock
export function isVariationLowStock(variation: ProductVariation): boolean {
  return variation.stock_quantity <= variation.minimum_stock;
}

// Check if variation is out of stock
export function isVariationOutOfStock(variation: ProductVariation): boolean {
  return variation.stock_quantity === 0;
}

// Get stock status
export function getVariationStockStatus(variation: ProductVariation): 'out' | 'low' | 'normal' {
  if (isVariationOutOfStock(variation)) return 'out';
  if (isVariationLowStock(variation)) return 'low';
  return 'normal';
}

// Format variation attributes for display
export function formatVariationAttributes(attributes: VariationAttributes): string[] {
  const formatted: string[] = [];
  
  if (attributes.color) {
    formatted.push(`Cor: ${attributes.color}`);
  }
  
  if (attributes.size) {
    formatted.push(`Tamanho: ${attributes.size}`);
  }
  
  if (attributes.material) {
    formatted.push(`Material: ${attributes.material}`);
  }
  
  if (attributes.weight) {
    formatted.push(`Peso: ${attributes.weight}`);
  }
  
  if (attributes.dimensions) {
    formatted.push(`Dimensões: ${attributes.dimensions}`);
  }
  
  return formatted;
}
