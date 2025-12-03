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
  ArrowDownRight
} from 'lucide-react'

// Dashboard com estatísticas no estilo ACR
export function ACRDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('hoje')

  const stats = [
    { 
      label: 'Vendas Hoje', 
      value: 'R$ 2.450,00', 
      change: '+12%', 
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-acr-blue'
    },
    { 
      label: 'Produtos em Estoque', 
      value: '1.248', 
      change: '+5', 
      trend: 'up',
      icon: Package,
      color: 'bg-acr-green'
    },
    { 
      label: 'Clientes Ativos', 
      value: '423', 
      change: '+8', 
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    { 
      label: 'Ticket Médio', 
      value: 'R$ 45,80', 
      change: '+3%', 
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-acr-orange'
    }
  ]

  const recentSales = [
    { id: '001', client: 'João Silva', total: 'R$ 125,50', time: '14:32', status: 'concluida', items: 3 },
    { id: '002', client: 'Maria Santos', total: 'R$ 89,90', time: '14:15', status: 'concluida', items: 2 },
    { id: '003', client: 'Pedro Costa', total: 'R$ 234,00', time: '13:58', status: 'pendente', items: 5 },
    { id: '004', client: 'Ana Oliveira', total: 'R$ 67,80', time: '13:45', status: 'concluida', items: 1 },
    { id: '005', client: 'Carlos Mendes', total: 'R$ 156,30', time: '13:30', status: 'concluida', items: 4 }
  ]

  const topProducts = [
    { name: 'Coca-Cola 2L', sales: 45, revenue: 'R$ 225,00' },
    { name: 'Pão Francês', sales: 120, revenue: 'R$ 120,00' },
    { name: 'Água Mineral 500ml', sales: 67, revenue: 'R$ 134,00' },
    { name: 'Salgado Frango', sales: 28, revenue: 'R$ 168,00' },
    { name: 'Refrigerante Lata', sales: 34, revenue: 'R$ 102,00' }
  ]

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
        {stats.map((stat, index) => (
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
        ))}
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
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </CardTitle>
            <CardDescription>
              Últimas transações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="bg-acr-blue/10 p-2 rounded">
                      <ShoppingCart className="h-4 w-4 text-acr-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Venda #{sale.id}</p>
                      <p className="text-sm text-muted-foreground">{sale.client} • {sale.items} itens</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{sale.total}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant={sale.status === 'concluida' ? 'default' : 'secondary'}>
                        {sale.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{sale.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} vendas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-900">{product.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <Button className="bg-acr-blue hover:bg-acr-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Cadastrar Produto
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
