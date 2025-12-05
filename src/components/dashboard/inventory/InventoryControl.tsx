import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Package, History, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useInventoryTransactions, useCreateInventoryTransaction, useAllInventoryTransactions } from '@/hooks/useInventory';
import { CreateInventoryTransactionData } from '@/lib/inventory';
import { z } from 'zod';
import { formatDateTime } from '@/lib/format';

const transactionSchema = z.object({
  product_id: z.number().min(1, 'Selecione um produto'),
  transaction_type: z.enum(['entry', 'exit'], {
    required_error: 'Selecione o tipo de movimentação',
  }),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  reason: z.string().min(1, 'Motivo é obrigatório'),
  reference_type: z.enum(['sale', 'purchase', 'adjustment', 'return']).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export function InventoryControl() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  
  const { data: products } = useProducts();
  const { data: allTransactions } = useAllInventoryTransactions();
  const createTransaction = useCreateInventoryTransaction();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      product_id: 0,
      transaction_type: 'entry',
      quantity: 1,
      reason: '',
      reference_type: 'adjustment',
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await createTransaction.mutateAsync(data as CreateInventoryTransactionData);
      form.reset();
      setShowForm(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const selectedProduct = products?.find(p => p.id === form.watch('product_id'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Estoque</h2>
          <p className="text-muted-foreground">Gerencie movimentações de entrada e saída de produtos</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - Estoque: {product.stock_quantity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transaction_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Movimentação *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entry">Entrada</SelectItem>
                            <SelectItem value="exit">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Quantidade"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Referência</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="purchase">Compra</SelectItem>
                            <SelectItem value="sale">Venda</SelectItem>
                            <SelectItem value="adjustment">Ajuste</SelectItem>
                            <SelectItem value="return">Devolução</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o motivo da movimentação..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProduct && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Informações do Produto</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Nome:</span> {selectedProduct.name}
                      </div>
                      <div>
                        <span className="font-medium">Código:</span> {selectedProduct.code}
                      </div>
                      <div>
                        <span className="font-medium">Estoque Atual:</span> {selectedProduct.stock_quantity}
                      </div>
                      <div>
                        <span className="font-medium">Estoque Mínimo:</span> {selectedProduct.minimum_stock_level}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTransaction.isPending}
                  >
                    {createTransaction.isPending ? 'Registrando...' : 'Registrar Movimentação'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions && allTransactions.length > 0 ? (
            <div className="space-y-3">
              {allTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'entry' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.transaction_type === 'entry' ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={transaction.transaction_type === 'entry' ? 'default' : 'secondary'}>
                      {transaction.transaction_type === 'entry' ? 'Entrada' : 'Saída'}
                    </Badge>
                    <p className="font-bold mt-1">
                      {transaction.transaction_type === 'entry' ? '+' : '-'}{transaction.quantity}
                    </p>
                    {transaction.reference_type && (
                      <p className="text-xs text-muted-foreground">
                        {transaction.reference_type}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma movimentação de estoque encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
