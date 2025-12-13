import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { ProductSearch } from '@/components/dashboard/sales/ProductSearch';
import { CartView, CartItem } from '@/components/dashboard/sales/CartView';
import { ClientSearch } from '@/components/dashboard/sales/ClientSearch';
import { Payment, PaymentMethod } from '@/components/dashboard/sales/Payment';
import { SalesReports } from '@/components/dashboard/sales/SalesReports';
import { SalesKanban } from '@/components/dashboard/sales/SalesKanban';
import { Product } from '@/lib/products';
import { Client } from '@/components/dashboard/clients/ClientList';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Package,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showChart, setShowChart] = useState(true);

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount, created_at, status');

      const total = sales?.length || 0;
      const salesToday = sales?.filter(s =>
        new Date(s.created_at) >= today
      ) || [];

      const totalToday = salesToday.reduce((sum, s) => sum + (s.total_amount || 0), 0);

      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const salesThisMonth = sales?.filter(s =>
        new Date(s.created_at) >= firstDayOfMonth
      ) || [];

      const totalMonth = salesThisMonth.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const avgTicket = total > 0 ? totalMonth / salesThisMonth.length : 0;

      return {
        totalToday,
        totalMonth,
        avgTicket,
        conversion: 75 // Placeholder
      };
    }
  });

  // Dados do gráfico (últimos 30 dias)
  const { data: chartData } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: async () => {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: sales } = await supabase
          .from('sales')
          .select('total_amount')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        const total = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

        data.push({
          date: format(date, 'dd/MM', { locale: ptBR }),
          vendas: total
        });
      }
      return data;
    }
  });

  const handleProductSelect = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleNewSale = () => {
    if (cart.length > 0) {
      if (!confirm("Tem certeza que deseja limpar a venda atual?")) return;
    }
    setCart([]);
    setSelectedClient(null);
    toast({ title: "Nova Venda", description: "O carrinho foi limpo e está pronto." });
  };

  const saleMutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (cart.length === 0 || !user) {
        throw new Error('Carrinho vazio ou usuário não autenticado.');
      }

      const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: selectedClient?.id,
          user_id: user.id,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: 'concluida',
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      for (const item of cart) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.id,
          p_quantity: item.quantity,
        });
        if (stockError) throw new Error(`Erro ao atualizar estoque do produto ${item.name}: ${stockError.message}`);
      }

      return saleData;
    },
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Venda finalizada com sucesso.' });
      setCart([]);
      setSelectedClient(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales-chart'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro!', description: `Não foi possível finalizar a venda. ${error.message}`, variant: 'destructive' });
    },
  });

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8 animate-fade-in-up">
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Vendas & PDV
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Gestão de vendas, PDV e indicadores
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowChart(!showChart)}>
              <TrendingUp className="w-4 h-4" />
              {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
            </Button>
            <Button
              onClick={handleNewSale}
              className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
            >
              <DollarSign className="w-4 h-4" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Vendas Hoje</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.totalToday || 0)}
                </h3>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Vendas Mês</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.totalMonth || 0)}
                </h3>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Ticket Médio</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.avgTicket || 0)}
                </h3>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform duration-500 group-hover:scale-110" />
            <div className="relative z-10">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Conversão</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {stats?.conversion || 0}%
                </h3>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Vendas Premium */}
        {showChart && (
          <div className="card-premium p-6 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Vendas - Últimos 30 Dias
              </h3>
              <Badge variant="outline" className="text-xs">Ultimos 30 dias</Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px -5px rgb(0 0 0 / 0.15)'
                  }}
                  cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                  formatter={(value: number) =>
                    [new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value), "Vendas"]
                  }
                />
                <Bar
                  dataKey="vendas"
                  fill="url(#colorVendas)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={50}
                >
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabs PDV e Relatórios */}
        <Tabs defaultValue="pos" className="space-y-6">
          <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-full md:w-auto inline-flex">
            <TabsTrigger value="pos" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-300">Ponto de Venda</TabsTrigger>
            <TabsTrigger value="kanban" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-300">Kanban</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm transition-all duration-300">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="mt-0">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="card-premium p-6">
                  <h3 className="section-title mb-4">Buscar Produto</h3>
                  <ProductSearch onProductSelect={handleProductSelect} />
                </div>

                <div className="card-premium p-6">
                  <h3 className="section-title mb-4">Itens da Venda ({cart.length})</h3>
                  <CartView
                    cart={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="card-premium p-6">
                  <h3 className="section-title mb-4">Cliente</h3>
                  <ClientSearch onClientSelect={setSelectedClient} />
                </div>

                <div className="card-premium p-6">
                  <h3 className="section-title mb-4">Pagamento</h3>
                  <Payment
                    cart={cart}
                    onFinalizeSale={(pm) => saleMutation.mutate(pm)}
                    isLoading={saleMutation.isPending}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <SalesKanban />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <SalesReports />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
