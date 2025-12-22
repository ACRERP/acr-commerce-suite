import { supabase } from '../supabaseClient';

export interface Appointment {
    id?: number;
    client_id: number;
    professional_id?: string;
    service_id?: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
    total_value?: number;
    created_at?: string;
    updated_at?: string;
    
    // Joined fields
    clients?: {
        id: number;
        name: string;
        phone: string;
    };
}

class AppointmentService {
    async getAppointments(startDate: string, endDate: string): Promise<Appointment[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('*, clients(id, name, phone)')
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createAppointment(appointment: Appointment): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteAppointment(id: number): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}

export const appointmentService = new AppointmentService();
