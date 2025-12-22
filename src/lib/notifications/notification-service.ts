/**
 * Serviço de Notificações
 * 
 * Gerencia notificações do sistema, alertas e lembretes
 */

import { supabase } from '@/lib/supabaseClient';

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert';

export type NotificationCategory =
  | 'sale'
  | 'stock'
  | 'financial'
  | 'delivery'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class NotificationService {
  /**
   * Obter notificações do usuário
   */
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    // Simulação - em produção, buscar do banco
    const notifications: Notification[] = [];

    // Verificar estoque baixo
    const lowStockItems = await this.checkLowStock();
    if (lowStockItems.length > 0) {
      notifications.push({
        id: `stock-${Date.now()}`,
        type: 'warning',
        category: 'stock',
        title: 'Estoque Baixo',
        message: `${lowStockItems.length} produto(s) com estoque abaixo do mínimo`,
        read: false,
        actionUrl: '/estoque',
        actionLabel: 'Ver Produtos',
        metadata: { items: lowStockItems },
        createdAt: new Date(),
      });
    }

    // Verificar contas vencidas
    const overdueAccounts = await this.checkOverdueAccounts();
    if (overdueAccounts.length > 0) {
      notifications.push({
        id: `financial-${Date.now()}`,
        type: 'error',
        category: 'financial',
        title: 'Contas Vencidas',
        message: `${overdueAccounts.length} conta(s) vencida(s)`,
        read: false,
        actionUrl: '/financeiro',
        actionLabel: 'Ver Contas',
        metadata: { accounts: overdueAccounts },
        createdAt: new Date(),
      });
    }

    // Verificar deliveries pendentes
    const pendingDeliveries = await this.checkPendingDeliveries();
    if (pendingDeliveries.length > 0) {
      notifications.push({
        id: `delivery-${Date.now()}`,
        type: 'info',
        category: 'delivery',
        title: 'Entregas Pendentes',
        message: `${pendingDeliveries.length} entrega(s) aguardando`,
        read: false,
        actionUrl: '/delivery',
        actionLabel: 'Ver Entregas',
        metadata: { deliveries: pendingDeliveries },
        createdAt: new Date(),
      });
    }

    return notifications;
  }

  /**
   * Verificar produtos com estoque baixo
   */
  private async checkLowStock(): Promise<any[]> {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, minimum_stock_level')
      .limit(50); // Fetch more to filter locally

    if (error) {
      console.error('Erro ao verificar estoque:', error);
      return [];
    }

    // Filtra localmente onde estoque < minimo
    // Considera 0 como minimo se minimum_stock_level for null
    return (data || []).filter(p => {
        const min = p.minimum_stock_level || 0;
        return (p.stock_quantity || 0) < min;
    }).slice(0, 10);
  }

  /**
   * Verificar contas vencidas
   */
  private async checkOverdueAccounts(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];

    // Contas a receber vencidas
    const { data: receivables } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)
      .limit(10);

    // Contas a pagar vencidas
    const { data: payables } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)
      .limit(10);

    return [...(receivables || []), ...(payables || [])];
  }

  /**
   * Verificar deliveries pendentes
   */
  private async checkPendingDeliveries(): Promise<any[]> {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .in('status', ['pending', 'in_transit'])
      .limit(10);

    if (error) {
      console.error('Erro ao verificar deliveries:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    // Em produção, atualizar no banco
    console.log('Marcando notificação como lida:', notificationId);
  }

  /**
   * Marcar todas como lidas
   */
  async markAllAsRead(): Promise<void> {
    // Em produção, atualizar no banco
    console.log('Marcando todas as notificações como lidas');
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId: string): Promise<void> {
    // Em produção, deletar do banco
    console.log('Deletando notificação:', notificationId);
  }

  /**
   * Obter contagem de não lidas
   */
  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();
    return notifications.filter(n => !n.read).length;
  }
}

// Exportar instância única
export const notificationService = new NotificationService();
