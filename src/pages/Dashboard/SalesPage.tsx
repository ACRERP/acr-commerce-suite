import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { ProductSearch } from '@/components/dashboard/sales/ProductSearch';
import { CartView, CartItem } from '@/components/dashboard/sales/CartView';
import { ClientSearch } from '@/components/dashboard/sales/ClientSearch';
import { Payment, PaymentMethod } from '@/components/dashboard/sales/Payment';
import { SalesReports } from '@/components/dashboard/sales/SalesReports';
import { Product } from '@/lib/products';
import { Client } from '@/components/dashboard/clients/ClientList';
import { useAuth } from '@/contexts/AuthContext';

export function SalesPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      // 1. Inserir a venda
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

      // 2. Inserir os itens da venda
      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

      if (itemsError) throw itemsError;

      // 3. Atualizar o estoque (RPC call)
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
        queryClient.invalidateQueries({ queryKey: ['products'] }); // Para atualizar a contagem de estoque em outras telas
      },
      onError: (error: Error) => {
        toast({ title: 'Erro!', description: `Não foi possível finalizar a venda. ${error.message}`, variant: 'destructive' });
      },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendas</h1>
        <p className="text-gray-600">
          Gerencie vendas e analise o desempenho da equipe
        </p>
      </div>

      <Tabs defaultValue="pos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pos">Ponto de Venda</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid md:grid-cols-3 gap-4 h-full">
            {/* Coluna Esquerda e Central (ocupando 2/3) */}
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Produto</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductSearch onProductSelect={handleProductSelect} />
                </CardContent>
              </Card>

              <Card className="flex-grow">
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

            {/* Coluna Direita (ocupando 1/3) */}
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

        <TabsContent value="reports">
          <SalesReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
