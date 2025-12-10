import { useState } from 'react';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Vendas
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gerencie vendas e analise o desempenho
        </p>
      </div>

      {/* Dashboard - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vendas Hoje
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.totalToday || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vendas do Mês
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.totalMonth || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ticket Médio
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats?.avgTicket || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Conversão
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {stats?.conversion || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Vendas - Últimos 30 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                }
              />
              <Bar dataKey="vendas" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs PDV e Relatórios */}
      <Tabs defaultValue="pos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pos">Ponto de Venda</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductSearch onProductSelect={handleProductSelect} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Itens da Venda ({cart.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <CartView
                    cart={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientSearch onClientSelect={setSelectedClient} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <Payment
                    cart={cart}
                    onFinalizeSale={(pm) => saleMutation.mutate(pm)}
                    isLoading={saleMutation.isPending}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <SalesKanban />
        </TabsContent>

        <TabsContent value="reports">
          <SalesReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
