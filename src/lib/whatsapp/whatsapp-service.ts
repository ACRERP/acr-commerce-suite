import { supabase } from '../supabaseClient';

export interface WhatsAppMessage {
  id?: number;
  modulo: 'os' | 'vendas' | 'delivery' | 'financeiro' | 'marketing';
  tipo: string;
  destinatario_id: number;
  telefone: string;
  mensagem: string;
  enviado: boolean;
  data_envio?: string;
  erro?: string;
  metadata?: any;
  created_at?: string;
}

export interface WhatsAppConfig {
  id?: number;
  api_url?: string;
  api_key?: string;
  instance_id?: string;
  ativo: boolean;
  envio_automatico: boolean;
  horario_inicio?: string;
  horario_fim?: string;
}

class WhatsAppService {
  // ============ CONFIGURAÇÃO ============
  
  async getConfig(): Promise<WhatsAppConfig | null> {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .single();
    
    if (error) {
      console.error('Erro ao buscar config WhatsApp:', error);
      return null;
    }
    
    return data;
  }
  
  async updateConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .upsert(config)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============ ENVIO DE MENSAGENS ============
  
  async sendMessage(message: Omit<WhatsAppMessage, 'id' | 'created_at'>): Promise<WhatsAppMessage> {
    try {
      // Salvar no log
      const { data: logData, error: logError } = await supabase
        .from('whatsapp_messages')
        .insert(message)
        .select()
        .single();
      
      if (logError) throw logError;
      
      // Verificar se envio automático está ativo
      const config = await this.getConfig();
      
      if (!config?.ativo || !config?.envio_automatico) {
        console.log('WhatsApp não configurado ou envio automático desativado');
        return logData;
      }
      
      // Verificar horário permitido
      if (!this.isWithinAllowedHours(config)) {
        console.log('Fora do horário permitido para envio');
        return logData;
      }
      
      // Enviar mensagem (implementação real virá depois)
      // Por enquanto, apenas simular envio
      const sent = await this.sendToWhatsAppAPI(
        message.telefone,
        message.mensagem,
        config
      );
      
      // Atualizar log
      const { data: updatedData } = await supabase
        .from('whatsapp_messages')
        .update({
          enviado: sent.success,
          data_envio: sent.success ? new Date().toISOString() : null,
          erro: sent.error || null
        })
        .eq('id', logData.id)
        .select()
        .single();
      
      return updatedData || logData;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      throw error;
    }
  }
  
  private async sendToWhatsAppAPI(
    telefone: string,
    mensagem: string,
    config: WhatsAppConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar se tem configuração completa
      if (!config.api_url || !config.api_key || !config.instance_id) {
        console.log('📱 WhatsApp (simulado - sem config):', { telefone, mensagem });
        return { success: true }; // Simular sucesso se não configurado
      }

      // Formatar telefone (remover caracteres especiais e adicionar código do país)
      let telefoneFormatado = telefone.replace(/\D/g, '');
      if (!telefoneFormatado.startsWith('55')) {
        telefoneFormatado = '55' + telefoneFormatado;
      }

      // Enviar via Evolution API
      const response = await fetch(`${config.api_url}/message/sendText/${config.instance_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.api_key
        },
        body: JSON.stringify({
          number: telefoneFormatado,
          text: mensagem,
          delay: 1000
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao enviar mensagem');
      }

      console.log('✅ WhatsApp enviado:', { telefone: telefoneFormatado, messageId: result.key?.id });
      return { success: true };

    } catch (error: any) {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
  
  private isWithinAllowedHours(config: WhatsAppConfig): boolean {
    if (!config.horario_inicio || !config.horario_fim) {
      return true; // Sem restrição de horário
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = config.horario_inicio.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    
    const [endHour, endMinute] = config.horario_fim.split(':').map(Number);
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  }
  
  // ============ ENVIO EM LOTE ============
  
  async sendBulkMessages(messages: Omit<WhatsAppMessage, 'id' | 'created_at'>[]): Promise<void> {
    for (const message of messages) {
      try {
        await this.sendMessage(message);
        // Aguardar 1 segundo entre mensagens para evitar bloqueio
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Erro ao enviar mensagem em lote:', error);
      }
    }
  }
  
  // ============ CONSULTAS ============
  
  async getMessages(filters?: {
    modulo?: string;
    enviado?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<WhatsAppMessage[]> {
    let query = supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.modulo) query = query.eq('modulo', filters.modulo);
    if (filters?.enviado !== undefined) query = query.eq('enviado', filters.enviado);
    if (filters?.startDate) query = query.gte('created_at', filters.startDate);
    if (filters?.endDate) query = query.lte('created_at', filters.endDate);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  async getPendingMessages(): Promise<WhatsAppMessage[]> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('enviado', false)
      .is('erro', null)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  async retryFailedMessages(): Promise<void> {
    const { data: failedMessages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('enviado', false)
      .not('erro', 'is', null);
    
    if (failedMessages) {
      for (const msg of failedMessages) {
        try {
          await this.sendMessage({
            modulo: msg.modulo,
            tipo: msg.tipo,
            destinatario_id: msg.destinatario_id,
            telefone: msg.telefone,
            mensagem: msg.mensagem,
            enviado: false,
            metadata: msg.metadata
          });
        } catch (error) {
          console.error('Erro ao reenviar mensagem:', error);
        }
      }
    }
  }
  
  // ============ ESTATÍSTICAS ============
  
  async getStats(startDate?: string, endDate?: string): Promise<{
    total: number;
    enviadas: number;
    pendentes: number;
    falhas: number;
    por_modulo: Record<string, number>;
  }> {
    let query = supabase
      .from('whatsapp_messages')
      .select('*');
    
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    
    const { data, error } = await query;
    if (error) throw error;
    
    const messages = data || [];
    
    const stats = {
      total: messages.length,
      enviadas: messages.filter(m => m.enviado).length,
      pendentes: messages.filter(m => !m.enviado && !m.erro).length,
      falhas: messages.filter(m => !m.enviado && m.erro).length,
      por_modulo: {} as Record<string, number>
    };
    
    messages.forEach(m => {
      stats.por_modulo[m.modulo] = (stats.por_modulo[m.modulo] || 0) + 1;
    });
    
    return stats;
  }
  
  // ============ AGENDAMENTO ============
  
  async scheduleMessage(
    message: Omit<WhatsAppMessage, 'id' | 'created_at'>,
    scheduledFor: Date
  ): Promise<void> {
    // Salvar mensagem com flag de agendada
    await supabase
      .from('whatsapp_messages')
      .insert({
        ...message,
        metadata: {
          ...message.metadata,
          scheduled_for: scheduledFor.toISOString(),
          scheduled: true
        }
      });
  }
  
  async processScheduledMessages(): Promise<void> {
    const now = new Date().toISOString();
    
    const { data: scheduledMessages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('enviado', false)
      .lte('metadata->scheduled_for', now)
      .eq('metadata->scheduled', true);
    
    if (scheduledMessages) {
      for (const msg of scheduledMessages) {
        try {
          await this.sendMessage({
            modulo: msg.modulo,
            tipo: msg.tipo,
            destinatario_id: msg.destinatario_id,
            telefone: msg.telefone,
            mensagem: msg.mensagem,
            enviado: false,
            metadata: msg.metadata
          });
        } catch (error) {
          console.error('Erro ao enviar mensagem agendada:', error);
        }
      }
    }
  }
  
  // ============ LIMPEZA ============
  
  async cleanOldMessages(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select();
    
    if (error) throw error;
    return data?.length || 0;
  }

  // ============ VERIFICAÇÃO DE CONEXÃO ============

  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const config = await this.getConfig();

      if (!config || !config.api_url || !config.api_key || !config.instance_id) {
        return { connected: false, error: 'Configuração incompleta' };
      }

      const response = await fetch(
        `${config.api_url}/instance/connectionState/${config.instance_id}`,
        {
          headers: { 'apikey': config.api_key }
        }
      );

      const result = await response.json();

      return {
        connected: result.state === 'open',
        error: result.state !== 'open' ? 'WhatsApp desconectado' : undefined
      };

    } catch (error: any) {
      return { connected: false, error: error.message };
    }
  }

  // ============ QR CODE ============

  async getQRCode(): Promise<{ qrcode?: string; error?: string }> {
    try {
      const config = await this.getConfig();

      if (!config || !config.api_url || !config.api_key || !config.instance_id) {
        return { error: 'Configuração incompleta' };
      }

      const response = await fetch(
        `${config.api_url}/instance/connect/${config.instance_id}`,
        {
          headers: { 'apikey': config.api_key }
        }
      );

      const result = await response.json();

      return {
        qrcode: result.qrcode?.base64 || result.qrcode
      };

    } catch (error: any) {
      return { error: error.message };
    }
  }
}

export const whatsappService = new WhatsAppService();

// ============ PROCESSAMENTO AUTOMÁTICO ============

export function startWhatsAppProcessing(intervalMinutes: number = 5): NodeJS.Timeout {
  // Processar mensagens agendadas
  whatsappService.processScheduledMessages();

  return setInterval(() => {
    whatsappService.processScheduledMessages();
  }, intervalMinutes * 60 * 1000);
}
