import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign, 
  Smartphone,
  Receipt,
  Search,
  Package,
  User,
  Calculator,
  Printer,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: number;
  name: string;
  code: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'dinheiro', name: 'Dinheiro', icon: <DollarSign className="w-4 h-4" />, color: 'bg-green-500' },
  { id: 'pix', name: 'PIX', icon: <Smartphone className="w-4 h-4" />, color: 'bg-blue-500' },
  { id: 'cartao_credito', name: 'Cartão Crédito', icon: <CreditCard className="w-4 h-4" />, color: 'bg-purple-500' },
  { id: 'cartao_debito', name: 'Cartão Débito', icon: <CreditCard className="w-4 h-4" />, color: 'bg-orange-500' },
  { id: 'fiado', name: 'Fiado', icon: <User className="w-4 h-4" />, color: 'bg-gray-500' },
];

export function PDVMarket() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('dinheiro');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentSale, setCurrentSale] = useState<{
    items: CartItem[];
    client: Client | null;
    paymentMethod: string;
    subtotal: number;
    discount: number;
    total: number;
    received: number;
    change: number;
    date: Date;
  } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const { toast } = useToast();

  // Auto-focus search input
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.includes(searchQuery)
  );

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = 0; // TODO: Implement discount logic
  const total = subtotal - discount;

  // Calculate change
  const received = parseFloat(receivedAmount) || 0;
  const change = received - total;

  // Add product to cart
  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prevCart, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.sale_price,
        quantity: 1,
        subtotal: product.sale_price
      }];
    });
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Update cart item quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item =>
        item.id === id 
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setSelectedClient(null);
    setReceivedAmount('');
    setShowPayment(false);
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho para continuar",
        variant: "destructive"
      });
      return;
    }

    if (selectedPaymentMethod === 'fiado' && !selectedClient) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente para venda fiada",
        variant: "destructive"
      });
      return;
    }

    if (selectedPaymentMethod !== 'fiado' && received < total) {
      toast({
        title: "Valor insuficiente",
        description: "O valor recebido é menor que o total da compra",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Implement actual sale processing
      const saleData = {
        items: cart,
        client: selectedClient,
        paymentMethod: selectedPaymentMethod,
        subtotal,
        discount,
        total,
        received,
        change,
        date: new Date()
      };

      setCurrentSale(saleData);
      setShowReceipt(true);
      clearCart();
      
      toast({
        title: "Venda realizada",
        description: "Venda processada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro na venda",
        description: "Não foi possível processar a venda",
        variant: "destructive"
      });
    }
  };

  // Handle barcode scan (Enter key)
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
    }
  };

  return (
    <div className="h-screen bg-gray-50 p-4">
      <div className="h-full max-w-7xl mx-auto grid grid-cols-12 gap-4">
        
        {/* Left Panel - Product Search */}
        <div className="col-span-8 space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar produto por nome, código ou digitar código de barras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="text-lg"
                />
                <Button variant="outline" size="icon">
                  <Package className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos
                <Badge variant="secondary">{filteredProducts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:scale-105",
                        cart.some(item => item.id === product.id) && "ring-2 ring-blue-500"
                      )}
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.code}</p>
                        <div className="mt-2">
                          <p className="font-bold text-green-600">
                            {format(product.sale_price, 'R$ ##,##0.00', { locale: ptBR })}
                          </p>
                          <Badge 
                            variant={product.stock_quantity > 0 ? "default" : "destructive"}
                            className="text-xs mt-1"
                          >
                            Estoque: {product.stock_quantity}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Cart and Payment */}
        <div className="col-span-4 space-y-4">
          
          {/* Cart */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrinho
                  <Badge variant="secondary">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>
                </div>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                  <p>Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para continuar</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.code}</p>
                            <p className="font-semibold text-sm">
                              {format(item.price, 'R$ ##,##0.00', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Cart Summary */}
                  <div className="space-y-2 border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{format(subtotal, 'R$ ##,##0.00', { locale: ptBR })}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto:</span>
                        <span>-{format(discount, 'R$ ##,##0.00', { locale: ptBR })}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">
                        {format(total, 'R$ ##,##0.00', { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowPayment(true)}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Pagamento
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Amount */}
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total a pagar</p>
                <p className="text-2xl font-bold text-green-600">
                  {format(total, 'R$ ##,##0.00', { locale: ptBR })}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                    className={cn(
                      "h-16 flex flex-col gap-1",
                      selectedPaymentMethod === method.id && method.color
                    )}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    {method.icon}
                    <span className="text-xs">{method.name}</span>
                  </Button>
                ))}
              </div>

              {/* Amount Received */}
              {selectedPaymentMethod !== 'fiado' && (
                <div>
                  <label className="text-sm font-medium">Valor Recebido</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
              )}

              {/* Change */}
              {selectedPaymentMethod !== 'fiado' && received > total && (
                <div className="p-3 bg-green-50 rounded text-center">
                  <p className="text-sm text-green-600">Troco</p>
                  <p className="text-xl font-bold text-green-600">
                    {format(change, 'R$ ##,##0.00', { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Client Selection for Fiado */}
              {selectedPaymentMethod === 'fiado' && (
                <div>
                  <label htmlFor="client-select" className="text-sm font-medium">Cliente</label>
                  <select 
                    id="client-select"
                    className="w-full p-2 border rounded"
                    value={selectedClient?.id || ''}
                    onChange={(e) => setSelectedClient(clients.find(c => c.id === parseInt(e.target.value)))}
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPayment(false)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={processSale} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && currentSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <Receipt className="w-5 h-5" />
                Comprovante
                <Button variant="ghost" size="sm" onClick={() => setShowReceipt(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <h2 className="text-xl font-bold">ACR Commerce</h2>
                  <p className="text-sm text-gray-600">PDV Market</p>
                </div>
                
                <Separator />
                
                <div className="text-left space-y-2">
                  <p className="text-sm">
                    <strong>Data:</strong> {format(currentSale.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                  {currentSale.client && (
                    <p className="text-sm">
                      <strong>Cliente:</strong> {currentSale.client.name}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Pagamento:</strong> {PAYMENT_METHODS.find(m => m.id === currentSale.paymentMethod)?.name}
                  </p>
                </div>

                <Separator />

                <div className="text-left space-y-1">
                  {currentSale.items.map((item: CartItem, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{format(item.subtotal, 'R$ ##,##0.00', { locale: ptBR })}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="text-left space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{format(currentSale.total, 'R$ ##,##0.00', { locale: ptBR })}</span>
                  </div>
                  {currentSale.received > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Recebido:</span>
                        <span>{format(currentSale.received, 'R$ ##,##0.00', { locale: ptBR })}</span>
                      </div>
                      {currentSale.change > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Troco:</span>
                          <span>{format(currentSale.change, 'R$ ##,##0.00', { locale: ptBR })}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                <div className="text-center">
                  <p className="text-xs text-gray-600">Obrigado pela preferência!</p>
                  <p className="text-xs text-gray-600">Volte sempre</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button onClick={() => setShowReceipt(false)} className="flex-1">
                    OK
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
