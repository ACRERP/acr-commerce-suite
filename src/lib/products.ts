import { supabase } from './supabaseClient';

export interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  category_id?: string;
  brand?: string;
  code: string;
  sku?: string;
  barcode?: string;
  unit: string;
  stock_quantity: number;
  minimum_stock_level: number;
  sale_price: number;
  cost_price?: number;
  profit_margin?: number;
  profit_amount?: number;
  // Advanced Fields (ACR Paridade)
  wholesale_price?: number;
  term_price?: number;
  markup?: number;
  margin?: number;
  warranty?: string;
  reference?: string;
  commission_percentage?: number;
  location?: string;
  image_url?: string;
  variations?: ProductVariation[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  category?: string;
  category_id?: string;
  brand?: string;
  code: string;
  sku?: string;
  barcode?: string;
  unit: string;
  stock_quantity: number;
  minimum_stock_level: number;
  sale_price: number;
  cost_price?: number;
  // Advanced Fields (ACR Paridade)
  wholesale_price?: number;
  term_price?: number;
  markup?: number;
  margin?: number;
  warranty?: string;
  reference?: string;
  commission_percentage?: number;
  location?: string;
  image_url?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: number;
}

// Get all products with pagination and search
export async function getProducts({ 
  page = 1, 
  limit = 10, 
  search = '', 
  all = false,
  organizationId
}: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  all?: boolean;
  organizationId?: string;
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*, sale_price:price', { count: 'exact' });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  // Apply default order
  query = query.order('created_at', { ascending: false });

  // Apply pagination only if NOT fetching all
  if (!all) {
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  
  return { 
    data: data as Product[], 
    count: count || 0 
  };
}

// Get product by ID
export async function getProductById(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select('*, sale_price:price')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Product;
}

// Create new product
export async function createProduct(product: CreateProductData & { variations?: Partial<CreateVariationData>[] }, organizationId?: string) {
  const { variations, ...productData } = product;
  
  // Validate Organization
  if (!organizationId) {
     // Optional: throw error or allow for legacy/admin flows
     // console.warn("Creating product without organization_id");
  }

  // Map frontend fields to DB columns
  const dbPayload = {
    ...productData,
    price: productData.sale_price, // Map sale_price to price
    sale_price: undefined,     // Remove sale_price from payload
    organization_id: organizationId // Add Org ID
  };
  
  // Remove undefined keys
  Object.keys(dbPayload).forEach(key => dbPayload[key as keyof typeof dbPayload] === undefined && delete dbPayload[key as keyof typeof dbPayload]);

  const { data: newProduct, error } = await supabase
    .from('products')
    .insert(dbPayload)
    .select()
    .single();

  if (error) throw error;

  // Insert variations if present
  if (variations && variations.length > 0) {
    const variationsToInsert = variations.map(v => ({
      ...v,
      product_id: newProduct.id,
      // Variations usually inherit org implicitly via relation, but if table has it:
      // organization_id: organizationId 
    }));
    
    const { error: varError } = await supabase
      .from('product_variations')
      .insert(variationsToInsert);
      
    if (varError) throw varError;
  }

  return newProduct as Product;
}

// Update product
export async function updateProduct(product: UpdateProductData & { variations?: Partial<CreateVariationData>[] }) {
  const { id, variations, ...updateData } = product;
  
  // Map frontend fields to DB columns
  const dbPayload = {
    ...updateData,
    price: updateData.sale_price, // Map sale_price to price
    sale_price: undefined,        // Remove sale_price from payload
  };

  // Remove undefined keys
  Object.keys(dbPayload).forEach(key => dbPayload[key as keyof typeof dbPayload] === undefined && delete dbPayload[key as keyof typeof dbPayload]);
  
  const { data: updatedProduct, error } = await supabase
    .from('products')
    .update(dbPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Handle variations (this is a simplified logic: delete and re-insert or sync)
  // For simplicity here, we'll only handle creation of new ones or assume full sync
  if (variations) {
    // Delete existing and re-insert (Simple sync)
    // In a production app, we should do a proper diff/upsert
    await supabase.from('product_variations').delete().eq('product_id', id);
    
    if (variations.length > 0) {
      const variationsToInsert = variations.map(v => ({
        ...v,
        product_id: id
      }));
      await supabase.from('product_variations').insert(variationsToInsert);
    }
  }

  return updatedProduct as Product;
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
export async function searchProducts(query: string, organizationId?: string) {
  let dbQuery = supabase
    .from('products')
    .select('*, sale_price:price')
    .or(`name.ilike.%${query}%,code.ilike.%${query}%,brand.ilike.%${query}%`)
    .order('name');

  if (organizationId) {
    dbQuery = dbQuery.eq('organization_id', organizationId);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;
  return data as Product[];
}

// Get products by category
export async function getProductsByCategory(category: string, organizationId?: string) {
  let dbQuery = supabase
    .from('products')
    .select('*, sale_price:price')
    .eq('category', category)
    .order('name');

  if (organizationId) {
    dbQuery = dbQuery.eq('organization_id', organizationId);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;
  return data as Product[];
}

// Get low stock products
export async function getLowStockProducts(organizationId?: string) {
  // First get all products, then filter client-side
  let query = supabase
    .from('products')
    .select('*, sale_price:price')
    .order('stock_quantity', { ascending: true });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Filter products where stock_quantity <= minimum_stock_level
  return (data as Product[]).filter(product => 
    product.stock_quantity <= product.minimum_stock_level
  );
}

// VARIATIONS

export interface ProductVariation {
  id: number;
  product_id: number;
  name: string;
  sku?: string;
  stock_quantity: number;
  price?: number;
  cost_price?: number;
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateVariationData {
  product_id: number;
  name: string;
  sku?: string;
  stock_quantity: number;
  price?: number;
  cost_price?: number;
  attributes: Record<string, any>;
}

export async function getProductVariations(productId: number) {
  const { data, error } = await supabase
    .from('product_variations')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ProductVariation[];
}

export async function createVariation(variation: CreateVariationData) {
  const { data, error } = await supabase
    .from('product_variations')
    .insert(variation)
    .select()
    .single();

  if (error) throw error;
  return data as ProductVariation;
}

export async function deleteVariation(id: number) {
  const { error } = await supabase
    .from('product_variations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// BATCHES / LOTS

export interface ProductBatch {
  id: number;
  product_id: number;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date: string;
  quantity: number;
  status: 'active' | 'expired' | 'low_stock';
  created_at: string;
  updated_at: string;
}

export interface CreateBatchData {
  product_id: number;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date: string;
  quantity: number;
}

export async function getProductBatches(productId: number) {
  const { data, error } = await supabase
    .from('product_batches')
    .select('*')
    .eq('product_id', productId)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data as ProductBatch[];
}

export async function createBatch(batch: CreateBatchData) {
  const { data, error } = await supabase
    .from('product_batches')
    .insert({ ...batch, status: 'active' })
    .select()
    .single();

  if (error) throw error;
  return data as ProductBatch;
}

export async function deleteBatch(id: number) {
  const { error } = await supabase
    .from('product_batches')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
