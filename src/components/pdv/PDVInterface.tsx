import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign,
  User,
  Package,
  Receipt,
  Printer,
  Save,
  X,
  Calculator,
  Percent,
  Tag
} from 'lucide-react'

// Interface PDV inspirada no SMB v4.0a
interface CartItem {
  id: string
  code: string
  name: string
  quantity: number
  price: number
  total: number
  unit: string
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

export function PDVInterface() {
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState('dinheiro')

  // Produtos simulados
  const products = [
    { id: '1', code: '001', name: 'Coca-Cola 2L', price: 8.50, stock: 45, unit: 'UN' },
    { id: '2', code: '002', name: 'Pão Francês', price: 1.00, stock: 120, unit: 'UN' },
    { id: '3', code: '003', name: 'Água Mineral 500ml', price: 2.00, stock: 67, unit: 'UN' },
    { id: '4', code: '004', name: 'Salgado Frango', price: 6.00, stock: 28, unit: 'UN' },
    { id: '5', code: '005', name: 'Refrigerante Lata', price: 3.00, stock: 34, unit: 'UN' },
    { id: '6', code: '006', name: 'Café', price: 1.50, stock: 89, unit: 'UN' },
    { id: '7', code: '007', name: 'Sanduche Natural', price: 12.00, stock: 15, unit: 'UN' },
    { id: '8', code: '008', name: 'Suco Natural 500ml', price: 7.00, stock: 23, unit: 'UN' }
  ]

  // Formas de pagamento
  const paymentMethods: PaymentMethod[] = [
    { id: 'dinheiro', name: 'Dinheiro', icon: <DollarSign className="h-4 w-4" />, color: 'bg-green-500' },
    { id: 'cartao_credito', name: 'Cartão Crédito', icon: <CreditCard className="h-4 w-4" />, color: 'bg-blue-500' },
    { id: 'cartao_debito', name: 'Cartão Débito', icon: <CreditCard className="h-4 w-4" />, color: 'bg-purple-500' },
    { id: 'pix', name: 'PIX', icon: <Tag className="h-4 w-4" />, color: 'bg-cyan-500' },
    { id: 'fiado', name: 'Fiado', icon: <User className="h-4 w-4" />, color: 'bg-orange-500' }
  ]

  // Calcular totais
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.total, 0)
    const newTotal = newSubtotal - discount
    setSubtotal(newSubtotal)
    setTotal(newTotal)
  }, [cart, discount])

  // Adicionar item ao carrinho
  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const newItem: CartItem = {
        id: product.id,
        code: product.code,
        name: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
        unit: product.unit
      }
      setCart([...cart, newItem])
    }
    setSearchTerm('')
  }

  // Atualizar quantidade
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(cart.map(item => 
      item.id === itemId 
        ? { ...item, quantity, total: item.price * quantity }
        : item
    ))
  }

  // Remover do carrinho
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  // Limpar carrinho
  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setSelectedClient(null)
  }

  // Finalizar venda
  const finalizeSale = () => {
    if (cart.length === 0) return

    // Simulação de finalização
    console.log('Venda finalizada:', {
      items: cart,
      client: selectedClient,
      subtotal,
      discount,
      total,
      payment: selectedPayment,
      date: new Date()
    })

    clearCart()
  }

  // Produtos filtrados
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(String(searchTerm).toLowerCase()) ||
    product.code.includes(String(searchTerm))
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header PDV */}
        <div className="bg-acr-blue text-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ShoppingCart className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">PDV - Ponto de Venda</h1>
                <p className="text-sm opacity-90">Sistema ACR Comercial</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                Operador: Caixa 01
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Coluna Esquerda - Produtos */}
          <div className="col-span-8">
            <Card className="rounded-none rounded-bl-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Produtos
                  </span>
                  <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar produto por código ou nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center space-y-1 hover:border-acr-blue hover:bg-acr-blue/5"
                      onClick={() => addToCart(product)}
                    >
                      <div className="text-xs font-bold text-acr-blue">{product.code}</div>
                      <div className="text-xs font-medium text-center">{product.name}</div>
                      <div className="text-sm font-bold">R$ {product.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">Estoque: {product.stock}</div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Teclado Numérico */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Teclado Rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 8, 9, '/', 4, 5, 6, '*', 1, 2, 3, '-', 'C', 0, '.', '+'].map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="h-12 text-lg font-bold"
                      onClick={() => {
                        if (key === 'C') {
                          setSearchTerm('')
                        } else if (['+', '-', '*', '/'].includes(key)) {
                          setSearchTerm(String(searchTerm) + String(key))
                        } else {
                          setSearchTerm(String(searchTerm) + String(key))
                        }
                      }}
                    >
                      {key}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="h-12 col-span-4 bg-acr-blue text-white hover:bg-acr-blue/90"
                    onClick={() => {
                      const product = products.find(p => p.code === searchTerm)
                      if (product) {
                        addToCart(product)
                      }
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar por Código
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Carrinho e Pagamento */}
          <div className="col-span-4 space-y-4">
            {/* Seleção de Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar cliente..."
                    className="text-sm"
                  />
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Carrinho */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Carrinho
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Carrinho vazio
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.code}</div>
                          <div className="text-sm font-bold">R$ {item.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-bold">R$ {item.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span className="font-medium">R$ {discount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-acr-blue">R$ {total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Formas de Pagamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <Button
                      key={method.id}
                      variant={selectedPayment === method.id ? "default" : "outline"}
                      className={`h-12 flex flex-col items-center justify-center space-y-1 ${
                        selectedPayment === method.id ? 'bg-acr-blue hover:bg-acr-blue/90' : ''
                      }`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <div className={`${method.color} text-white p-1 rounded`}>
                        {method.icon}
                      </div>
                      <span className="text-xs">{method.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12">
                <Receipt className="h-4 w-4 mr-2" />
                Orçamento
              </Button>
              <Button 
                className="h-12 bg-acr-blue hover:bg-acr-blue/90"
                onClick={finalizeSale}
                disabled={cart.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
