import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
  created_at: string;
  created_by: string;
  tenant_id: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InventoryBalance {
  id: string;
  product_id: string;
  location?: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  unit_cost?: number;
  total_value?: number;
  last_movement_date?: string;
  last_count_date?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    cost?: number;
  };
}

export interface InventoryCount {
  id: string;
  count_name: string;
  count_type: 'full' | 'partial' | 'cycle';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  total_products: number;
  counted_products: number;
  variance_amount: number;
  variance_percentage: number;
  notes?: string;
  created_at: string;
  created_by: string;
  tenant_id: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InventoryCountItem {
  id: string;
  count_id: string;
  product_id: string;
  location?: string;
  system_quantity: number;
  counted_quantity?: number;
  variance?: number;
  variance_value?: number;
  unit_cost?: number;
  counted_by?: string;
  counted_at?: string;
  notes?: string;
  created_at: string;
  tenant_id: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  counter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InventoryReport {
  id: string;
  report_name: string;
  report_type: 'balance' | 'movement' | 'valuation' | 'turnover' | 'variance' | 'aging';
  report_date: string;
  period_start?: string;
  period_end?: string;
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
  file_url?: string;
  file_format?: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  created_by: string;
  tenant_id: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InventoryTurnover {
  product_id: string;
  product_name: string;
  sku?: string;
  average_inventory: number;
  cost_of_goods_sold: number;
  turnover_ratio: number;
  days_supply?: number;
}

export interface CreateMovementData {
  product_id: string;
  movement_type: InventoryMovement['movement_type'];
  quantity: number;
  unit_cost?: number;
  reason?: string;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
}

export interface CreateCountData {
  count_name: string;
  count_type: InventoryCount['count_type'];
  scheduled_date?: string;
  notes?: string;
}

export function useInventoryMovements(productId?: string, location?: string, startDate?: string, endDate?: string) {
  const queryClient = useQueryClient();

  const {
    data: movements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-movements', productId, location, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          product:products(id, name, sku),
          creator:auth.users(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (location) {
        query = query.eq('location', location);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryMovement[];
    },
  });

  const createMovement = useMutation({
    mutationFn: async (movementData: CreateMovementData) => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          ...movementData,
          total_cost: movementData.quantity * (movementData.unit_cost || 0),
        })
        .select(`
          *,
          product:products(id, name, sku),
          creator:auth.users(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data as InventoryMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balance'] });
    },
  });

  return {
    movements,
    isLoading,
    error,
    createMovement: createMovement.mutateAsync,
    isCreating: createMovement.isPending,
  };
}

export function useInventoryBalance(productId?: string, location?: string) {
  const queryClient = useQueryClient();

  const {
    data: balance = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-balance', productId, location],
    queryFn: async () => {
      let query = supabase
        .from('inventory_balance')
        .select(`
          *,
          product:products(id, name, sku, cost)
        `)
        .order('quantity_available', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }
      if (location) {
        query = query.eq('location', location);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryBalance[];
    },
  });

  const updateBalance = useMutation({
    mutationFn: async ({ productId, location }: { productId: string; location?: string }) => {
      const { data, error } = await supabase.rpc('update_inventory_balance', {
        p_product_id: productId,
        p_location: location || 'Principal',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-balance'] });
    },
  });

  return {
    balance,
    isLoading,
    error,
    updateBalance: updateBalance.mutateAsync,
    isUpdating: updateBalance.isPending,
  };
}

export function useInventoryCounts() {
  const queryClient = useQueryClient();

  const {
    data: counts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_counts')
        .select(`
          *,
          creator:auth.users(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryCount[];
    },
  });

  const createCount = useMutation({
    mutationFn: async (countData: CreateCountData) => {
      const { data, error } = await supabase
        .from('inventory_counts')
        .insert(countData)
        .select(`
          *,
          creator:auth.users(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data as InventoryCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
    },
  });

  const updateCount = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<InventoryCount> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_counts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          creator:auth.users(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data as InventoryCount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
    },
  });

  return {
    counts,
    isLoading,
    error,
    createCount: createCount.mutateAsync,
    updateCount: updateCount.mutateAsync,
    isCreating: createCount.isPending,
    isUpdating: updateCount.isPending,
  };
}

export function useInventoryCountItems(countId: string) {
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-count-items', countId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_count_items')
        .select(`
          *,
          product:products(id, name, sku),
          counter:auth.users(id, name, email)
        `)
        .eq('count_id', countId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryCountItem[];
    },
    enabled: !!countId,
  });

  const updateItem = useMutation({
    mutationFn: async ({ 
      id, 
      counted_quantity, 
      notes 
    }: { 
      id: string; 
      counted_quantity?: number; 
      notes?: string; 
    }) => {
      const { data, error } = await supabase
        .from('inventory_count_items')
        .update({
          counted_quantity,
          notes,
          counted_at: counted_quantity ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select(`
          *,
          product:products(id, name, sku),
          counter:auth.users(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data as InventoryCountItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-count-items', countId] });
    },
  });

  return {
    items,
    isLoading,
    error,
    updateItem: updateItem.mutateAsync,
    isUpdating: updateItem.isPending,
  };
}

export function useInventoryReports() {
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_reports')
        .select(`
          *,
          creator:auth.users(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryReport[];
    },
  });

  const generateReport = useMutation({
    mutationFn: async ({
      reportType,
      reportName,
      periodStart,
      periodEnd,
      filters,
    }: {
      reportType: string;
      reportName: string;
      periodStart?: string;
      periodEnd?: string;
      filters?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.rpc('generate_inventory_report', {
        p_report_type: reportType,
        p_report_name: reportName,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_filters: filters || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-reports'] });
    },
  });

  return {
    reports,
    isLoading,
    error,
    generateReport: generateReport.mutateAsync,
    isGenerating: generateReport.isPending,
  };
}

export function useInventoryTurnover(startDate?: string, endDate?: string) {
  const {
    data: turnover = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-turnover', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('calculate_inventory_turnover', {
        p_period_start: startDate || new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        p_period_end: endDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      return data as InventoryTurnover[];
    },
  });

  return {
    turnover,
    isLoading,
    error,
  };
}

export function useInventorySummary() {
  const {
    data: summary = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const { data: balanceData, error: balanceError } = await supabase
        .from('inventory_balance')
        .select('*');

      if (balanceError) throw balanceError;

      const totalProducts = balanceData.length;
      const totalValue = balanceData.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const totalQuantity = balanceData.reduce((sum, item) => sum + item.quantity_on_hand, 0);
      const lowStockItems = balanceData.filter(item => item.quantity_available <= 5).length;
      const outOfStockItems = balanceData.filter(item => item.quantity_available === 0).length;

      return {
        totalProducts,
        totalValue,
        totalQuantity,
        lowStockItems,
        outOfStockItems,
        averageValue: totalProducts > 0 ? totalValue / totalProducts : 0,
      };
    },
  });

  return {
    summary,
    isLoading,
    error,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(quantity);
}

export function getMovementTypeText(type: string): string {
  const texts = {
    in: 'Entrada',
    out: 'Saída',
    adjustment: 'Ajuste',
    transfer: 'Transferência',
    return: 'Devolução',
  };
  
  return texts[type as keyof typeof texts] || type;
}

export function getMovementTypeColor(type: string): string {
  const colors = {
    in: 'text-green-600 bg-green-100',
    out: 'text-red-600 bg-red-100',
    adjustment: 'text-yellow-600 bg-yellow-100',
    transfer: 'text-blue-600 bg-blue-100',
    return: 'text-purple-600 bg-purple-100',
  };
  
  return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
}

export function getCountStatusText(status: string): string {
  const texts = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  
  return texts[status as keyof typeof texts] || status;
}

export function getCountStatusColor(status: string): string {
  const colors = {
    pending: 'text-yellow-600 bg-yellow-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
  };
  
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
}

export function getReportTypeText(type: string): string {
  const texts = {
    balance: 'Saldo de Estoque',
    movement: 'Movimentação',
    valuation: 'Avaliação',
    turnover: 'Giro',
    variance: 'Variação',
    aging: 'Envelhecimento',
  };
  
  return texts[type as keyof typeof texts] || type;
}
