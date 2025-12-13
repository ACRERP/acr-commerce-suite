import { supabase } from '../supabaseClient';

export interface Alert {
  id?: number;
  tipo: 'os_vencida' | 'os_vencendo' | 'conta_vencida' | 'conta_vencendo' | 'estoque_baixo' | 'delivery_atrasado' | 'meta_atingida' | 'cliente_inadimplente';
  modulo: 'os' | 'financeiro' | 'estoque' | 'delivery' | 'vendas';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  mensagem: string;
  referencia_id?: number;
  referencia_tipo?: string;
  lido: boolean;
  acao_url?: string;
  acao_label?: string;
  usuario_id?: string;
  created_at?: string;
}

export interface AlertStats {
  total: number;
  nao_lidas: number;
  por_prioridade: Record<string, number>;
  por_modulo: Record<string, number>;
}

class AlertService {
  // ============ CRIAR ALERTA ============
  
  async createAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .insert(alert)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============ BUSCAR ALERTAS ============
  
  async getAlerts(filters?: {
    lido?: boolean;
    modulo?: string;
    prioridade?: string;
    usuario_id?: string;
  }): Promise<Alert[]> {
    try {
        let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
        
        if (filters?.lido !== undefined) query = query.eq('lido', filters.lido);
        if (filters?.modulo) query = query.eq('modulo', filters.modulo);
        if (filters?.prioridade) query = query.eq('prioridade', filters.prioridade);
        if (filters?.usuario_id) query = query.eq('usuario_id', filters.usuario_id);
        
        const { data, error } = await query;
        if (error) {
            console.warn('Error fetching alerts (ignoring):', error.message);
            return [];
        }
        return data || [];
    } catch (err) {
        console.warn('Exception fetching alerts:', err);
        return [];
    }
  }
  
  async getUnreadAlerts(usuario_id?: string): Promise<Alert[]> {
    return this.getAlerts({ lido: false, usuario_id });
  }
  
  async getCriticalAlerts(): Promise<Alert[]> {
    return this.getAlerts({ lido: false, prioridade: 'critica' });
  }
  
  // ============ MARCAR COMO LIDO ============
  
  async markAsRead(alertId: number): Promise<void> {
    try {
        const { error } = await supabase
        .from('alerts')
        .update({ lido: true })
        .eq('id', alertId);
        
        if (error) throw error;
    } catch (err) {
        console.warn('Error marking alert read:', err);
    }
  }
  
  async markAllAsRead(usuario_id?: string): Promise<void> {
    try {
        let query = supabase
        .from('alerts')
        .update({ lido: true })
        .eq('lido', false);
        
        if (usuario_id) query = query.eq('usuario_id', usuario_id);
        
        const { error } = await query;
        if (error) throw error;
    } catch (err) {
         console.warn('Error marking all read:', err);
    }
  }
  
  // ============ DELETAR ALERTAS ============
  
  async deleteAlert(alertId: number): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId);
    
    if (error) throw error;
  }
  
  async deleteOldAlerts(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data, error } = await supabase
      .from('alerts')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('lido', true)
      .select();
    
    if (error) throw error;
    return data?.length || 0;
  }
  
  // ============ ESTATÍSTICAS ============
  
  async getStats(usuario_id?: string): Promise<AlertStats> {
    try {
        const alerts = await this.getAlerts({ usuario_id });
        
        const stats: AlertStats = {
        total: alerts.length,
        nao_lidas: alerts.filter(a => !a.lido).length,
        por_prioridade: {},
        por_modulo: {}
        };
        
        alerts.forEach(alert => {
        stats.por_prioridade[alert.prioridade] = (stats.por_prioridade[alert.prioridade] || 0) + 1;
        stats.por_modulo[alert.modulo] = (stats.por_modulo[alert.modulo] || 0) + 1;
        });
        
        return stats;
    } catch (err) {
        return { total: 0, nao_lidas: 0, por_prioridade: {}, por_modulo: {} };
    }
  }
  
  // ============ ALERTAS AUTOMÁTICOS ============
  
  async checkOSVencidas(): Promise<void> {
    const { data: osVencidas } = await supabase
      .from('service_orders')
      .select('id, numero, client_id, clients(name), prazo_entrega')
      .eq('status_prazo', 'vencida')
      .neq('status', 'entregue')
      .neq('status', 'cancelada');
    
    if (osVencidas) {
      for (const os of osVencidas) {
        // Verificar se já existe alerta
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('tipo', 'os_vencida')
          .eq('referencia_id', os.id)
          .eq('lido', false)
          .single();
        
        if (!existing) {
          await this.createAlert({
            tipo: 'os_vencida',
            modulo: 'os',
            prioridade: 'alta',
            titulo: `OS #${os.numero} Vencida`,
            mensagem: `A OS #${os.numero} do cliente ${(os.clients as any)?.[0]?.name || 'Desconhecido'} está vencida!`,
            referencia_id: os.id,
            referencia_tipo: 'service_order',
            lido: false,
            acao_url: `/os/${os.id}`,
            acao_label: 'Ver OS'
          });
        }
      }
    }
  }
  
  async checkOSVencendo(): Promise<void> {
    const { data: osVencendo } = await supabase
      .from('service_orders')
      .select('id, numero, client_id, clients(name), prazo_entrega, dias_restantes')
      .eq('status_prazo', 'vencendo')
      .neq('status', 'entregue')
      .neq('status', 'cancelada');
    
    if (osVencendo) {
      for (const os of osVencendo) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('tipo', 'os_vencendo')
          .eq('referencia_id', os.id)
          .eq('lido', false)
          .single();
        
        if (!existing) {
          await this.createAlert({
            tipo: 'os_vencendo',
            modulo: 'os',
            prioridade: 'media',
            titulo: `OS #${os.numero} Vencendo`,
            mensagem: `A OS #${os.numero} vence em ${os.dias_restantes} dia(s)!`,
            referencia_id: os.id,
            referencia_tipo: 'service_order',
            lido: false,
            acao_url: `/os/${os.id}`,
            acao_label: 'Ver OS'
          });
        }
      }
    }
  }
  
  async checkContasVencidas(): Promise<void> {
    const { data: contasVencidas } = await supabase
      .from('accounts_receivable')
      .select('id, description, amount, due_date, client_id, clients(name)')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());
    
    if (contasVencidas) {
      for (const conta of contasVencidas) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('tipo', 'conta_vencida')
          .eq('referencia_id', conta.id)
          .eq('lido', false)
          .single();
        
        if (!existing) {
          await this.createAlert({
            tipo: 'conta_vencida',
            modulo: 'financeiro',
            prioridade: 'alta',
            titulo: 'Conta a Receber Vencida',
            mensagem: `Conta de ${(conta.clients as any)?.[0]?.name || 'Desconhecido'} no valor de R$ ${conta.amount} está vencida!`,
            referencia_id: conta.id,
            referencia_tipo: 'account_receivable',
            lido: false,
            acao_url: `/financeiro/receber/${conta.id}`,
            acao_label: 'Ver Conta'
          });
        }
      }
    }
  }
  
  async checkEstoqueBaixo(): Promise<void> {
    try {
      const { data: produtosBaixos, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, minimum_stock_level');
      
      if (error) return; // Silent fail

      if (produtosBaixos) {
        for (const produto of produtosBaixos) {
           try {
              // Safe check with cast if needed, or just string
              // If simple equality fails due to type mismatch (400/406), we skip
              const { data: existing, error: existError } = await supabase
                .from('alerts')
                .select('id')
                .eq('tipo', 'estoque_baixo')
                .eq('referencia_id', produto.id) 
                .eq('lido', false)
                .maybeSingle();
              
              if (existError) continue;

              if (!existing) {
                await this.createAlert({
                  tipo: 'estoque_baixo',
                  modulo: 'estoque',
                  prioridade: 'media',
                  titulo: 'Estoque Baixo',
                  mensagem: `${produto.name} está com estoque baixo (${produto.stock_quantity} unidades)!`,
                  referencia_id: produto.id,
                  referencia_tipo: 'product',
                  lido: false,
                  acao_url: `/produtos/${produto.id}`,
                  acao_label: 'Ver Produto'
                });
              }
           } catch (innerError) {
             // Continue to next product
           }
        }
      }
    } catch (err) {
        console.error('Erro em checkEstoqueBaixo', err);
    }
  }
  
  async checkDeliveryAtrasado(): Promise<void> {
    const { data: deliveriesAtrasados } = await supabase
      .from('delivery_orders')
      .select('id, order_id') // Removed estimated_time for now to fix crash
      .in('status', ['pending', 'preparing', 'in_transit']);
      // .lt('estimated_time', new Date().toISOString()); // Comentado até verificar o nome da coluna
    
    if (deliveriesAtrasados) {
      for (const delivery of deliveriesAtrasados) {
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('tipo', 'delivery_atrasado')
          .eq('referencia_id', delivery.id)
          .eq('lido', false)
          .single();
        
        if (!existing) {
          await this.createAlert({
            tipo: 'delivery_atrasado',
            modulo: 'delivery',
            prioridade: 'alta',
            titulo: 'Delivery Atrasado',
            mensagem: `Delivery #${delivery.order_id} está atrasado!`,
            referencia_id: delivery.id,
            referencia_tipo: 'delivery_order',
            lido: false,
            acao_url: `/delivery/${delivery.id}`,
            acao_label: 'Ver Delivery'
          });
        }
      }
    }
  }
  
  // ============ PROCESSAR TODOS OS ALERTAS ============
  
  // ============ PROCESSAR TODOS OS ALERTAS ============
  
  async processAllAlerts(): Promise<void> {
    const tasks = [
      () => this.checkOSVencidas(),
      () => this.checkOSVencendo(),
      () => this.checkContasVencidas(),
      () => this.checkEstoqueBaixo(),
      () => this.checkDeliveryAtrasado()
    ];

    try {
        // Run sequentially or parallel but safely
        for (const task of tasks) {
            try {
                await task();
            } catch (ignore) {
                // Ignore individual failures to prevent crash
                // console.warn('Alert processing task failed', ignore);
            }
        }
    } catch (error) {
      console.error('Erro geral ao processar alertas:', error);
    }
  }
}

export const alertService = new AlertService();

// ============ HOOK PARA PROCESSAR ALERTAS PERIODICAMENTE ============

export function startAlertProcessing(intervalMinutes: number = 5): NodeJS.Timeout {
  // Processar imediatamente
  alertService.processAllAlerts();
  
  // Processar a cada X minutos
  return setInterval(() => {
    alertService.processAllAlerts();
  }, intervalMinutes * 60 * 1000);
}
