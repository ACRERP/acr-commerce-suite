
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  User,
  Package,
  X,
  Percent,
  Tag,
  Monitor,
  Zap,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { usePDV, CartItem } from '@/hooks/usePDV';
import { useProducts } from '@/hooks/useProducts';
import { useClientSearch } from '@/hooks/useClients';
import { Client } from '@/lib/clients';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility, or use a custom one 
import { useAuth } from '@/contexts/AuthContext';
import { SaleSuccessModal } from '@/components/pdv/SaleSuccessModal';
import { ReceiptData } from '@/lib/receipt';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/lib/config-service';
import { useOpenCashRegister } from '@/hooks/usePDV';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  textColor: string;
  borderColor: string;
}

export function PDVInterface() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [discount, setDiscount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('dinheiro');

  // "Premium" States
  const [lastItem, setLastItem] = useState<CartItem | null>(null);
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  const { cart, addToCart, removeFromCart, updateQuantity, checkout, isCheckingOut } = usePDV();
  const { data: products } = useProducts();
  const { data: clientSearchResults } = useClientSearch(clientSearchTerm);

  // NEW: Receipt & Config Logic
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<ReceiptData | null>(null);

  const { data: companyConfig } = useQuery({
    queryKey: ['config', 'company'],
    queryFn: () => getConfig('company')
  });

  const { data: cashRegister } = useOpenCashRegister();

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const paymentMethods: PaymentMethod[] = [
    { id: 'dinheiro', name: 'Dinheiro', icon: <DollarSign className="h-6 w-6" />, gradient: 'from-green-500 to-emerald-700', textColor: 'text-green-600', borderColor: 'border-green-200' },
    { id: 'pix', name: 'PIX', icon: <QrCode className="h-6 w-6" />, gradient: 'from-cyan-500 to-blue-700', textColor: 'text-cyan-600', borderColor: 'border-cyan-200' },
    { id: 'cartao_credito', name: 'Crédito', icon: <CreditCard className="h-6 w-6" />, gradient: 'from-purple-500 to-indigo-700', textColor: 'text-purple-600', borderColor: 'border-purple-200' },
    { id: 'cartao_debito', name: 'Débito', icon: <Wallet className="h-6 w-6" />, gradient: 'from-orange-500 to-red-700', textColor: 'text-orange-600', borderColor: 'border-orange-200' },
  ];

  // Update totals
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const newTotal = newSubtotal - discount;
    setSubtotal(newSubtotal);
    setTotal(newTotal);

    if (cart.length > 0) {
      const currentLast = cart[cart.length - 1];
      // Only animate if it's a new addition or change
      if (currentLast.id !== lastItem?.id || currentLast.quantity !== lastItem?.quantity) {
        setLastItem(currentLast);
        setJustAddedId(currentLast.id);
        setTimeout(() => setJustAddedId(null), 500); // Reset animation flag
      }
    } else {
      setLastItem(null);
    }
  }, [cart, discount]);

  // Keyboard Shortcuts - "Premium Logic" (Shortcuts stay standard but robust)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'F3') { e.preventDefault(); document.getElementById('client-search')?.focus(); }
      if (e.key === 'F5') { e.preventDefault(); handleFinalizeSale(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, discount, selectedClient, selectedPayment]);

  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    // Construct payment info locally for receipt (since checkout abstracts it)
    // Assuming simple payment (full amount)
    const currentTotal = subtotal - discount; // Simple calc, checkout handles deliveryFee inside usePDV if passed? 
    // Wait, usePDV checkout takes items, discount, deliveryFee? 
    // In original code: checkout({items, clientId, paymentMethod, discount}) 
    // It did NOT pass deliveryFee. So it assumed 0?
    // We should be careful. 

    checkout({
      items: cart,
      clientId: selectedClient?.id,
      paymentMethod: selectedPayment,
      discount: discount
    }, {
      onSuccess: (saleData) => {
        // Construct Receipt Data
        const receipt: ReceiptData = {
          saleId: saleData.id,
          companyName: companyConfig?.razao_social || 'ACR ERP',
          companyAddress: companyConfig?.endereco,
          companyCnpj: companyConfig?.cnpj,
          companyPhone: companyConfig?.telefone,
          footerMessage: companyConfig?.footer_message || 'Obrigado pela preferência!',
          operatorName: profile?.name || 'Operador',
          cashRegisterId: cashRegister?.id || 0,
          clientName: selectedClient?.name || 'Consumidor',
          items: cart.map(i => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            subtotal: i.subtotal
          })),
          subtotal: subtotal,
          discount: discount,
          deliveryFee: 0, // Not currently implemented in UI input
          total: saleData.total_amount, // Use server returned total
          payments: [{
            method: selectedPayment,
            amount: saleData.total_amount
          }],
          createdAt: new Date()
        };

        setLastSaleReceipt(receipt);
        setShowSuccessModal(true);

        // cleanup
        setDiscount(0);
        setSelectedClient(null);
        setClientSearchTerm('');
      }
    });
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code && product.code.includes(searchTerm)) ||
    (product.sku && product.sku.includes(searchTerm))
  ) || [];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900 font-sans selection:bg-primary/20">

      {/* 🚀 PREMIUM HEADER */}
      <header className="h-16 px-6 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg text-white shadow-lg shadow-primary-500/30">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-neutral-800 dark:text-neutral-100 font-tracking-tight">PDV <span className="text-primary-600">Enterprise</span></h1>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Caixa Aberto • {profile?.name || 'Operador'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          <div className="hidden md:flex gap-3">
            <Badge variant="outline" className="h-8 px-3 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Sistema Online
            </Badge>
            <div className="h-8 px-3 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center text-sm font-mono text-neutral-600">
              {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">

        {/* LEFT PANEL: PRODUCT EXPERIENCE (65%) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 p-6 flex flex-col gap-6 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white to-transparent dark:from-neutral-800 pointer-events-none" />

          {/* Search Bar (Floating) */}
          <div className="relative z-10 w-full max-w-3xl mx-auto transform transition-all hover:scale-[1.01]">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <Input
                ref={searchInputRef}
                placeholder="Bipe ou Digite o Produto (F2)"
                className="pl-14 h-16 text-xl rounded-2xl border-0 shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl focus:ring-4 focus:ring-primary-500/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="absolute inset-y-0 right-4 flex items-center">
                <Badge className="bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border-0">F2</Badge>
              </div>
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {searchTerm && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {filteredProducts.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => { addToCart(p); setSearchTerm(''); searchInputRef.current?.focus(); }}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-primary-50 dark:hover:bg-primary-900/20 group",
                        idx === 0 && "bg-neutral-50 dark:bg-neutral-700/30" // Highlight first
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-neutral-700 border flex items-center justify-center text-neutral-400 group-hover:border-primary-200 group-hover:text-primary-500">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-neutral-800 dark:text-neutral-100">{p.name}</div>
                        <div className="text-xs text-neutral-500 font-mono">{p.sku || p.code} • Estoque: {p.stock_quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary-600">R$ {Number(p.sale_price).toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* VISOR DO PRODUTO (Hero Section) */}
          <div className="flex-1 flex items-center justify-center relative z-0">
            {lastItem ? (
              <div className={cn(
                "w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-[2rem] shadow-xl p-8 border border-white/50 dark:border-neutral-700 relative overflow-hidden transition-all duration-300",
                justAddedId === lastItem.id ? "scale-[1.02] ring-2 ring-primary-500 ring-offset-4" : ""
              )}>
                {/* Background Gradient Blob */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                  {/* Product Image Placeholder */}
                  <div className="w-64 h-64 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center shadow-inner group">
                    <Package className="w-32 h-32 text-neutral-300 group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <Badge variant="outline" className="mb-2 border-primary-200 text-primary-700 bg-primary-50">
                        Último Item Adicionado
                      </Badge>
                      <h2 className="text-4xl md:text-5xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight leading-tight line-clamp-2">
                        {lastItem.name}
                      </h2>
                      <p className="text-lg text-neutral-500 font-mono mt-2">{lastItem.product_code || 'SKU # --'}</p>
                    </div>

                    <Separator className="my-6" />

                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Quantidade</span>
                        <div className="text-4xl font-mono font-bold text-neutral-800 dark:text-white flex items-center gap-3">
                          {lastItem.quantity}
                          <span className="text-sm font-sans font-medium text-neutral-400">un</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Preço Unitário</span>
                        <div className="text-4xl font-mono font-bold text-primary-600">
                          R$ {Number(lastItem.unit_price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {lastItem.stock_quantity && lastItem.stock_quantity < 10 && (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-fit mt-2 animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold">Estoque Baixo: {lastItem.stock_quantity} restantes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // EMPTY STATE
              <div className="text-center opacity-30 select-none">
                <ShoppingBag className="w-48 h-48 mx-auto text-neutral-400 mb-6" />
                <h2 className="text-4xl font-bold text-neutral-400">Caixa Livre</h2>
                <p className="text-xl text-neutral-400 mt-2">Aguardando próximo cliente...</p>
                <div className="mt-8 flex justify-center gap-2">
                  <Badge variant="outline" className="text-xs">F2 Buscar</Badge>
                  <Badge variant="outline" className="text-xs">F3 Cliente</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHECKOUT (35%) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 flex flex-col shadow-2xl z-30 h-[calc(100vh-4rem)]">

          {/* CLIENTE BAR */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-neutral-400" />
              </div>
              <Input
                id="client-search"
                className="pl-9 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 focus:ring-purple-500"
                placeholder="Identificar Cliente (F3)..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
              />
              {selectedClient && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-500" onClick={() => { setSelectedClient(null); setClientSearchTerm('') }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Client Results Popover */}
              {clientSearchTerm && !selectedClient && clientSearchResults && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white shadow-xl rounded-lg border z-50">
                  {clientSearchResults.map(c => (
                    <div key={c.id} onClick={() => { setSelectedClient(c); setClientSearchTerm(c.name); }} className="p-3 hover:bg-neutral-50 cursor-pointer text-sm font-medium border-b last:border-0">
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CART LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-50">
                <Monitor className="w-12 h-12 mb-2" />
                <p>Nenhum item adicionado</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-200">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate text-neutral-800 dark:text-neutral-200">{item.name}</div>
                    <div className="text-xs text-neutral-500">
                      {item.quantity} x R$ {item.unit_price.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                    R$ {item.total.toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* CHECKOUT AREA */}
          <div className="p-6 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-black border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">

            {/* Values Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-neutral-500">
                <span>Subtotal</span>
                <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <button className="text-blue-600 hover:underline flex items-center gap-1 font-medium text-xs uppercase tracking-wide" onClick={() => {
                  const val = prompt('Valor do desconto:');
                  if (val) setDiscount(parseFloat(val));
                }}>
                  <Percent className="w-3 h-3" /> Adicionar Desconto
                </button>
                <span className="text-red-500 font-mono font-medium">{discount > 0 ? `- R$ ${discount.toFixed(2)}` : 'R$ 0.00'}</span>
              </div>
              <Separator className="bg-neutral-200 dark:bg-neutral-700" />
              <div className="flex justify-between items-end">
                <span className="text-neutral-900 dark:text-white font-bold text-lg">Total a Pagar</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-3 flex flex-col items-center gap-2 transition-all duration-300",
                    selectedPayment === method.id
                      ? `bg-neutral-50 border-${method.borderColor} ring-2 ring-${method.textColor.split('-')[1]}-500 ring-offset-2`
                      : "bg-white border-neutral-100 hover:border-neutral-300 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
                    method.gradient
                  )}>
                    {method.icon}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-tight", method.textColor)}>
                    {method.name}
                  </span>
                  {selectedPayment === method.id && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className={cn("w-3 h-3", method.textColor)} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Hero Button */}
            <Button
              className="w-full h-16 text-xl font-black uppercase tracking-widest bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-black hover:to-neutral-900 text-white shadow-2xl shadow-neutral-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || isCheckingOut}
            >
              {isCheckingOut ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 animate-spin" /> Processando...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" /> Finalizar Venda (F5)
                </span>
              )}
            </Button>

          </div>
        </div>

      </div>

      <SaleSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        receiptData={lastSaleReceipt}
      />
    </div>
  );
}
