import { supabase } from '../supabaseClient';

export interface Room {
    id: number;
    name: string;
    description?: string;
}

export interface Table {
    id: number;
    room_id: number;
    number: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'waiting_payment';
    x_pos?: number;
    y_pos?: number;
    current_order_id?: number;
}

export interface RestaurantOrder {
    id: number;
    table_id: number;
    status: 'open' | 'preparing' | 'served' | 'paid' | 'cancelled';
    items: OrderItem[];
    total_amount: number;
    created_at: string;
}

export interface OrderItem {
    id: number;
    product_id: number;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
}

class GastronomyService {
    async getRooms(): Promise<Room[]> {
        const { data, error } = await supabase.from('restaurant_rooms').select('*').order('name');
        if (error) throw error;
        return data || [];
    }

    async getTables(roomId?: number): Promise<Table[]> {
        let query = supabase.from('restaurant_tables').select('*');
        if (roomId) query = query.eq('room_id', roomId);
        const { data, error } = await query.order('number');
        if (error) throw error;
        return data || [];
    }

    async updateTableStatus(id: number, status: Table['status']): Promise<void> {
        const { error } = await supabase.from('restaurant_tables').update({ status }).eq('id', id);
        if (error) throw error;
    }

    async createOrder(tableId: number): Promise<RestaurantOrder> {
        const { data, error } = await supabase
            .from('restaurant_orders')
            .insert({ table_id: tableId, status: 'open' })
            .select()
            .single();
        
        if (error) throw error;
        
        // Update table with current_order_id
        await supabase
            .from('restaurant_tables')
            .update({ current_order_id: data.id, status: 'occupied' })
            .eq('id', tableId);

        return data;
    }

    async addOrderItem(orderId: number, item: Partial<OrderItem>): Promise<OrderItem> {
        const { data, error } = await supabase
            .from('restaurant_order_items')
            .insert({ ...item, order_id: orderId, status: 'pending' })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getOrderWithItems(orderId: number): Promise<RestaurantOrder & { items: OrderItem[] }> {
        const { data, error } = await supabase
            .from('restaurant_orders')
            .select('*, items:restaurant_order_items(*)')
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        return data;
    }

    async finalizeCheckout(tableId: number, orderId: number): Promise<void> {
        // Mark order as paid
        await supabase
            .from('restaurant_orders')
            .update({ status: 'paid' })
            .eq('id', orderId);

        // Release table
        await supabase
            .from('restaurant_tables')
            .update({ status: 'available', current_order_id: null })
            .eq('id', tableId);
    }

    async getKDSOrders(): Promise<RestaurantOrder[]> {
        const { data, error } = await supabase
            .from('restaurant_orders')
            .select('*, items:restaurant_order_items(*)')
            .in('status', ['open', 'preparing', 'ready'])
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    }

    subscribeToKDS(onUpdate: () => void) {
        const channel = supabase
            .channel('kds-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, onUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_order_items' }, onUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }
}

export const gastronomyService = new GastronomyService();
