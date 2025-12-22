/**
 * Serviço de Clientes - Completo
 * 
 * Gerencia clientes, crédito, bloqueio e histórico
 */

import { supabase } from '@/lib/supabaseClient';

export interface Client {
  id: number;
  name: string;
  cpf_cnpj?: string;
  phone?: string;
  whatsapp?: string;
  secondary_phone?: string;
  email?: string;
  
  // Endereço
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Dados pessoais/jurídicos
  client_type: 'pf' | 'pj';
  birth_date?: string;
  rg_ie?: string;
  
  // Crédito
  credit_limit: number;
  credit_used: number;
  credit_available: number;
  allow_credit: boolean;
  
  // Status
  status: 'active' | 'inactive';
  financial_status: 'ok' | 'late' | 'blocked';
  blocked: boolean;
  blocked_reason?: string;
  blocked_at?: string;
  
  // Estatísticas
  last_purchase_date?: string;
  total_purchases: number;
  total_spent: number;
  
  // Observações
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ClientFinancialSummary extends Client {
  total_debt: number;
  overdue_debt: number;
  overdue_count: number;
  next_due_date?: string;
  average_ticket: number;
}

export class ClientService {
  /**
   * Listar todos os clientes
   */
  async getClients(filters?: {
    status?: string;
    financial_status?: string;
    city?: string;
    blocked?: boolean;
  }): Promise<Client[]> {
    let query = supabase.from('clients').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.financial_status) {
      query = query.eq('financial_status', filters.financial_status);
    }
    if (filters?.city) {
      query = query.eq('city', filters.city);
    }
    if (filters?.blocked !== undefined) {
      query = query.eq('blocked', filters.blocked);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Buscar cliente por ID
   */
  async getClientById(id: number): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Obter resumo financeiro do cliente
   */
  async getClientFinancialSummary(clientId: number): Promise<ClientFinancialSummary | null> {
    const { data, error } = await supabase
      .from('vw_client_financial_summary')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      return null;
    }
    
    return data;
  }

  /**
   * Criar cliente
   */
  async createClient(client: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Atualizar cliente
   */
  async updateClient(id: number, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Bloquear cliente
   */
  async blockClient(clientId: number, reason: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('fn_block_client', {
      p_client_id: clientId,
      p_reason: reason,
      p_user_id: userId,
    });
    
    if (error) {
      console.error('Erro ao bloquear cliente:', error);
      throw error;
    }
  }

  /**
   * Desbloquear cliente
   */
  async unblockClient(clientId: number, userId: string): Promise<void> {
    const { error } = await supabase.rpc('fn_unblock_client', {
      p_client_id: clientId,
      p_user_id: userId,
    });
    
    if (error) {
      console.error('Erro ao desbloquear cliente:', error);
      throw error;
    }
  }

  /**
   * Atualizar limite de crédito
   */
  async updateCreditLimit(clientId: number, newLimit: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ credit_limit: newLimit })
      .eq('id', clientId);
    
    if (error) {
      console.error('Erro ao atualizar limite de crédito:', error);
      throw error;
    }
    
    // Verificar se precisa bloquear/desbloquear
    await supabase.rpc('fn_check_credit_limit', {
      p_client_id: clientId,
    });
  }

  /**
   * Buscar clientes (search)
   */
  async searchClients(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,cpf_cnpj.ilike.%${query}%,phone.ilike.%${query}%,whatsapp.ilike.%${query}%`)
      .limit(50);
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
    
    return data || [];
  }
}

// Exportar instância única
export const clientService = new ClientService();
