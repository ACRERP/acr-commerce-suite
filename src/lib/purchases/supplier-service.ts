import { supabase } from '@/lib/supabaseClient';

export interface Supplier {
  id: string;
  created_at: string;
  updated_at: string;
  business_profile_id: string;
  name: string; // Razão Social
  trade_name?: string; // Nome Fantasia
  cnpj_cpf?: string;
  ie_rg?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
  active: boolean;
}

export interface CreateSupplierData {
  name: string;
  trade_name?: string;
  cnpj_cpf?: string;
  ie_rg?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
  active?: boolean;
}

class SupplierService {
  async getSuppliers({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,trade_name.ilike.%${search}%,cnpj_cpf.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return { 
      data: data as Supplier[], 
      count: count || 0
    };
  }

  async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Supplier;
  }

  async createSupplier(data: CreateSupplierData) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Fetch business_profile_id from user_profiles
    const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('business_profile_id')
        .eq('user_id', userData.user.id)
        .single();

    if (!userProfile) throw new Error('User profile not found');

    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({
        ...data,
        business_profile_id: userProfile.business_profile_id
      })
      .select()
      .single();

    if (error) throw error;
    return newSupplier as Supplier;
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierData>) {
    const { data: updatedSupplier, error } = await supabase
      .from('suppliers')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedSupplier as Supplier;
  }

  async deleteSupplier(id: string) {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const supplierService = new SupplierService();
