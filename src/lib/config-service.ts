import { supabase } from './supabaseClient';

export interface SystemConfig {
  id: number;
  key: string;
  value: any;
  updated_at: string;
  created_at: string;
}

/**
 * Busca uma configuração específica por chave
 */
export async function getConfig(key: string): Promise<any> {
  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', key)
    .single();

  if (error) {
    console.error(`Erro ao buscar configuração ${key}:`, error);
    throw error;
  }

  return data?.value || null;
}

/**
 * Busca todas as configurações
 */
export async function getAllConfigs(): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('system_config')
    .select('key, value');

  if (error) {
    console.error('Erro ao buscar todas configurações:', error);
    throw error;
  }

  // Converter array para objeto { key: value }
  const configs: Record<string, any> = {};
  data?.forEach(item => {
    configs[item.key] = item.value;
  });

  return configs;
}

/**
 * Atualiza uma configuração específica
 */
export async function updateConfig(key: string, value: any): Promise<SystemConfig> {
  const { data, error } = await supabase
    .from('system_config')
    .update({ 
      value,
      updated_at: new Date().toISOString()
    })
    .eq('key', key)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar configuração ${key}:`, error);
    throw error;
  }

  return data;
}

/**
 * Cria ou atualiza uma configuração (upsert)
 */
export async function upsertConfig(key: string, value: any): Promise<SystemConfig> {
  const { data, error } = await supabase
    .from('system_config')
    .upsert({ 
      key,
      value,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error(`Erro ao fazer upsert da configuração ${key}:`, error);
    throw error;
  }

  return data;
}

/**
 * Deleta uma configuração
 */
export async function deleteConfig(key: string): Promise<void> {
  const { error } = await supabase
    .from('system_config')
    .delete()
    .eq('key', key);

  if (error) {
    console.error(`Erro ao deletar configuração ${key}:`, error);
    throw error;
  }
}
