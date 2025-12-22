import { supabase } from '../supabaseClient';

export interface ServiceOrder {
  id?: number;
  numero?: string;
  client_id: number;
  user_id?: string; // Técnico
  
  // Equipamento
  device_type: string;
  device_brand?: string;
  device_model?: string;
  serial_number?: string;
  
  // Automotivo
  vehicle_plate?: string;
  vehicle_km?: string;
  vehicle_year?: string;
  vehicle_chassis?: string;
  vehicle_color?: string;
  
  // Problema
  reported_issue: string;
  technician_notes?: string;
  diagnostico?: string;
  solucao_proposta?: string;
  
  // Controle
  status: 'aberta' | 'em_andamento' | 'aguardando_peca' | 'concluida' | 'entregue' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  prazo_entrega?: string;
  status_prazo?: 'no_prazo' | 'no_limite' | 'vencendo' | 'vencida';
  dias_restantes?: number;
  
  // Datas
  data_inicio_reparo?: string;
  data_conclusao?: string;
  data_entrega?: string;
  
  // Financeiro
  valor_servicos?: number;
  valor_pecas?: number;
  valor_total?: number;
  desconto?: number;
  valor_final?: number;
  orcamento_aprovado?: boolean;
  data_aprovacao?: string;
  
  // Termos
  termo_entrada?: string;
  termo_garantia?: string;
  assinatura_cliente?: string;
  data_assinatura?: string;
  
  // Entrega
  entregue_para?: string;
  documento_entrega?: string;
  
  // Marketing
  origem_cliente?: string;
  feedback_enviado?: boolean;
  avaliacao?: number;
  comentario_avaliacao?: string;
  
  // Checklist
  power_on?: boolean;
  has_password?: boolean;
  password_details?: string;
  network_status?: string;
  exit_test_ok?: boolean;
  checklist_data?: any;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Relations (Joined fields)
  clients?: {
    id: number;
    name: string;
    phone: string;
    cpf_cnpj: string;
    email: string;
  };
  users?: {
    id: string;
    email: string;
    full_name: string;
  };
  acessorios?: OSAccessory[]; // For Create/Update logic
}

export interface OSAccessory {
  id?: number;
  service_order_id: number;
  descricao: string;
  quantidade?: number;
  devolvido?: boolean;
  foto_url?: string;
  observacoes?: string;
}

export interface OSPhoto {
  id?: number;
  service_order_id: number;
  tipo: 'entrada' | 'durante' | 'saida' | 'defeito';
  url: string;
  descricao?: string;
}

export interface OSNote {
  id?: number;
  service_order_id: number;
  tipo: 'publica' | 'interna';
  conteudo: string;
  usuario_id?: string;
}

export interface OSServiceItem {
  id?: number;
  service_order_id: number;
  descricao: string;
  quantidade?: number;
  valor_unitario: number;
  valor_total: number;
  tecnico_id?: string;
}

export interface OSPart {
  id?: number;
  service_order_id: number;
  produto_id?: number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface TechnicianProductivity {
  tecnico_id: string;
  nome: string;
  os_concluidas: number;
  os_em_andamento: number;
  tempo_medio_horas: number;
  taxa_aprovacao: number;
  faturamento_servicos: number;
  faturamento_pecas: number;
  faturamento_total: number;
}

export interface OSDashboard {
  total_os: number;
  os_abertas: number;
  os_em_andamento: number;
  os_concluidas: number;
  os_entregues: number;
  os_canceladas: number;
  os_vencidas: number;
  os_vencendo: number;
  os_urgentes: number;
  os_alta_prioridade: number;
  ticket_medio: number;
  faturamento_dia: number;
  faturamento_mes: number;
  taxa_aprovacao_geral: number;
  taxa_cancelamento: number;
}

class OSService {
  // ============ CRUD BÁSICO ============
  
  async createOS(os: ServiceOrder): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_orders')
      .insert(os)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getOSById(id: number): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getAllOS(filters?: {
    status?: string;
    prioridade?: string;
    status_prazo?: string;
    tecnico_id?: string;
  }): Promise<ServiceOrder[]> {
    let query = supabase
      .from('service_orders')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });
    
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.prioridade) query = query.eq('prioridade', filters.prioridade);
    if (filters?.status_prazo) query = query.eq('status_prazo', filters.status_prazo);
    if (filters?.tecnico_id) query = query.eq('user_id', filters.tecnico_id);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  async updateOS(id: number, updates: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const { data, error } = await supabase
      .from('service_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async deleteOS(id: number): Promise<void> {
    const { error } = await supabase
      .from('service_orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // ============ KANBAN ============
  
  async getOSKanban(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_os_kanban')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  // ============ STATUS ============
  
  async updateStatus(
    osId: number, 
    newStatus: ServiceOrder['status'],
    observacao?: string
  ): Promise<ServiceOrder> {
    const os = await this.updateOS(osId, { status: newStatus });
    
    // Registrar no histórico (feito automaticamente pelo trigger)
    
    // Enviar WhatsApp (se configurado)
    await this.sendWhatsAppStatusUpdate(osId, newStatus);
    
    return os;
  }
  
  // ============ ACESSÓRIOS ============
  
  async addAccessory(accessory: OSAccessory): Promise<OSAccessory> {
    const { data, error } = await supabase
      .from('service_order_accessories')
      .insert(accessory)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getAccessories(osId: number): Promise<OSAccessory[]> {
    const { data, error } = await supabase
      .from('service_order_accessories')
      .select('*')
      .eq('service_order_id', osId);
    
    if (error) throw error;
    return data || [];
  }
  
  async updateAccessory(id: number, updates: Partial<OSAccessory>): Promise<OSAccessory> {
    const { data, error } = await supabase
      .from('service_order_accessories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async markAccessoryReturned(id: number): Promise<OSAccessory> {
    return this.updateAccessory(id, { devolvido: true });
  }
  
  // ============ FOTOS ============
  
  async addPhoto(photo: OSPhoto): Promise<OSPhoto> {
    const { data, error } = await supabase
      .from('service_order_photos')
      .insert(photo)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getPhotos(osId: number, tipo?: OSPhoto['tipo']): Promise<OSPhoto[]> {
    let query = supabase
      .from('service_order_photos')
      .select('*')
      .eq('service_order_id', osId);
    
    if (tipo) query = query.eq('tipo', tipo);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  // ============ NOTAS ============
  
  async addNote(note: OSNote): Promise<OSNote> {
    const { data, error } = await supabase
      .from('service_order_notes')
      .insert(note)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getNotes(osId: number, tipo?: OSNote['tipo']): Promise<OSNote[]> {
    let query = supabase
      .from('service_order_notes')
      .select('*, users:usuario_id(*)')
      .eq('service_order_id', osId)
      .order('created_at', { ascending: true });
    
    if (tipo) query = query.eq('tipo', tipo);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  // ============ SERVIÇOS ============
  
  async addService(service: OSServiceItem): Promise<OSServiceItem> {
    const { data, error } = await supabase
      .from('service_order_services')
      .insert(service)
      .select()
      .single();
    
    if (error) throw error;
    
    // Recalcular valor total da OS
    await this.recalcularValores(service.service_order_id);
    
    return data;
  }
  
  async getServices(osId: number): Promise<OSServiceItem[]> {
    const { data, error } = await supabase
      .from('service_order_services')
      .select('*')
      .eq('service_order_id', osId);
    
    if (error) throw error;
    return data || [];
  }
  
  async removeService(id: number, osId: number): Promise<void> {
    const { error } = await supabase
      .from('service_order_services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Recalcular valor total
    await this.recalcularValores(osId);
  }
  
  // ============ PEÇAS ============
  
  async addPart(part: OSPart): Promise<OSPart> {
    const { data, error } = await supabase
      .from('service_order_parts')
      .insert(part)
      .select()
      .single();
    
    if (error) throw error;
    
    // Recalcular valor total da OS
    await this.recalcularValores(part.service_order_id);
    
    return data;
  }
  
  async getParts(osId: number): Promise<OSPart[]> {
    const { data, error } = await supabase
      .from('service_order_parts')
      .select('*')
      .eq('service_order_id', osId);
    
    if (error) throw error;
    return data || [];
  }
  
  async removePart(id: number, osId: number): Promise<void> {
    const { error } = await supabase
      .from('service_order_parts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Recalcular valor total
    await this.recalcularValores(osId);
  }
  
  // ============ CÁLCULOS ============
  
  async recalcularValores(osId: number): Promise<void> {
    // Buscar serviços
    const services = await this.getServices(osId);
    const valor_servicos = services.reduce((sum, s) => sum + (s.valor_total || 0), 0);
    
    // Buscar peças
    const parts = await this.getParts(osId);
    const valor_pecas = parts.reduce((sum, p) => sum + (p.valor_total || 0), 0);
    
    // Atualizar OS (trigger calculará valor_total e valor_final)
    await this.updateOS(osId, {
      valor_servicos,
      valor_pecas
    });
  }
  
  // ============ ORÇAMENTO ============
  
  async aprovarOrcamento(osId: number): Promise<ServiceOrder> {
    return this.updateOS(osId, {
      orcamento_aprovado: true,
      data_aprovacao: new Date().toISOString(),
      status: 'em_andamento',
      data_inicio_reparo: new Date().toISOString()
    });
  }
  
  async recusarOrcamento(osId: number, motivo?: string): Promise<ServiceOrder> {
    if (motivo) {
      await this.addNote({
        service_order_id: osId,
        tipo: 'interna',
        conteudo: `Orçamento recusado: ${motivo}`
      });
    }
    
    return this.updateOS(osId, {
      orcamento_aprovado: false,
      status: 'cancelada'
    });
  }
  
  // ============ DASHBOARD ============
  
  async getDashboard(): Promise<OSDashboard> {
    const { data, error } = await supabase
      .from('vw_os_dashboard')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async getTechnicianProductivity(): Promise<TechnicianProductivity[]> {
    const { data, error } = await supabase
      .from('vw_technician_productivity')
      .select('*')
      .order('faturamento_total', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  async getOrigemClientes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_os_origem_clientes')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  async getServicosMaisVendidos(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_os_servicos_mais_vendidos')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  async getPecasMaisVendidas(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vw_os_pecas_mais_vendidas')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  // ============ WHATSAPP ============
  
  async sendWhatsAppStatusUpdate(osId: number, status: string): Promise<void> {
    const os = await this.getOSById(osId);
    
    const mensagens: Record<string, string> = {
      'aberta': '✅ Recebemos seu equipamento! Número da OS: {numero}',
      'em_andamento': '🔧 Iniciamos o reparo do seu equipamento. OS: {numero}',
      'aguardando_peca': '⏳ Aguardando peça para continuar o reparo. OS: {numero}',
      'concluida': '🎉 Seu equipamento está pronto! OS: {numero}',
      'entregue': '✨ Obrigado pela preferência! OS: {numero}',
      'cancelada': '❌ OS cancelada. Entre em contato para mais informações. OS: {numero}'
    };
    
    const mensagem = mensagens[status]?.replace('{numero}', os.numero || '');
    
    if (mensagem) {
      // Log da mensagem (implementação real do WhatsApp virá depois)
      await supabase
        .from('service_order_whatsapp_log')
        .insert({
          service_order_id: osId,
          tipo: 'status_update',
          telefone: '', // Buscar do cliente
          mensagem,
          enviado: false
        });
    }
  }
  
  async sendFeedbackRequest(osId: number): Promise<void> {
    const os = await this.getOSById(osId);
    
    const mensagem = `Olá! Como foi sua experiência com nosso serviço? (OS: ${os.numero})
    
Avalie de 1 a 5 estrelas:
⭐ ⭐⭐ ⭐⭐⭐ ⭐⭐⭐⭐ ⭐⭐⭐⭐⭐`;
    
    await supabase
      .from('service_order_whatsapp_log')
      .insert({
        service_order_id: osId,
        tipo: 'feedback',
        telefone: '', // Buscar do cliente
        mensagem,
        enviado: false
      });
    
    await this.updateOS(osId, { feedback_enviado: true });
  }
  
  // ============ HISTÓRICO ============
  
  async getHistory(osId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('service_order_history')
      .select('*, users:usuario_id(*)')
      .eq('service_order_id', osId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============ RELATÓRIOS ============
  
  async getOSByPeriod(startDate: string, endDate: string): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, clients(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  async getOSVencidas(): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, clients(*)')
      .eq('status_prazo', 'vencida')
      .neq('status', 'entregue')
      .neq('status', 'cancelada')
      .order('prazo_entrega', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  async getOSUrgentes(): Promise<ServiceOrder[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, clients(*)')
      .in('prioridade', ['urgente', 'alta'])
      .neq('status', 'entregue')
      .neq('status', 'cancelada')
      .order('prioridade', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // ============ VEÍCULOS ============

  async getVehicles(clientId?: number): Promise<any[]> {
    let query = supabase.from('vehicles').select('*');
    if (clientId) query = query.eq('client_id', clientId);
    
    const { data, error } = await query.order('plate');
    if (error) throw error;
    return data || [];
  }

  async getVehicleById(id: number): Promise<any> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, clients(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getVehicleByPlate(plate: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate', plate.toUpperCase())
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  async createVehicle(vehicle: any): Promise<any> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ ...vehicle, plate: vehicle.plate.toUpperCase() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateVehicle(id: number, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...updates, plate: updates.plate?.toUpperCase() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export const osService = new OSService();
