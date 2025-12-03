import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react'

// Layout inspirado no SMB v4.0a com design moderno
export function SMBLayout() {
  const [activeModule, setActiveModule] = useState('vendas')
  const [searchTerm, setSearchTerm] = useState('')

  const modules = [
    {
      id: 'vendas',
      name: 'Vendas',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      description: 'PDV e gestão de vendas'
    },
    {
      id: 'produtos',
      name: 'Produtos', 
      icon: Package,
      color: 'bg-green-500',
      description: 'Cadastro e estoque'
    },
    {
      id: 'clientes',
      name: 'Clientes',
      icon: Users,
      color: 'bg-purple-500',
      description: 'Gestão de clientes'
    },
    {
      id: 'financeiro',
      name: 'Financeiro',
      icon: DollarSign,
      color: 'bg-orange-500',
      description: 'Contas a pagar/receber'
    },
    {
      id: 'relatorios',
      name: 'Relatórios',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      description: 'Análises e relatórios'
    }
  ]

  const stats = [
    { label: 'Vendas Hoje', value: 'R$ 2.450,00', change: '+12%', icon: ShoppingCart },
    { label: 'Produtos em Estoque', value: '1.248', change: '+5', icon: Package },
    { label: 'Clientes Ativos', value: '423', change: '+8', icon: Users },
    { label: 'Ticket Médio', value: 'R$ 45,80', change: '+3%', icon: TrendingUp }
  ]

  const recentSales = [
    { id: '001', client: 'João Silva', total: 'R$ 125,50', time: '14:32', status: 'concluida' },
    { id: '002', client: 'Maria Santos', total: 'R$ 89,90', time: '14:15', status: 'concluida' },
    { id: '003', client: 'Pedro Costa', total: 'R$ 234,00', time: '13:58', status: 'pendente' },
    { id: '004', client: 'Ana Oliveira', total: 'R$ 67,80', time: '13:45', status: 'concluida' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header SMB Style */}
      <header className="bg-smb-blue text-white border-b-4 border-smb-orange">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-smb-orange rounded-lg p-2">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ACR ERP</h1>
                <p className="text-sm opacity-90">Sistema de Gestão Comercial</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos, clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white text-gray-900"
                />
              </div>
              
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-smb-blue">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date().toLocaleDateString('pt-BR')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar SMB Style */}
          <div className="col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Módulos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {modules.map((module) => (
                  <Button
                    key={module.id}
                    variant={activeModule === module.id ? "default" : "ghost"}
                    className={`w-full justify-start ${activeModule === module.id ? 'bg-smb-blue' : ''}`}
                    onClick={() => setActiveModule(module.id)}
                  >
                    <module.icon className="h-4 w-4 mr-2" />
                    {module.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-green-600">{stat.change}</p>
                      </div>
                      <div className="bg-smb-blue/10 p-3 rounded-lg">
                        <stat.icon className="h-6 w-6 text-smb-blue" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Module Content */}
            {activeModule === 'vendas' && (
              <div className="grid grid-cols-3 gap-6">
                {/* PDV Quick Actions */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      PDV Rápido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-smb-blue hover:bg-smb-blue/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Venda
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Fechamento Caixa
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Consultar Cliente
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Vendas Recentes</span>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtrar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="bg-smb-blue/10 p-2 rounded">
                              <ShoppingCart className="h-4 w-4 text-smb-blue" />
                            </div>
                            <div>
                              <p className="font-medium">Venda #{sale.id}</p>
                              <p className="text-sm text-muted-foreground">{sale.client}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{sale.total}</p>
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
              </div>
            )}

            {activeModule === 'produtos' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Gestão de Produtos
                    </span>
                    <Button className="bg-smb-green hover:bg-smb-green/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Produto
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Módulo de produtos em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}

            {activeModule === 'clientes' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Gestão de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Módulo de clientes em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}

            {activeModule === 'financeiro' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Módulo financeiro em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}

            {activeModule === 'relatorios' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Relatórios e Análises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Módulo de relatórios em desenvolvimento...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
