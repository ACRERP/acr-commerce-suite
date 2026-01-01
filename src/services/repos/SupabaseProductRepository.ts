
import { supabase } from '@/lib/supabaseClient';
import { Product } from '@/lib/products';
import { ProductRepository } from './ProductRepository';

export class SupabaseProductRepository implements ProductRepository {
    
    async getAll(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true);
            
        if (error) throw error;
        return data as Product[];
    }

    async getById(id: number): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) return null;
        return data as Product;
    }

    async search(query: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
            .eq('active', true)
            .limit(20);

        if (error) throw error;
        return data as Product[];
    }

    async create(product: Partial<Product>): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    }

    async update(id: number, product: Partial<Product>): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .update(product)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Product;
    }

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('products')
            .update({ active: false }) // Soft delete
            .eq('id', id);

        if (error) throw error;
    }

    async updateStock(id: number, quantity: number): Promise<void> {
        // This usually requires a stored procedure or complex logic to avoid conditions
        // For now, simple update
        const { error } = await supabase
            .from('products')
            .update({ stock_quantity: quantity })
            .eq('id', id);

        if (error) throw error;
    }
}
