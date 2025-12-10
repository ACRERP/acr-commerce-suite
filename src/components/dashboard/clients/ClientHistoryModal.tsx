import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Wrench,
  ShoppingCart,
  Truck,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface ClientHistoryModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientHistoryModal({ client, isOpen, onClose }: ClientHistoryModalProps) {
  if (!client) return null;

  // Queries para buscar dados
  const { data: osData, isLoading: loadingOS } = useQuery({
    queryKey: ['client-os', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!client
  });

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['client-sales', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!client
  });

  const { data: deliveriesData, isLoading: loadingDeliveries } = useQuery({
    queryKey: ['client-deliveries', client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!client
  });

  // Calcular estatísticas
  const stats = {
    totalOS: osData?.length || 0,
    totalSales: salesData?.length || 0,
    totalDeliveries: deliveriesData?.length || 0,
    totalSpent: (salesData || []).reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
    avgTicket: salesData?.length ?
      (salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) / salesData.length) : 0,
  };

  // Preparar dados para gráfico de consumo mensal
  const monthlyData = (() => {
    const months: Record<string, number> = {};

    (salesData || []).forEach(sale => {
      const month = format(new Date(sale.created_at), 'MMM/yy', { locale: ptBR });
      months[month] = (months[month] || 0) + (sale.total_amount || 0);
    });

    return Object.entries(months)
      .map(([month, total]) => ({ month, total }))
      .slice(-6); // Últimos 6 meses
  })();

  // Status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'delivered': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Histórico Completo - {client.name}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {client.email && `${client.email} • `}
            {client.phone}
          </p>
        </DialogHeader>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Total OS</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalOS}</p>
                </div>
                <Wrench className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Vendas</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalSales}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">Entregas</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalDeliveries}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">Total Gasto</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-pink-600 font-medium">Ticket Médio</p>
                  <p className="text-lg font-bold text-pink-700">
                    {formatCurrency(stats.avgTicket)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="os" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="os" className="gap-2">
              <Wrench className="w-4 h-4" />
              OS ({stats.totalOS})
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Vendas ({stats.totalSales})
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="gap-2">
              <Truck className="w-4 h-4" />
              Entregas ({stats.totalDeliveries})
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Gráfico
            </TabsTrigger>
          </TabsList>

          {/* Tab: OS */}
          <TabsContent value="os" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {loadingOS ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : osData && osData.length > 0 ? (
                <div className="space-y-3">
                  {osData.map((os: any) => (
                    <Card key={os.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono">
                                #{os.id}
                              </Badge>
                              <Badge className={getStatusColor(os.status)}>
                                {os.status}
                              </Badge>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">
                              {os.equipment_type} - {os.brand} {os.model}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              {os.reported_issue}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(os.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {os.total_amount && (
                                <span className="flex items-center gap-1 font-semibold text-green-600">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(os.total_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma OS encontrada</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab: Vendas */}
          <TabsContent value="sales" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {loadingSales ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : salesData && salesData.length > 0 ? (
                <div className="space-y-3">
                  {salesData.map((sale: any) => (
                    <Card key={sale.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono">
                                #{sale.id}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                Venda
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {sale.items?.length || 0} itens
                                </span>
                              </div>
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(sale.total_amount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma venda encontrada</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab: Entregas */}
          <TabsContent value="deliveries" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {loadingDeliveries ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : deliveriesData && deliveriesData.length > 0 ? (
                <div className="space-y-3">
                  {deliveriesData.map((delivery: any) => (
                    <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono">
                                #{delivery.id}
                              </Badge>
                              <Badge className={getStatusColor(delivery.status)}>
                                {delivery.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {delivery.delivery_address}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(delivery.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {delivery.delivery_fee && (
                                <span className="flex items-center gap-1 font-semibold text-purple-600">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(delivery.delivery_fee)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma entrega encontrada</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab: Gráfico */}
          <TabsContent value="chart" className="flex-1">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Consumo Mensal (Últimos 6 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelStyle={{ color: '#000' }}
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Sem dados suficientes para gerar gráfico</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
