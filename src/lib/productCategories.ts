import { supabase } from './supabaseClient';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  code: string;
  parent_id?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: ProductCategory[];
  product_count?: number;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  code: string;
  parent_id?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

// Get all categories (hierarchical)
export async function getCategories(includeInactive = false) {
  let query = supabase
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ProductCategory[];
}

// Get category by ID
export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ProductCategory;
}

// Get category by code
export async function getCategoryByCode(code: string) {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('code', code)
    .single();

  if (error) throw error;
  return data as ProductCategory;
}

// Create new category
export async function createCategory(category: CreateCategoryData) {
  const { data, error } = await supabase
    .from('product_categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data as ProductCategory;
}

// Update category
export async function updateCategory(category: UpdateCategoryData) {
  const { id, ...updateData } = category;
  
  const { data, error } = await supabase
    .from('product_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductCategory;
}

// Delete category (soft delete)
export async function deleteCategory(id: string) {
  const { data, error } = await supabase
    .from('product_categories')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProductCategory;
}

// Hard delete category
export async function hardDeleteCategory(id: string) {
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get categories with product count
export async function getCategoriesWithProductCount() {
  const { data, error } = await supabase
    .from('product_categories')
    .select(`
      *,
      products:products(count)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  
  return data.map((category: ProductCategory & { products?: unknown[] }) => ({
    ...category,
    product_count: category.products?.length || 0,
  })) as ProductCategory[];
}

// Build hierarchical tree structure
export function buildCategoryTree(categories: ProductCategory[]): ProductCategory[] {
  const categoryMap = new Map<string, ProductCategory>();
  const rootCategories: ProductCategory[] = [];

  // Create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build tree structure
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

// Flatten tree structure
export function flattenCategoryTree(categories: ProductCategory[]): ProductCategory[] {
  const result: ProductCategory[] = [];
  
  function flatten(categories: ProductCategory[]) {
    categories.forEach(category => {
      result.push(category);
      if (category.children && category.children.length > 0) {
        flatten(category.children);
      }
    });
  }
  
  flatten(categories);
  return result;
}

// Get category path (breadcrumb)
export function getCategoryPath(categories: ProductCategory[], categoryId: string): ProductCategory[] {
  const path: ProductCategory[] = [];
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  
  function buildPath(id: string) {
    const category = categoryMap.get(id);
    if (category) {
      path.unshift(category);
      if (category.parent_id) {
        buildPath(category.parent_id);
      }
    }
  }
  
  buildPath(categoryId);
  return path;
}

// Generate category code from name
export function generateCategoryCode(name: string): string {
  // Remove accents and convert to uppercase
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  
  // Take first 4 characters, remove special chars
  let code = cleanName
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4);
  
  // Ensure code is at least 3 characters
  if (code.length < 3) {
    code = code.padEnd(3, 'X');
  }
  
  return code;
}

// Validate category data
export function validateCategoryData(category: CreateCategoryData): string[] {
  const errors: string[] = [];
  
  if (!category.name || category.name.trim().length === 0) {
    errors.push('Nome da categoria é obrigatório');
  }
  
  if (category.name && category.name.length > 100) {
    errors.push('Nome da categoria muito longo (máximo 100 caracteres)');
  }
  
  if (!category.code || category.code.trim().length === 0) {
    errors.push('Código da categoria é obrigatório');
  }
  
  if (category.code && (category.code.length < 2 || category.code.length > 20)) {
    errors.push('Código da categoria deve ter entre 2 e 20 caracteres');
  }
  
  if (category.code && !/^[A-Z0-9_-]+$/.test(category.code)) {
    errors.push('Código da categoria deve conter apenas letras maiúsculas, números, underscore e hífen');
  }
  
  if (category.color && !/^#[0-9A-F]{6}$/i.test(category.color)) {
    errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
  }
  
  return errors;
}

// Check if category has children
export function categoryHasChildren(categories: ProductCategory[], categoryId: string): boolean {
  return categories.some(cat => cat.parent_id === categoryId);
}

// Check if category has products
export async function categoryHasProducts(categoryId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) throw error;
  return (count || 0) > 0;
}

// Get category options for select (flat list with indentation)
export function getCategorySelectOptions(categories: ProductCategory[]): { value: string; label: string; level: number }[] {
  const options: { value: string; label: string; level: number }[] = [];
  
  function addCategories(categories: ProductCategory[], level = 0) {
    categories.forEach(category => {
      const indent = '  '.repeat(level);
      options.push({
        value: category.id,
        label: `${indent}${category.name}`,
        level,
      });
      
      if (category.children && category.children.length > 0) {
        addCategories(category.children, level + 1);
      }
    });
  }
  
  addCategories(categories);
  return options;
}

// Format category display name
export function formatCategoryDisplayName(category: ProductCategory): string {
  return category.name;
}

// Get category statistics
export async function getCategoryStatistics(categoryId: string) {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('sale_price, cost_price, stock_quantity')
    .eq('category_id', categoryId);

  if (productsError) throw productsError;

  const totalProducts = products?.length || 0;
  const totalStock = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
  const totalValue = products?.reduce((sum, p) => sum + ((p.sale_price || 0) * (p.stock_quantity || 0)), 0) || 0;
  const totalCost = products?.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0) || 0;
  const totalProfit = totalValue - totalCost;

  return {
    totalProducts,
    totalStock,
    totalValue,
    totalCost,
    totalProfit,
    averagePrice: totalProducts > 0 ? totalValue / totalProducts : 0,
  };
}
