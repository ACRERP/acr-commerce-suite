import { supabase } from './supabaseClient';

export interface InventoryMovement {
    id?: string;
    product_id: string;
    type: 'in' | 'out' | 'adjustment' | 'production';
    quantity: number;
    price_unit?: number;
    total_value?: number;
    document_ref?: string;
    reason?: string;
    location?: string;
    created_at?: string;
    created_by?: string;
}

export const inventoryService = {
    /**
     * Get all movements for a specific product
     */
    getMovementsByProduct: async (productId: string) => {
        const { data, error } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as InventoryMovement[];
    },

    /**
     * Add a new movement (stock in, out, adjustment)
     */
    addMovement: async (movement: InventoryMovement) => {
        const { data, error } = await supabase
            .from('inventory_movements')
            .insert([movement])
            .select()
            .single();

        if (error) throw error;
        return data as InventoryMovement;
    },

    /**
     * Get global inventory summary (products with low stock, total value)
     */
    getInventorySummary: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, stock_quantity, min_stock, price')
            .order('stock_quantity', { ascending: true });

        if (error) throw error;
        
        const summary = {
            totalItems: data.length,
            lowStockItems: data.filter((p: any) => p.stock_quantity <= (p.min_stock || 0)),
            totalValue: data.reduce((acc: number, p: any) => acc + ((p.stock_quantity || 0) * (p.price || 0)), 0)
        };

        return summary;
    },


    /**
     * Bulk register stock entry (purchases)
     */
    registerPurchase: async (productId: string, quantity: number, priceUnit: number, documentRef: string) => {
        return inventoryService.addMovement({
            product_id: productId,
            type: 'in',
            quantity,
            price_unit: priceUnit,
            total_value: quantity * priceUnit,
            document_ref: documentRef,
            reason: 'Entrada de Compra (NF-e)'
        });
    }
};
