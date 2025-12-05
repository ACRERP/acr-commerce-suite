import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/products';
import { z } from 'zod';
import { formatCurrency } from '@/lib/format';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  sale_price: z.string().min(1, 'Preço de venda é obrigatório'),
  cost_price: z.string().min(0, 'Preço de custo deve ser positivo'),
  stock_quantity: z.string().min(0, 'Estoque deve ser positivo'),
  minimum_stock_level: z.string().min(0, 'Estoque mínimo deve ser positivo'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const { toast } = useToast();
  const [calculatedProfit, setCalculatedProfit] = useState<{
    margin: number;
    amount: number;
  }>({ margin: 0, amount: 0 });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      category: product?.category || '',
      sale_price: product?.sale_price?.toString() || '',
      cost_price: product?.cost_price?.toString() || '0',
      stock_quantity: product?.stock_quantity?.toString() || '0',
      minimum_stock_level: product?.minimum_stock_level?.toString() || '5',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      unit: product?.unit || 'UN',
    },
  });

  const salePrice = parseFloat(form.watch('sale_price') || '0');
  const costPrice = parseFloat(form.watch('cost_price') || '0');

  useEffect(() => {
    if (salePrice > 0 && costPrice >= 0) {
      const profitAmount = salePrice - costPrice;
      const profitMargin = costPrice > 0 ? (profitAmount / costPrice) * 100 : 0;
      
      setCalculatedProfit({
        margin: profitMargin,
        amount: profitAmount,
      });
    } else {
      setCalculatedProfit({ margin: 0, amount: 0 });
    }
  }, [salePrice, costPrice]);

  const handleSubmit = (data: ProductFormData) => {
    // Validate that sale price is not lower than cost price
    if (parseFloat(data.sale_price) < parseFloat(data.cost_price)) {
      toast({
        title: 'Erro de validação',
        description: 'Preço de venda não pode ser menor que o preço de custo.',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(data);
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 50) return 'text-green-600';
    if (margin >= 20) return 'text-yellow-600';
    if (margin > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProfitIcon = (margin: number) => {
    if (margin >= 20) return TrendingUp;
    if (margin > 0) return TrendingDown;
    return DollarSign;
  };

  const ProfitIcon = getProfitIcon(calculatedProfit.margin);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? 'Editar Produto' : 'Novo Produto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                        <SelectItem value="vestuario">Vestuário</SelectItem>
                        <SelectItem value="alimentos">Alimentos</SelectItem>
                        <SelectItem value="bebidas">Bebidas</SelectItem>
                        <SelectItem value="limpeza">Limpeza</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Informações de Preço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Venda *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Profit Calculation Display */}
              {(salePrice > 0 || costPrice > 0) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Cálculo de Lucro</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <ProfitIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm text-gray-600">Margem de Lucro:</span>
                      <Badge className={`ml-2 ${getProfitColor(calculatedProfit.margin)}`}>
                        {calculatedProfit.margin.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span className="text-sm text-gray-600">Valor do Lucro:</span>
                      <span className={`ml-2 font-medium ${getProfitColor(calculatedProfit.margin)}`}>
                        {formatCurrency(calculatedProfit.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações de Estoque</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimum_stock_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UN">Unidade</SelectItem>
                          <SelectItem value="KG">Quilograma</SelectItem>
                          <SelectItem value="L">Litro</SelectItem>
                          <SelectItem value="CX">Caixa</SelectItem>
                          <SelectItem value="DZ">Dúzia</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <Input placeholder="Código de barras" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : product ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
