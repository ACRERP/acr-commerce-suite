import { supabase } from './supabaseClient';
import { validateClientData, sanitizeClientData, checkDuplicateClient, ClientValidationResult } from './clientValidation';

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

// Create new client with validation
export async function createClient(client: CreateClientData): Promise<{ client: Client; validation: ClientValidationResult }> {
  // Validate client data
  const validation = validateClientData(client, {
    requireCPF: false,
    requirePhone: false,
    requireAddress: false,
  });

  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Check for duplicate CPF/CNPJ
  if (client.cpf_cnpj) {
    const existingClients = await getClients();
    const duplicateCheck = checkDuplicateClient(client.cpf_cnpj, existingClients);
    if (duplicateCheck.isDuplicate) {
      throw new Error(`Cliente com CPF/CNPJ ${client.cpf_cnpj} já existe: ${duplicateCheck.existingClient?.name}`);
    }
  }

  // Sanitize data
  const sanitizedData = sanitizeClientData(client);

  const { data, error } = await supabase
    .from('clients')
    .insert(sanitizedData)
    .select()
    .single();

  if (error) throw error;
  
  return {
    client: data as Client,
    validation,
  };
}

// Update client with validation
export async function updateClient(client: UpdateClientData): Promise<{ client: Client; validation: ClientValidationResult }> {
  const { id, ...updateData } = client;

  // Validate update data
  const validation = validateClientData(updateData as CreateClientData, {
    requireCPF: false,
    requirePhone: false,
    requireAddress: false,
  });

  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Check for duplicate CPF/CNPJ (excluding current client)
  if (updateData.cpf_cnpj) {
    const existingClients = await getClients();
    const duplicateCheck = checkDuplicateClient(updateData.cpf_cnpj, existingClients, id);
    if (duplicateCheck.isDuplicate) {
      throw new Error(`Cliente com CPF/CNPJ ${updateData.cpf_cnpj} já existe: ${duplicateCheck.existingClient?.name}`);
    }
  }

  // Sanitize data
  const sanitizedData = sanitizeClientData(updateData as CreateClientData);
  
  const { data, error } = await supabase
    .from('clients')
    .update(sanitizedData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  return {
    client: data as Client,
    validation,
  };
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

// Search clients by CPF/CNPJ (exact or partial match)
export async function searchClientsByDocument(document: string): Promise<Client[]> {
  const cleanDocument = document.replace(/\D/g, '');
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .like('cpf_cnpj', `%${cleanDocument}%`)
    .order('name');

  if (error) throw error;
  return data as Client[];
}

// Get client by CPF/CNPJ (exact match)
export async function getClientByDocument(document: string): Promise<Client | null> {
  const cleanDocument = document.replace(/\D/g, '');
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('cpf_cnpj', cleanDocument)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw error;
  }
  
  return data as Client | null;
}
