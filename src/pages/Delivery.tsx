import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DeliveryForm } from '@/components/delivery/DeliveryForm';
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Search,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function DeliveryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDeliveryman, setSelectedDeliveryman] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Queries
  const { data: kanbanData, isLoading: loadingKanban } = useQuery({
    queryKey: ['delivery-kanban'],
    queryFn: () => deliveryService.getKanbanDeliveries()
  });

  const { data: deliverymen } = useQuery({
    queryKey: ['deliverymen'],
    queryFn: () => deliveryService.getDeliveryMen('active')
  });

  const { data: performance } = useQuery({
    queryKey: ['delivery-performance'],
    queryFn: () => deliveryService.getDeliveryPerformanceToday()
  });

  const { data: statusStats } = useQuery({
    queryKey: ['delivery-status-stats'],
    queryFn: () => deliveryService.getDeliveriesByStatus()
  });

  // Calcular métricas do dashboard
  const totalToday = statusStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0;
  const inTransit = statusStats?.find(s => s.status === 'in_transit')?.count || 0;
  const delivered = statusStats?.find(s => s.status === 'delivered')?.count || 0;
  const activeDeliverymen = deliverymen?.length || 0;

  // Configuração de status
  const statusConfig = {
    pending: { label: 'Pendente', color: 'gray', icon: Clock },
    preparing: { label: 'Preparando', color: 'blue', icon: Package },
    ready: { label: 'Pronto', color: 'yellow', icon: AlertCircle },
    in_transit: { label: 'Em Rota', color: 'purple', icon: Truck },
    delivered: { label: 'Entregue', color: 'green', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'red', icon: AlertCircle }
  };

  // Agrupar deliveries por status
  const deliveriesByStatus = {
    pending: kanbanData?.filter((d: any) => d.status === 'pending') || [],
    preparing: kanbanData?.filter((d: any) => d.status === 'preparing') || [],
    ready: kanbanData?.filter((d: any) => d.status === 'ready') || [],
    in_transit: kanbanData?.filter((d: any) => d.status === 'in_transit') || [],
    delivered: kanbanData?.filter((d: any) => d.status === 'delivered') || []
  };

  // Filtrar deliveries
  const filterDeliveries = (deliveries: any[]) => {
    return deliveries.filter(delivery => {
      const matchesSearch = !searchTerm ||
        delivery.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.id?.toString().includes(searchTerm);

      const matchesDeliveryman = selectedDeliveryman === 'all' ||
        delivery.delivery_man_id?.toString() === selectedDeliveryman;

      return matchesSearch && matchesDeliveryman;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Delivery
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestão completa de entregas e entregadores
          </p>
        </div>
        <Button className="hover:scale-105 transition-transform" onClick={() => setIsFormOpen(true)}>
          <Truck className="w-4 h-4 mr-2" />
          Nova Entrega
        </Button>
      </div>

      {/* Dashboard - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Entregas Hoje
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {totalToday}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Em Rota
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {inTransit}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Entregues
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {delivered}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Entregadores Ativos
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {activeDeliverymen}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número, cliente ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={selectedDeliveryman}
              onChange={(e) => setSelectedDeliveryman(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos Entregadores</option>
              {deliverymen?.map((dm: any) => (
                <option key={dm.id} value={dm.id}>{dm.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban - 5 Colunas */}
      {loadingKanban ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-4">Carregando entregas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(deliveriesByStatus).map(([status, deliveries]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const filtered = filterDeliveries(deliveries as any[]);
            const Icon = config.icon;

            return (
              <Card key={status} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </CardTitle>
                    <Badge variant="secondary">{filtered.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {filtered.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma entrega</p>
                      <p className="text-xs">{config.label.toLowerCase()}</p>
                    </div>
                  ) : (
                    filtered.map((delivery: any) => (
                      <div
                        key={delivery.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500">
                            #{delivery.id}
                          </span>
                          <Badge className={`text-xs
                            ${status === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                            ${status === 'preparing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                            ${status === 'ready' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                            ${status === 'in_transit' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                            ${status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                          `}>
                            {config.label}
                          </Badge>
                        </div>

                        <p className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                          {delivery.customer_name || 'Cliente não informado'}
                        </p>

                        <div className="flex items-start gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{delivery.address}</span>
                        </div>

                        {delivery.delivery_man_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <User className="w-3 h-3" />
                            <span>{delivery.delivery_man_name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            R$ {delivery.total_amount?.toFixed(2) || '0.00'}
                          </span>
                          {delivery.estimated_time && (
                            <span className="text-xs text-gray-500">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {delivery.estimated_time}min
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Performance dos Entregadores */}
      {performance && performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance dos Entregadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Entregador
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Total
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Concluídas
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Ativas
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Tempo Médio
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Faturamento
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Comissão
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((perf: any) => (
                    <tr key={perf.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {perf.name}
                            </p>
                            <p className="text-xs text-gray-500">{perf.vehicle || 'Veículo não informado'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {perf.total_deliveries}
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {perf.completed_deliveries}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {perf.active_deliveries}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {perf.avg_delivery_time_minutes ? `${Math.round(perf.avg_delivery_time_minutes)}min` : '-'}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        R$ {perf.total_value?.toFixed(2) || '0.00'}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        R$ {((perf.total_commission_fixed || 0) + (perf.total_commission_percentage || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Nova Entrega */}
      <DeliveryForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
