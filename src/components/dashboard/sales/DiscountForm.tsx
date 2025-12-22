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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateDiscount, useUpdateDiscount } from '@/hooks/useDiscounts';
import { Discount, CreateDiscountData, validateDiscountData, formatDiscountDisplay } from '@/lib/discounts';
import { z } from 'zod';
import { Percent, DollarSign, Calendar, Target, Zap } from 'lucide-react';

const discountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.string().transform(Number).pipe(z.number().min(0.01, 'Valor deve ser maior que zero')),
  min_purchase_amount: z.string().transform(Number).pipe(z.number().min(0, 'Valor mínimo não pode ser negativo')),
  max_discount_amount: z.string().transform(Number).pipe(z.number().min(0, 'Valor máximo não pode ser negativo')).optional(),
  applicable_to: z.enum(['all', 'products', 'categories', 'clients']),
  is_active: z.boolean(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  usage_limit: z.string().transform(Number).pipe(z.number().min(1, 'Limite deve ser maior que zero')).optional(),
});

type DiscountFormData = z.infer<typeof discountSchema>;

interface DiscountFormProps {
  discount?: Discount;
  onSubmit: (data: CreateDiscountData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DiscountForm({ 
  discount, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: DiscountFormProps) {
  const { toast } = useToast();
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  
  const [previewAmount, setPreviewAmount] = useState(0);
  const [testSubtotal, setTestSubtotal] = useState(100);

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: discount?.name || '',
      description: discount?.description || '',
      type: discount?.type || 'percentage',
      value: discount?.value?.toString() || '',
      min_purchase_amount: discount?.min_purchase_amount?.toString() || '0',
      max_discount_amount: discount?.max_discount_amount?.toString() || '',
      applicable_to: discount?.applicable_to || 'all',
      is_active: discount?.is_active ?? true,
      start_date: discount?.start_date ? new Date(discount.start_date).toISOString().split('T')[0] : '',
      end_date: discount?.end_date ? new Date(discount.end_date).toISOString().split('T')[0] : '',
      usage_limit: discount?.usage_limit?.toString() || '',
    },
  });

  const discountType = form.watch('type');
  const discountValue = parseFloat(form.watch('value') || '0');
  const minPurchaseAmount = parseFloat(form.watch('min_purchase_amount') || '0');
  const maxDiscountAmount = parseFloat(form.watch('max_discount_amount') || '0');

  // Calculate preview amount
  useEffect(() => {
    if (discountValue > 0 && testSubtotal >= minPurchaseAmount) {
      let amount = discountType === 'percentage' 
        ? testSubtotal * (discountValue / 100)
        : Math.min(discountValue, testSubtotal);
      
      if (maxDiscountAmount > 0 && amount > maxDiscountAmount) {
        amount = maxDiscountAmount;
      }
      
      setPreviewAmount(amount);
    } else {
      setPreviewAmount(0);
    }
  }, [discountType, discountValue, minPurchaseAmount, maxDiscountAmount, testSubtotal]);

  const handleSubmit = (data: DiscountFormData) => {
    // Validate discount data
    const discountData: CreateDiscountData = {
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      min_purchase_amount: data.min_purchase_amount || undefined,
      max_discount_amount: data.max_discount_amount || undefined,
      applicable_to: data.applicable_to,
      is_active: data.is_active,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      usage_limit: data.usage_limit || undefined,
    };

    const errors = validateDiscountData(discountData);
    if (errors.length > 0) {
      toast({
        title: 'Erro de validação',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    if (discount) {
      updateDiscount.mutate({ ...discountData, id: discount.id });
    } else {
      createDiscount.mutate(discountData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {discount ? 'Editar Desconto' : 'Novo Desconto'}
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
                    <FormLabel>Nome do Desconto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do desconto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicable_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicável a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o escopo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos os produtos</SelectItem>
                        <SelectItem value="products">Produtos específicos</SelectItem>
                        <SelectItem value="categories">Categorias específicas</SelectItem>
                        <SelectItem value="clients">Clientes específicos</SelectItem>
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
                    <Textarea placeholder="Descrição do desconto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Configuração do Desconto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Desconto *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual (%)</SelectItem>
                          <SelectItem value="fixed_amount">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Valor do Desconto *
                        {discountType === 'percentage' && (
                          <span className="text-sm text-gray-500 ml-2">
                            (0-100%)
                          </span>
                        )}
                        {discountType === 'fixed_amount' && (
                          <span className="text-sm text-gray-500 ml-2">
                            (em R$)
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={discountType === 'percentage' ? '0.01' : '0.01'}
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                          placeholder={discountType === 'percentage' ? '10.00' : '5.00'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_purchase_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mínimo de Compra</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
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
                  name="max_discount_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Máximo de Desconto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Sem limite"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Date Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Vigência
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Usage Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Configurações de Uso
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="usage_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Usos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Sem limite"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Desconto Ativo</FormLabel>
                        <p className="text-sm text-gray-500">
                          Desconto disponível para uso
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preview */}
            {discountValue > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Prévia do Desconto</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Valor de teste:</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={testSubtotal}
                      onChange={(e) => setTestSubtotal(parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">R$</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">{form.watch('name') || 'Nome do Desconto'}</p>
                      <p className="text-sm text-gray-500">
                        {formatDiscountDisplay({
                          type: discountType,
                          value: discountValue,
                        } as Discount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Desconto:</p>
                      <p className="font-bold text-green-600">
                        R${previewAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {testSubtotal < minPurchaseAmount && (
                    <p className="text-sm text-orange-600">
                      Valor mínimo de compra não atingido (R${minPurchaseAmount.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>
            )}

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
              <Button type="submit" disabled={isLoading || createDiscount.isPending || updateDiscount.isPending}>
                {isLoading || createDiscount.isPending || updateDiscount.isPending 
                  ? 'Salvando...' 
                  : discount 
                    ? 'Atualizar' 
                    : 'Cadastrar'
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
