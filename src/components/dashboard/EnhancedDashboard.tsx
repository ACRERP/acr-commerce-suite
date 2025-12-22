import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Package,
  AlertTriangle,
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { useLowStockAlerts } from '@/hooks/useLowStockAlerts';
import { Link } from 'react-router-dom';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

export function EnhancedDashboard() {
  const { data: sales = [] } = useSales();
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const lowStockData = useLowStockAlerts();
  const lowStockAlerts = lowStockData.alerts || [];
  
  const [todayMetrics, setTodayMetrics] = useState({
    salesCount: 0,
    revenue: 0,
    newClients: 0,
    averageTicket: 0
  });

  const [weeklyMetrics, setWeeklyMetrics] = useState({
    salesChange: 0,
    revenueChange: 0,
    clientChange: 0
  });

  // Calculate today's metrics
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = sales.filter(sale => 
      new Date(sale.created_at) >= today
    );
    
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const averageTicket = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;
    
    setTodayMetrics({
      salesCount: todaySales.length,
      revenue: todayRevenue,
      newClients: 0, // TODO: Implement client registration tracking
      averageTicket
    });
  }, [sales]);

  // Calculate weekly trends
  useEffect(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekSales = sales.filter(sale => 
      new Date(sale.created_at) >= weekAgo
    );
    const lastWeekSales = sales.filter(sale => 
      new Date(sale.created_at) >= twoWeeksAgo && new Date(sale.created_at) < weekAgo
    );
    
    const thisWeekRevenue = thisWeekSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const lastWeekRevenue = lastWeekSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    
    const salesChange = lastWeekSales.length > 0 
      ? ((thisWeekSales.length - lastWeekSales.length) / lastWeekSales.length) * 100 
      : 0;
    const revenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : 0;
    
    setWeeklyMetrics({
      salesChange,
      revenueChange,
      clientChange: 0 // TODO: Implement client growth tracking
    });
  }, [sales]);

  const metrics: MetricCard[] = [
    {
      title: 'Vendas Hoje',
      value: todayMetrics.salesCount.toString(),
      change: weeklyMetrics.salesChange,
      icon: <ShoppingCart className="w-5 h-5" />,
      trend: weeklyMetrics.salesChange >= 0 ? 'up' : 'down',
      color: 'text-blue-600'
    },
    {
      title: 'Faturamento Hoje',
      value: format(todayMetrics.revenue, 'R$ ##,##0.00', { locale: ptBR }),
      change: weeklyMetrics.revenueChange,
      icon: <DollarSign className="w-5 h-5" />,
      trend: weeklyMetrics.revenueChange >= 0 ? 'up' : 'down',
      color: 'text-green-600'
    },
    {
      title: 'Ticket Médio',
      value: format(todayMetrics.averageTicket, 'R$ ##,##0.00', { locale: ptBR }),
      change: 0, // TODO: Calculate average ticket change
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 'neutral',
      color: 'text-purple-600'
    },
    {
      title: 'Clientes',
      value: clients.length.toString(),
      change: weeklyMetrics.clientChange,
      icon: <Users className="w-5 h-5" />,
      trend: weeklyMetrics.clientChange >= 0 ? 'up' : 'down',
      color: 'text-orange-600'
    }
  ];

  const quickActions = [
    { title: 'Nova Venda', icon: <Plus className="w-4 h-4" />, href: '/pdv-market', color: 'bg-blue-500' },
    { title: 'Cadastrar Produto', icon: <Package className="w-4 h-4" />, href: '/produtos', color: 'bg-green-500' },
    { title: 'Novo Cliente', icon: <Users className="w-4 h-4" />, href: '/clientes', color: 'bg-purple-500' },
    { title: 'Ver Relatórios', icon: <Eye className="w-4 h-4" />, href: '/relatorios', color: 'bg-orange-500' },
  ];

  const recentSales = sales.slice(0, 5).map(sale => ({
    id: sale.id,
    client: sale.client?.name || 'Cliente Avulso',
    amount: format(sale.total_amount, 'R$ ##,##0.00', { locale: ptBR }),
    time: format(new Date(sale.created_at), 'HH:mm', { locale: ptBR }),
    status: sale.status,
    payment: sale.payment_method
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm text-gray-600">
            {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  {metric.change !== 0 && (
                    <div className="flex items-center mt-1">
                      {metric.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(metric.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Button className={`w-full h-20 flex flex-col gap-2 text-white ${action.color}`}>
                    {action.icon}
                    <span className="text-xs">{action.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Vendas Recentes
              <Link to="/vendas/historico">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Todas
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma venda hoje</p>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{sale.client}</p>
                      <p className="text-sm text-gray-600">{sale.time} • {sale.payment}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{sale.amount}</p>
                      <Badge 
                        variant={sale.status === 'concluida' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-200">
                  <div>
                    <p className="font-medium text-sm">{alert.name}</p>
                    <p className="text-xs text-gray-600">Estoque: {alert.current_stock}</p>
                  </div>
                  <Badge 
                    variant={alert.status === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.status === 'critical' ? 'Crítico' : 'Baixo'}
                  </Badge>
                </div>
              ))}
            </div>
            {lowStockAlerts.length > 6 && (
              <div className="mt-3 text-center">
                <Button variant="ghost" size="sm">
                  Ver todos os {lowStockAlerts.length} alertas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
