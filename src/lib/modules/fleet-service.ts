import { supabase } from '@/lib/supabase';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  status: 'available' | 'in_transit' | 'maintenance';
  driver_id?: string;
  current_km: number;
  driver?: {
    name: string;
  };
}

export const fleetService = {
  async getVehicles() {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select(`
        *,
        driver:driver_id (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Vehicle[];
  },

  async createVehicle(vehicle: Partial<Vehicle>) {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .insert(vehicle)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVehicleStatus(id: string, status: string) {
    const { error } = await supabase
      .from('fleet_vehicles')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async getStats() {
    // This could be optimized with an RPC similar to dashboard stats if needed
    // For now we calculate client-side or assume small fleet size
    const { data: vehicles } = await supabase.from('fleet_vehicles').select('status');
    
    return {
      total: vehicles?.length || 0,
      inTransit: vehicles?.filter(v => v.status === 'in_transit').length || 0,
      maintenance: vehicles?.filter(v => v.status === 'maintenance').length || 0,
    };
  }
};
