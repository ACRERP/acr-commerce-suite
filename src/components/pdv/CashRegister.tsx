import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Smartphone,
  Users,
  ShoppingCart,
  Calculator,
  FileText,
  Printer,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

// Interface de Frente de Caixa inspirada no SMB v4.0a
export function CashRegister() {
  const [isOpened, setIsOpened] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [currentBalance, setCurrentBalance] = useState(1250.50)

  // Resumo do caixa
  const cashSummary = {
    openingBalance: 500.00,
    totalSales: 2450.50,
    cashSales: 850.00,
    cardSales: 1200.00,
    debitSales: 400.00,
    pixSales: 0.50,
    creditSales: 0,
    withdrawals: 150.00,
    supplements: 100.00,
    expectedBalance: 2900.50,
    actualBalance: 2900.50,
    difference: 0.00
  }

  // Vendas recentes do caixa
  const recentSales = [
    { id: '001', time: '14:32', client: 'João Silva', total: 125.50, payment: 'Cartão Crédito', status: 'concluida' },
    { id: '002', time: '14:15', client: 'Maria Santos', total: 89.90, payment: 'Dinheiro', status: 'concluida' },
    { id: '003', time: '13:58', client: 'Pedro Costa', total: 234.00, payment: 'PIX', status: 'concluida' },
    { id: '004', time: '13:45', client: 'Ana Oliveira', total: 67.80, payment: 'Cartão Débito', status: 'concluida' },
    { id: '005', time: '13:30', client: 'Carlos Mendes', total: 156.30, payment: 'Fiado', status: 'pendente' }
  ]

  // Movimentações do caixa
  const movements = [
    { id: '001', time: '08:00', type: 'abertura', description: 'Abertura do caixa', amount: 500.00, user: 'Operador 01' },
    { id: '002', time: '10:30', type: 'suprimento', description: 'Suprimento de caixa', amount: 100.00, user: 'Gerente' },
    { id: '003', time: '12:15', type: 'sangria', description: 'Sangria para troco', amount: -50.00, user: 'Operador 01' },
    { id: '004', time: '14:20', type: 'sangria', description: 'Pagamento de fornecedor', amount: -100.00, user: 'Operador 01' }
  ]

  // Métodos de pagamento
  const paymentMethods = [
    { name: 'Dinheiro', amount: cashSummary.cashSales, icon: <DollarSign className="h-4 w-4" />, color: 'bg-green-500' },
    { name: 'Cartão Crédito', amount: cashSummary.cardSales, icon: <CreditCard className="h-4 w-4" />, color: 'bg-blue-500' },
    { name: 'Cartão Débito', amount: cashSummary.debitSales, icon: <CreditCard className="h-4 w-4" />, color: 'bg-purple-500' },
    { name: 'PIX', amount: cashSummary.pixSales, icon: <Smartphone className="h-4 w-4" />, color: 'bg-cyan-500' },
    { name: 'Fiado', amount: cashSummary.creditSales, icon: <Users className="h-4 w-4" />, color: 'bg-orange-500' }
  ]

  const openCashRegister = () => {
    setIsOpened(true)
    setCurrentBalance(openingBalance)
  }

  const closeCashRegister = () => {
    setIsOpened(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-acr-blue text-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calculator className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Frente de Caixa</h1>
                <p className="text-sm opacity-90">Gestão de Caixa ACR</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={`${
                isOpened ? 'bg-green-500' : 'bg-red-500'
              } text-white`}>
                {isOpened ? 'Caixa Aberto' : 'Caixa Fechado'}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Caixa 01
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {new Date().toLocaleDateString('pt-BR')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ações do Caixa */}
        <div className="bg-white border-l border-r border-b rounded-b-lg p-4 mb-4">
          {!isOpened ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-sm font-medium">Valor de Abertura:</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-32 ml-2"
                  />
                </div>
              </div>
              <Button 
                className="bg-acr-blue hover:bg-acr-blue/90"
                onClick={openCashRegister}
                disabled={openingBalance <= 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Saldo Atual: R$ {currentBalance.toFixed(2)}
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Vendas do Dia: R$ {cashSummary.totalSales.toFixed(2)}
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Sangria
                </Button>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Suprimento
                </Button>
                <Button 
                  variant="destructive"
                  onClick={closeCashRegister}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Coluna Esquerda - Resumo */}
          <div className="col-span-4 space-y-4">
            {/* Resumo Financeiro */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Saldo Inicial:</span>
                  <span className="font-medium">R$ {cashSummary.openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Vendas:</span>
                  <span className="font-medium text-green-600">+R$ {cashSummary.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Suprimentos:</span>
                  <span className="font-medium text-green-600">+R$ {cashSummary.supplements.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sangrias:</span>
                  <span className="font-medium text-red-600">-R$ {cashSummary.withdrawals.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Saldo Esperado:</span>
                  <span className="text-acr-blue">R$ {cashSummary.expectedBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Saldo Real:</span>
                  <span className="text-acr-blue">R$ {cashSummary.actualBalance.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold ${
                  cashSummary.difference >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span>Diferença:</span>
                  <span>{cashSummary.difference >= 0 ? '+' : ''}R$ {cashSummary.difference.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Formas de Pagamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`${method.color} text-white p-1 rounded`}>
                        {method.icon}
                      </div>
                      <span className="text-sm font-medium">{method.name}</span>
                    </div>
                    <span className="font-bold">R$ {method.amount.toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Central - Vendas */}
          <div className="col-span-5">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Vendas do Caixa
                  </span>
                  <Badge variant="outline">
                    {recentSales.length} vendas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="bg-acr-blue/10 p-2 rounded">
                          <ShoppingCart className="h-4 w-4 text-acr-blue" />
                        </div>
                        <div>
                          <p className="font-medium">Venda #{sale.id}</p>
                          <p className="text-sm text-muted-foreground">{sale.client}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {sale.total.toFixed(2)}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant={sale.status === 'concluida' ? 'default' : 'secondary'} className="text-xs">
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

          {/* Coluna Direita - Movimentações */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{movement.description}</p>
                        <p className="text-xs text-muted-foreground">{movement.user} • {movement.time}</p>
                      </div>
                      <div className={`font-bold ${
                        movement.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.amount >= 0 ? '+' : ''}R$ {Math.abs(movement.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações Inferiores */}
        <div className="mt-4 flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Resumo
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Relatório Detalhado
            </Button>
          </div>
          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            <AlertCircle className="h-4 w-4 mr-2" />
            Cancelar Operação
          </Button>
        </div>
      </div>
    </div>
  )
}
