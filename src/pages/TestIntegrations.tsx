import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useSales, useCreateSale } from '@/hooks/useSales';

export function TestIntegrations() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Hooks para testar
  const { data: products, isLoading: loadingProducts, error: productsError } = useProducts();
  const { data: clients, isLoading: loadingClients, error: clientsError } = useClients();
  const { data: sales, isLoading: loadingSales, error: salesError } = useSales();
  
  const createProductMutation = useCreateProduct();
  const createClientMutation = useCreateClient();
  const createSaleMutation = useCreateSale();

  const testProductCreation = async () => {
    try {
      const productData = {
        name: 'Produto Teste ' + Date.now(),
        description: 'Descrição do produto teste',
        category: 'Teste',
        brand: 'Teste',
        code: 'TEST-' + Date.now(),
        stock_quantity: 10,
        minimum_stock_level: 5
      };
      
      await createProductMutation.mutateAsync(productData);
      toast({ title: 'Sucesso', description: 'Produto de teste criado!' });
    } catch (error) {
      console.error('Error creating test product:', error);
    }
  };

  const testClientCreation = async () => {
    try {
      const clientData = {
        name: 'Cliente Teste ' + Date.now(),
        phone: '11999999999',
        address: 'Endereço de teste',
        cpf_cnpj: '12345678901'
      };
      
      await createClientMutation.mutateAsync(clientData);
      toast({ title: 'Sucesso', description: 'Cliente de teste criado!' });
    } catch (error) {
      console.error('Error creating test client:', error);
    }
  };

  const testSaleCreation = async () => {
    try {
      if (!products || products.length === 0) {
        toast({ title: 'Erro', description: 'Crie um produto primeiro', variant: 'destructive' });
        return;
      }

      const saleData = {
        total_amount: 100.50,
        payment_method: 'dinheiro' as const,
        items: [
          {
            product_id: products[0].id,
            quantity: 2,
            price: 50.25
          }
        ]
      };
      
      await createSaleMutation.mutateAsync(saleData);
      toast({ title: 'Sucesso', description: 'Venda de teste criada!' });
    } catch (error) {
      console.error('Error creating test sale:', error);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    try {
      await testProductCreation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testClientCreation();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testSaleCreation();
      toast({ title: 'Testes Concluídos', description: 'Todos os testes executados com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro nos testes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Testar Integrações Supabase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <p>Carregando...</p>
            ) : productsError ? (
              <p className="text-red-500">Erro: {productsError.message}</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
                <p className="text-sm text-muted-foreground">produtos encontrados</p>
              </div>
            )}
            <Button 
              onClick={testProductCreation} 
              disabled={createProductMutation.isPending}
              className="mt-2 w-full"
            >
              Criar Produto Teste
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClients ? (
              <p>Carregando...</p>
            ) : clientsError ? (
              <p className="text-red-500">Erro: {clientsError.message}</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">{clients?.length || 0}</p>
                <p className="text-sm text-muted-foreground">clientes encontrados</p>
              </div>
            )}
            <Button 
              onClick={testClientCreation} 
              disabled={createClientMutation.isPending}
              className="mt-2 w-full"
            >
              Criar Cliente Teste
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSales ? (
              <p>Carregando...</p>
            ) : salesError ? (
              <p className="text-red-500">Erro: {salesError.message}</p>
            ) : (
              <div>
                <p className="text-2xl font-bold">{sales?.length || 0}</p>
                <p className="text-sm text-muted-foreground">vendas encontradas</p>
              </div>
            )}
            <Button 
              onClick={testSaleCreation} 
              disabled={createSaleMutation.isPending}
              className="mt-2 w-full"
            >
              Criar Venda Teste
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teste Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Executa todos os testes em sequência: Produto → Cliente → Venda
          </p>
          <Button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Executando Testes...' : 'Executar Todos os Testes'}
          </Button>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? 'Configurado' : 'Não configurado'}</p>
            <p><strong>Supabase Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
