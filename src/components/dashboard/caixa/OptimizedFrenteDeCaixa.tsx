import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  Smartphone,
  Package,
  X,
  Plus,
  Minus,
  User,
  Receipt,
  Printer,
  ArrowLeft,
  ArrowRight,
  Tag,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { useCreateEnhancedSale } from '@/hooks/useAdvancedSales';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: number;
  name: string;
  code: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Product {
  id: number;
  name: string;
  code: string;
  barcode?: string;
  sale_price: number;
  stock_quantity: number;
  minimum_stock_level: number;
}

interface Client {
  id: number;
  name: string;
}

interface CurrentSale {
  id: number;
  items: CartItem[];
  client: Client | null;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  received: number;
  change: number;
  date: Date;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'dinheiro', name: 'Dinheiro', icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-500' },
  { id: 'pix', name: 'PIX', icon: <Smartphone className="w-5 h-5" />, color: 'bg-blue-500' },
  { id: 'cartao_credito', name: 'Cartão Crédito', icon: <CreditCard className="w-5 h-5" />, color: 'bg-purple-500' },
  { id: 'cartao_debito', name: 'Cartão Débito', icon: <CreditCard className="w-5 h-5" />, color: 'bg-orange-500' },
  { id: 'fiado', name: 'Fiado', icon: <User className="w-5 h-5" />, color: 'bg-gray-500' },
];

export function OptimizedFrenteDeCaixa() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('dinheiro');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentSale, setCurrentSale] = useState<CurrentSale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: products = [] } = useProducts();
  const { data: clients = [] } = useClients();
  const createSale = useCreateEnhancedSale();
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
    product.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.sale_price,
        quantity: 1,
        subtotal: product.sale_price
      }]);
    }
    
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Update quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map(item =>
        item.id === id
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      ));
    }
  };

  // Remove from cart
  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = 0; // TODO: Implement discount logic
  const total = subtotal - discount;
  const received = parseFloat(receivedAmount) || 0;
  const change = received - total;

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const saleData = {
        client_id: selectedClient,
        total_amount: total,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        split_payments: selectedPaymentMethod !== 'fiado' ? {
          payments: [{
            payment_method: selectedPaymentMethod,
            amount: total
          }]
        } : undefined,
        notes: selectedClient ? `Cliente: ${clients.find(c => c.id === selectedClient)?.name}` : undefined
      };

      const result = await createSale.mutateAsync(saleData);
      
      setCurrentSale({
        ...result,
        items: cart,
        client: selectedClient ? clients.find(c => c.id === selectedClient) : null,
        paymentMethod: selectedPaymentMethod,
        subtotal,
        discount,
        total,
        received,
        change,
        date: new Date()
      });

      setShowPayment(false);
      setShowReceipt(true);
      setCart([]);
      setSelectedClient(null);
      setReceivedAmount('');
      setSelectedPaymentMethod('dinheiro');
      
      toast({
        title: "Venda concluída",
        description: "Venda processada com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro na venda",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = (value: string) => {
    const product = products.find(p => p.code === value || p.barcode === value);
    if (product) {
      addToCart(product);
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Código ${value} não encontrado`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Side - Product Search */}
      <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-2xl font-bold text-white mb-2">Frente de Caixa</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar produto por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  handleBarcodeScan(searchQuery);
                }
              }}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-400 mt-2">Digite o nome ou código do produto</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-blue-400"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        <Badge 
                          variant={product.stock_quantity <= product.minimum_stock_level ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {product.stock_quantity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{product.code}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {format(product.sale_price, 'R$ ##,##0.00', { locale: ptBR })}
                        </span>
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Cart & Payment */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        {/* Cart Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho
            </h2>
            <Badge variant="outline" className="text-sm">
              {cart.length} itens
            </Badge>
          </div>

          {/* Client Selection */}
          <div className="flex gap-2">
            <label htmlFor="client-select" className="sr-only">Selecionar Cliente</label>
            <select
              id="client-select"
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(e.target.value ? parseInt(e.target.value) : null)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="">Cliente avulso</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Carrinho vazio</p>
              <p className="text-sm text-gray-400 mt-2">Adicione produtos para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.code}</p>
                        <p className="text-sm font-semibold text-green-600">
                          {format(item.price, 'R$ ##,##0.00', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-100 rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="font-semibold text-lg">
                        {format(item.subtotal, 'R$ ##,##0.00', { locale: ptBR })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{format(subtotal, 'R$ ##,##0.00', { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Desconto</span>
              <span>{format(discount, 'R$ ##,##0.00', { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-green-600">{format(total, 'R$ ##,##0.00', { locale: ptBR })}</span>
            </div>
          </div>

          {!showPayment ? (
            <Button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Finalizar Compra
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`h-16 flex flex-col gap-1 ${
                      selectedPaymentMethod === method.id ? method.color : ''
                    }`}
                  >
                    {method.icon}
                    <span className="text-xs">{method.name}</span>
                  </Button>
                ))}
              </div>

              {/* Amount Input for cash */}
              {selectedPaymentMethod === 'dinheiro' && (
                <div>
                  <label className="text-sm font-medium">Valor Recebido</label>
                  <Input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Change */}
              {selectedPaymentMethod === 'dinheiro' && received > total && (
                <div className="p-3 bg-green-50 rounded text-center">
                  <p className="text-sm text-green-600">Troco</p>
                  <p className="text-xl font-bold text-green-600">
                    {format(change, 'R$ ##,##0.00', { locale: ptBR })}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPayment(false)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={processSale}
                  disabled={isProcessing || (selectedPaymentMethod === 'dinheiro' && received < total)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? 'Processando...' : 'Finalizar'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
