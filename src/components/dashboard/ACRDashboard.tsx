import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  DollarSign,
  Plus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStats, useTopProducts, useRecentSales } from '@/hooks/useDashboard'
import { formatCurrency, formatDateTime } from '@/lib/format'

// Dashboard com estatísticas no estilo ACR
export function ACRDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('hoje')
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats(selectedPeriod)
  const { data: topProducts, isLoading: productsLoading } = useTopProducts(selectedPeriod)
  const { data: recentSales, isLoading: salesLoading } = useRecentSales()

  // Handle loading and error states
  if (statsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados do dashboard</p>
          <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const statsCards = stats ? [
    { 
      label: 'Vendas', 
      value: formatCurrency(stats.totalSales), 
      change: stats.salesChange >= 0 ? `+${stats.salesChange.toFixed(1)}%` : `${stats.salesChange.toFixed(1)}%`, 
      trend: stats.salesChange >= 0 ? 'up' : 'down',
      icon: ShoppingCart,
      color: 'bg-acr-blue'
    },
    { 
      label: 'Produtos em Estoque', 
      value: stats.productsInStock.toString(), 
      change: `+${stats.lowStockCount}`, 
      trend: 'up',
      icon: Package,
      color: 'bg-acr-green'
    },
    { 
      label: 'Clientes Ativos', 
      value: stats.activeClients.toString(), 
      change: `+${stats.clientsChange}`, 
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    { 
      label: 'Ticket Médio', 
      value: formatCurrency(stats.averageTicket), 
      change: stats.ticketChange >= 0 ? `+${stats.ticketChange.toFixed(1)}%` : `${stats.ticketChange.toFixed(1)}%`, 
      trend: stats.ticketChange >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'bg-acr-orange'
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={selectedPeriod === 'hoje' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('hoje')}
            className="bg-acr-blue hover:bg-acr-blue/90"
          >
            Hoje
          </Button>
          <Button
            variant={selectedPeriod === 'semana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('semana')}
          >
            Semana
          </Button>
          <Button
            variant={selectedPeriod === 'mes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('mes')}
          >
            Mês
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-acr-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="bg-gray-200 bg-opacity-10 p-3 rounded-lg">
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-acr-orange">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`${stat.color} bg-opacity-10 p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-acr-blue" />
                Vendas Recentes
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/vendas/historico')}>
                Ver Todas
              </Button>
            </CardTitle>
            <CardDescription>
              Últimas transações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 p-2 rounded">
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales?.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="bg-acr-blue/10 p-2 rounded">
                        <ShoppingCart className="h-4 w-4 text-acr-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Venda #{sale.id}</p>
                        <p className="text-sm text-muted-foreground">{sale.client_name || 'Cliente não informado'} • {sale.items_count} itens</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={sale.status === 'concluida' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(sale.created_at, { timeOnly: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!recentSales || recentSales.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma venda encontrada</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-acr-green" />
              Produtos Mais Vendidos
            </CardTitle>
            <CardDescription>
              Top 5 produtos do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-2">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts?.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.totalSold} vendas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
                {(!topProducts || topProducts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum produto vendido</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Operações mais comuns do dia a dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              className="bg-acr-blue hover:bg-acr-blue/90"
              onClick={() => navigate('/pdv')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/produtos')}
            >
              <Package className="h-4 w-4 mr-2" />
              Cadastrar Produto
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/clientes')}
            >
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/caixa')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
