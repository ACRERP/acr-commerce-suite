import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Save,
  X,
  Calculator,
  Percent,
  Tag,
  Monitor,
  Keyboard
} from 'lucide-react';
import { usePDV, CartItem } from '@/hooks/usePDV';
import { useProducts } from '@/hooks/useProducts';
import { useClientSearch } from '@/hooks/useClients';
import { Client } from '@/lib/clients';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export function PDVInterface() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [discount, setDiscount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('dinheiro');

  // Last added item for preview
  const [lastItem, setLastItem] = useState<CartItem | null>(null);

  const { cart, addToCart, removeFromCart, updateQuantity, checkout, isCheckingOut } = usePDV();
  const { data: products } = useProducts();
  const { data: clientSearchResults } = useClientSearch(clientSearchTerm);

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const paymentMethods: PaymentMethod[] = [
    { id: 'dinheiro', name: 'Dinheiro', icon: <DollarSign className="h-4 w-4" />, color: 'bg-green-600' },
    { id: 'cartao_credito', name: 'Crédito', icon: <CreditCard className="h-4 w-4" />, color: 'bg-blue-600' },
    { id: 'cartao_debito', name: 'Débito', icon: <CreditCard className="h-4 w-4" />, color: 'bg-purple-600' },
    { id: 'pix', name: 'PIX', icon: <Tag className="h-4 w-4" />, color: 'bg-cyan-600' },
  ];

  // Update totals
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const newTotal = newSubtotal - discount;
    setSubtotal(newSubtotal);
    setTotal(newTotal);

    // Update last item
    if (cart.length > 0) {
      setLastItem(cart[cart.length - 1]);
    } else {
      setLastItem(null);
    }
  }, [cart, discount]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'F2':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'F3':
          e.preventDefault();
          document.getElementById('client-search')?.focus();
          break;
        case 'F5':
          e.preventDefault();
          handleFinalizeSale();
          break;
        case 'F8':
          e.preventDefault();
          // Toggle payment logic could go here
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discount, selectedClient, selectedPayment]);

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;
    checkout({
      items: cart,
      clientId: selectedClient?.id,
      paymentMethod: selectedPayment,
      discount: discount
    });
    setDiscount(0);
    setSelectedClient(null);
    setClientSearchTerm('');
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code && product.code.includes(searchTerm))
  ) || [];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 bg-primary text-primary-foreground flex items-center justify-between px-4 shadow-md z-10">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <span className="font-bold text-lg">PDV - Caixa Livre</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span>Operador: Admin</span>
          <span>{new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 grid grid-cols-12 gap-0">

        {/* Left Panel: Search & Preview (60% width on large screens) */}
        <div className="col-span-12 lg:col-span-7 bg-muted/30 p-4 flex flex-col gap-4 border-r border-border">
          {/* Search Bar */}
          <Card className="border-sidebar-border shadow-sm">
            <CardContent className="p-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar produto (F2)..."
                  className="pl-10 h-12 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Preview / Last Item */}
          <div className="flex-1 grid grid-cols-1 gap-4">
            <Card className="flex flex-col justify-center items-center p-8 border-dashed border-2 shadow-none bg-background/50">
              {lastItem ? (
                <>
                  {/* Placeholder for Image */}
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mb-6">
                    <Package className="h-24 w-24 text-muted-foreground/50" />
                  </div>
                  <h2 className="text-3xl font-bold text-center mb-2">{lastItem.name}</h2>
                  <p className="text-muted-foreground text-xl mb-4">{lastItem.code || 'Sem código'}</p>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="text-center px-6 py-3 bg-muted rounded-lg">
                      <span className="text-xs uppercase text-muted-foreground font-semibold block">Quantidade</span>
                      <span className="text-2xl font-bold">{lastItem.quantity}</span>
                    </div>
                    <div className="text-center px-6 py-3 bg-primary/10 rounded-lg">
                      <span className="text-xs uppercase text-primary font-semibold block">Preço Unit.</span>
                      <span className="text-2xl font-bold text-primary">R$ {Number(lastItem.sale_price).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Monitor className="h-24 w-24 mx-auto mb-4 opacity-20" />
                  <h3 className="text-2xl font-medium">Caixa Livre</h3>
                  <p>Aguardando próximo item...</p>
                </div>
              )}
            </Card>

            {/* Product List Suggestions (Visible when searching) */}
            {searchTerm && (
              <div className="bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    className="w-full text-left p-3 hover:bg-muted flex justify-between items-center border-b last:border-0"
                    onClick={() => {
                      addToCart(product);
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                  >
                    <span>{product.name}</span>
                    <span className="font-bold">R$ {Number(product.sale_price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Cart & Payment (40% width) */}
        <div className="col-span-12 lg:col-span-5 bg-background p-4 flex flex-col h-[calc(100vh-3.5rem)]">
          {/* Client Selection */}
          <div className="mb-4 relative">
            <div className="flex gap-2">
              <Input
                id="client-search"
                placeholder="CPF/Cliente (F3)..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="h-10"
              />
              {selectedClient ? (
                <Button variant="ghost" size="icon" onClick={() => { setSelectedClient(null); setClientSearchTerm(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline"><User className="h-4 w-4" /></Button>
              )}
            </div>
            {/* Client Dropdown */}
            {clientSearchTerm.length > 0 && !selectedClient && clientSearchResults && (
              <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                {clientSearchResults.map(client => (
                  <div
                    key={client.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedClient(client);
                      setClientSearchTerm(client.name);
                    }}
                  >
                    {client.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto border rounded-md mb-4 bg-muted/10">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Carrinho vazio
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-center">Qtd</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium truncate max-w-[150px]">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{idx + 1}</div>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-muted rounded"><Minus className="h-3 w-3" /></button>
                          {item.quantity}
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-muted rounded"><Plus className="h-3 w-3" /></button>
                        </div>
                      </td>
                      <td className="p-2 text-right font-medium">R$ {item.total.toFixed(2)}</td>
                      <td className="p-2">
                        <button onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-3 w-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Totals Section */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Percent className="h-3 w-3" /> Desconto
              </span>
              <button className="text-blue-600 hover:underline" onClick={() => {
                const val = prompt('Desconto (R$):');
                if (val) setDiscount(Number(val));
              }}>
                {discount > 0 ? `- R$ ${discount.toFixed(2)}` : 'Adicionar'}
              </button>
            </div>

            <Separator />

            <div className="flex justify-between items-end">
              <span className="font-semibold text-lg">Total a Pagar</span>
              <span className="font-bold text-3xl text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${selectedPayment === method.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'hover:bg-muted border-transparent'
                  }`}
              >
                <div className={`p-1.5 rounded-full text-white mb-1 ${method.color}`}>
                  {method.icon}
                </div>
                <span className="text-[10px] font-medium">{method.name}</span>
              </button>
            ))}
          </div>

          {/* Main Action - Finalize */}
          <Button
            size="lg"
            className="mt-4 w-full h-14 text-lg font-bold shadow-lg bg-primary hover:bg-primary/90"
            onClick={handleFinalizeSale}
            disabled={cart.length === 0 || isCheckingOut}
          >
            {isCheckingOut ? 'PROCESSANDO...' : 'FINALIZAR VENDA (F5)'}
          </Button>
        </div>

      </div>

      {/* Footer / Status Bar - Fixed at bottom if needed, but current layout fills screen */}
      <footer className="h-8 bg-sidebar text-sidebar-foreground flex items-center px-4 text-xs gap-6 hidden lg:flex">
        <div className="flex items-center gap-2"><div className="bg-primary/20 px-1.5 rounded">F2</div> Buscar Produto</div>
        <div className="flex items-center gap-2"><div className="bg-primary/20 px-1.5 rounded">F3</div> Cliente</div>
        <div className="flex items-center gap-2"><div className="bg-primary/20 px-1.5 rounded">F5</div> Finalizar</div>
        <div className="flex items-center gap-2"><div className="bg-destructive/20 px-1.5 rounded">Esc</div> Cancelar Item</div>
      </footer>
    </div>
  );
}
