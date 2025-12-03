import { supabase } from './supabaseClient';

export interface Client {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  cpf_cnpj?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  phone?: string;
  address?: string;
  cpf_cnpj?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: number;
}

// Get all clients
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Client[];
}

// Get client by ID
export async function getClientById(id: number) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Client;
}

// Create new client
export async function createClient(client: CreateClientData) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

// Update client
export async function updateClient(client: UpdateClientData) {
  const { id, ...updateData } = client;
  
  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

// Delete client
export async function deleteClient(id: number) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Search clients
export async function searchClients(query: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%,cpf_cnpj.ilike.%${query}%`)
    .order('name');

  if (error) throw error;
  return data as Client[];
}
