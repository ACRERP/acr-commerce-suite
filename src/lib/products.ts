import { supabase } from './supabaseClient';

export interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  code: string;
  stock_quantity: number;
  minimum_stock_level: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  code: string;
  stock_quantity: number;
  minimum_stock_level: number;
  image_url?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: number;
}

// Get all products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Product[];
}

// Get product by ID
export async function getProductById(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Product;
}

// Create new product
export async function createProduct(product: CreateProductData) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

// Update product
export async function updateProduct(product: UpdateProductData) {
  const { id, ...updateData } = product;
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Product;
}

// Delete product
export async function deleteProduct(id: number) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Search products
export async function searchProducts(query: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,code.ilike.%${query}%,brand.ilike.%${query}%`)
    .order('name');

  if (error) throw error;
  return data as Product[];
}

// Get products by category
export async function getProductsByCategory(category: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) throw error;
  return data as Product[];
}

// Get low stock products
export async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lte('stock_quantity', 'minimum_stock_level')
    .order('stock_quantity', { ascending: true });

  if (error) throw error;
  return data as Product[];
}
