import { supabase } from './supabaseClient';

export interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  read_at?: string;
  created_at: string;
}

/**
 * Busca todos os alertas
 */
export async function getAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Busca apenas alertas não lidos
 */
export async function getUnreadAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('read', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Marca um alerta como lido
 */
export async function markAlertAsRead(id: number): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ 
      read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Marca todos os alertas como lidos
 */
export async function markAllAlertsAsRead(): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ 
      read: true,
      read_at: new Date().toISOString()
    })
    .eq('read', false);

  if (error) throw error;
}

/**
 * Cria um novo alerta
 */
export async function createAlert(alert: Omit<Alert, 'id' | 'read' | 'read_at' | 'created_at'>): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deleta um alerta
 */
export async function deleteAlert(id: number): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
