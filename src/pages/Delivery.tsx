import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MainLayout } from '@/components/layout/MainLayout';
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
  AlertCircle,
  Map,
  Bike
} from 'lucide-react';
import { format } from 'date-fns';

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
    pending: { label: 'Pendente', color: 'gray', icon: Clock, bg: 'bg-neutral-100 dark:bg-neutral-800' },
    preparing: { label: 'Preparando', color: 'blue', icon: Package, bg: 'bg-primary-50 dark:bg-primary-900/10' },
    ready: { label: 'Pronto', color: 'yellow', icon: AlertCircle, bg: 'bg-warning-50 dark:bg-warning-900/10' },
    in_transit: { label: 'Em Rota', color: 'purple', icon: Truck, bg: 'bg-purple-50 dark:bg-purple-900/10' },
    delivered: { label: 'Entregue', color: 'green', icon: CheckCircle, bg: 'bg-success-50 dark:bg-success-900/10' },
    cancelled: { label: 'Cancelado', color: 'red', icon: AlertCircle, bg: 'bg-danger-50 dark:bg-danger-900/10' }
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
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Section Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Delivery & Entregas
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Bike className="w-5 h-5" />
              Gestão em tempo real de frota e entregas
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-secondary gap-2 hover-lift">
              <Map className="w-4 h-4" />
              Mapa ao Vivo
            </Button>
            <Button className="btn-primary hover-lift gap-2" onClick={() => setIsFormOpen(true)}>
              <Truck className="w-4 h-4" />
              Nova Entrega
            </Button>
          </div>
        </div>

        {/* Dashboard Stats Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Entregas Hoje</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{totalToday}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Em Rota</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{inTransit}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success-100 dark:bg-success-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Entregues</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{delivered}</p>
              </div>
              <div className="p-3 rounded-xl bg-success-100 dark:bg-success-900/30 text-success-600 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Entregadores Ativos</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{activeDeliverymen}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Premium */}
        <div className="card-premium p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por número, cliente ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[200px] h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDeliveryman} onValueChange={setSelectedDeliveryman}>
              <SelectTrigger className="w-full md:w-[250px] h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all">
                <SelectValue placeholder="Entregador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Entregadores</SelectItem>
                {deliverymen?.map((dm: any) => (
                  <SelectItem key={dm.id} value={dm.id.toString()}>{dm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board Premium */}
        {loadingKanban ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-neutral-500 mt-4">Carregando entregas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {Object.entries(deliveriesByStatus).map(([status, deliveries]) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              const filtered = filterDeliveries(deliveries as any[]);
              const Icon = config.icon;

              return (
                <div key={status} className="flex flex-col min-w-[280px]">
                  <div className={`p-3 rounded-t-xl border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between ${config.bg}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </div>
                    <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">{filtered.length}</Badge>
                  </div>

                  <div className="bg-neutral-50/50 dark:bg-neutral-900/30 rounded-b-xl border border-t-0 border-neutral-100 dark:border-neutral-800 p-2 min-h-[500px] flex flex-col gap-3">
                    {filtered.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 opacity-60">
                        <Icon className="w-8 h-8 mb-2" />
                        <span className="text-xs">Vazio</span>
                      </div>
                    ) : (
                      filtered.map((delivery: any) => (
                        <div
                          key={delivery.id}
                          className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-mono text-neutral-500">
                              #{delivery.id}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${status === 'pending' ? 'bg-neutral-400' :
                              status === 'preparing' ? 'bg-blue-500' :
                                status === 'ready' ? 'bg-amber-500' :
                                  status === 'in_transit' ? 'bg-purple-500' :
                                    status === 'delivered' ? 'bg-success-500' : 'bg-red-500'
                              }`} />
                          </div>

                          <p className="font-bold text-sm text-neutral-900 dark:text-white mb-1 line-clamp-1">
                            {delivery.customer_name || 'Cliente'}
                          </p>

                          <div className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{delivery.address}</span>
                          </div>

                          {delivery.delivery_man_name && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700/50 p-1.5 rounded-lg mb-2">
                              <Bike className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{delivery.delivery_man_name}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                            <span className="text-sm font-bold text-neutral-900 dark:text-white">
                              R$ {delivery.total_amount?.toFixed(2) || '0.00'}
                            </span>
                            {delivery.estimated_time && (
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-neutral-200 dark:border-neutral-700 text-neutral-500">
                                {delivery.estimated_time}min
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Performance Table Premium */}
        {performance && performance.length > 0 && (
          <div className="card-premium overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Performance dos Entregadores
              </h3>
              <Badge variant="outline" className="bg-white dark:bg-transparent">Hoje</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/20">
                    <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Entregador</th>
                    <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Total</th>
                    <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Concluídas</th>
                    <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Ativas</th>
                    <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Tempo Médio</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Faturamento</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {performance.map((perf: any) => (
                    <tr key={perf.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 font-bold shadow-sm">
                            {perf.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-neutral-900 dark:text-white">
                              {perf.name}
                            </p>
                            <p className="text-xs text-neutral-500 flex items-center gap-1">
                              <Bike className="w-3 h-3" />
                              {perf.vehicle || 'Moto'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6 font-medium text-neutral-900 dark:text-white">
                        {perf.total_deliveries}
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant="secondary" className="bg-success-100 text-success-700 border-0">
                          {perf.completed_deliveries}
                        </Badge>
                      </td>
                      <td className="text-center py-4 px-6">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                          {perf.active_deliveries}
                        </Badge>
                      </td>
                      <td className="text-center py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                        {perf.avg_delivery_time_minutes ? `${Math.round(perf.avg_delivery_time_minutes)}min` : '-'}
                      </td>
                      <td className="text-right py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                        R$ {perf.total_value?.toFixed(2) || '0.00'}
                      </td>
                      <td className="text-right py-4 px-6 text-sm font-bold text-success-600 dark:text-success-400">
                        R$ {((perf.total_commission_fixed || 0) + (perf.total_commission_percentage || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulário de Nova Entrega */}
        <DeliveryForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      </div>
    </MainLayout>
  );
}
