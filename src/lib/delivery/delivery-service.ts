/**
 * Serviço de Delivery - Completo
 * 
 * Gerencia deliveries, entregadores, Kanban e performance
 */

import { supabase } from '@/lib/supabaseClient';

export interface DeliveryMan {
  id: number;
  name: string;
  cpf?: string;
  phone?: string;
  whatsapp?: string;
  vehicle?: string;
  plate?: string;
  contract_type: 'fixo' | 'avulso';
  commission_per_delivery: number;
  commission_percentage: number;
  status: 'active' | 'inactive' | 'busy';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryOrder {
  id: number;
  sale_id?: number;
  client_id?: number;
  delivery_man_id?: number;
  total_amount: number;
  delivery_fee: number;
  status: 'pending' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';
  priority: 'normal' | 'urgent';
  address: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
  payment_status: 'pending' | 'paid';
  observations?: string;
  change_for?: number;
  estimated_time?: number;
  preparation_time?: number;
  assigned_at?: string;
  started_at?: string;
  delivery_time?: string;
  cancelled_reason?: string;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPerformance {
  id: number;
  name: string;
  vehicle?: string;
  status: string;
  total_deliveries: number;
  completed_deliveries: number;
  active_deliveries: number;
  total_value: number;
  total_fees: number;
  total_commission_fixed: number;
  total_commission_percentage: number;
  avg_delivery_time_minutes?: number;
  avg_rating?: number;
}

export class DeliveryService {
  /**
   * Listar todos os deliveries
   */
  async getDeliveries(filters?: {
    status?: string;
    delivery_man_id?: number;
    date?: string;
  }): Promise<DeliveryOrder[]> {
    let query = supabase.from('delivery_orders').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.delivery_man_id) {
      query = query.eq('delivery_man_id', filters.delivery_man_id);
    }
    if (filters?.date) {
      query = query.gte('created_at', `${filters.date}T00:00:00`)
                   .lte('created_at', `${filters.date}T23:59:59`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar deliveries:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Buscar delivery por ID
   */
  async getDeliveryById(id: number): Promise<DeliveryOrder | null> {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar delivery:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Obter deliveries para Kanban
   */
  async getKanbanDeliveries(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_delivery_kanban')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar Kanban:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Criar delivery
   */
  async createDelivery(delivery: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
    const { data, error } = await supabase
      .from('delivery_orders')
      .insert([delivery])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar delivery:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Atualizar delivery
   */
  async updateDelivery(id: number, updates: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
    const { data, error } = await supabase
      .from('delivery_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar delivery:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Atribuir entregador
   */
  async assignDeliveryman(deliveryId: number, deliverymanId: number): Promise<void> {
    const { error } = await supabase.rpc('fn_assign_deliveryman', {
      p_delivery_id: deliveryId,
      p_deliveryman_id: deliverymanId,
    });
    
    if (error) {
      console.error('Erro ao atribuir entregador:', error);
      throw error;
    }
  }

  /**
   * Iniciar entrega (saiu para rota)
   */
  async startDelivery(deliveryId: number): Promise<void> {
    const { error } = await supabase.rpc('fn_start_delivery', {
      p_delivery_id: deliveryId,
    });
    
    if (error) {
      console.error('Erro ao iniciar entrega:', error);
      throw error;
    }
  }

  /**
   * Finalizar entrega
   */
  async completeDelivery(deliveryId: number, rating?: number): Promise<void> {
    const { error } = await supabase.rpc('fn_complete_delivery', {
      p_delivery_id: deliveryId,
      p_rating: rating,
    });
    
    if (error) {
      console.error('Erro ao finalizar entrega:', error);
      throw error;
    }
  }

  /**
   * Cancelar delivery
   */
  async cancelDelivery(deliveryId: number, reason: string): Promise<void> {
    const { error } = await supabase.rpc('fn_cancel_delivery', {
      p_delivery_id: deliveryId,
      p_reason: reason,
    });
    
    if (error) {
      console.error('Erro ao cancelar delivery:', error);
      throw error;
    }
  }

  /**
   * Listar entregadores
   */
  async getDeliveryMen(status?: string): Promise<DeliveryMan[]> {
    let query = supabase.from('delivery_men').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Erro ao buscar entregadores:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Criar entregador
   */
  async createDeliveryMan(deliveryMan: Partial<DeliveryMan>): Promise<DeliveryMan> {
    const { data, error } = await supabase
      .from('delivery_men')
      .insert([deliveryMan])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar entregador:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Atualizar entregador
   */
  async updateDeliveryMan(id: number, updates: Partial<DeliveryMan>): Promise<DeliveryMan> {
    const { data, error } = await supabase
      .from('delivery_men')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar entregador:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Obter performance de entregadores (hoje)
   */
  async getDeliveryPerformanceToday(): Promise<DeliveryPerformance[]> {
    const { data, error } = await supabase
      .from('vw_delivery_performance_today')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar performance:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Obter deliveries por status
   */
  async getDeliveriesByStatus(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_delivery_by_status')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar por status:', error);
      return [];
    }
    
    return data || [];
  }

  /**
   * Calcular tempo estimado
   */
  async calculateDeliveryTime(distanceKm: number = 5): Promise<number> {
    const { data, error } = await supabase.rpc('fn_calculate_delivery_time', {
      p_distance_km: distanceKm,
    });
    
    if (error) {
      console.error('Erro ao calcular tempo:', error);
      return 30; // Default 30 minutos
    }
    
    return data || 30;
  }
}

// Exportar instância única
export const deliveryService = new DeliveryService();
