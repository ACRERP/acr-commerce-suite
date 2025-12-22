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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useVariationColors, useVariationSizes, useCreateVariation, useUpdateVariation } from '@/hooks/useProductVariations';
import { ProductVariation, CreateVariationData, VariationAttributes } from '@/lib/productVariations';
import { generateVariationSKU, validateVariationAttributes, formatCurrency } from '@/lib/productVariations';
import { z } from 'zod';
import { Plus, Trash2, Calculator, TrendingUp, TrendingDown, DollarSign, Palette, Ruler } from 'lucide-react';

const variationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  sale_price: z.string().min(1, 'Preço de venda é obrigatório'),
  cost_price: z.string().min(0, 'Preço de custo deve ser positivo'),
  stock_quantity: z.string().min(0, 'Estoque deve ser positivo'),
  minimum_stock: z.string().min(0, 'Estoque mínimo deve ser positivo'),
  barcode: z.string().optional(),
  attributes: z.object({
    color: z.string().optional(),
    size: z.string().optional(),
    material: z.string().optional(),
    style: z.string().optional(),
    weight: z.string().optional(),
    dimensions: z.string().optional(),
  }),
});

type VariationFormData = z.infer<typeof variationSchema>;

interface ProductVariationsFormProps {
  productId: string;
  baseSKU: string;
  variation?: ProductVariation;
  onSubmit: (data: CreateVariationData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductVariationsForm({ 
  productId, 
  baseSKU, 
  variation, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ProductVariationsFormProps) {
  const { toast } = useToast();
  const { data: colors } = useVariationColors();
  const { data: sizes } = useVariationSizes();
  const createVariation = useCreateVariation();
  const updateVariation = useUpdateVariation();
  
  const [calculatedProfit, setCalculatedProfit] = useState<{
    margin: number;
    amount: number;
  }>({ margin: 0, amount: 0 });

  const form = useForm<VariationFormData>({
    resolver: zodResolver(variationSchema),
    defaultValues: {
      name: variation?.name || '',
      description: variation?.description || '',
      sale_price: variation?.sale_price?.toString() || '',
      cost_price: variation?.cost_price?.toString() || '0',
      stock_quantity: variation?.stock_quantity?.toString() || '0',
      minimum_stock: variation?.minimum_stock?.toString() || '5',
      barcode: variation?.barcode || '',
      attributes: variation?.attributes || {},
    },
  });

  const salePrice = parseFloat(form.watch('sale_price') || '0');
  const costPrice = parseFloat(form.watch('cost_price') || '0');
  const attributes = form.watch('attributes');

  // Auto-generate SKU based on attributes
  const generateSKU = () => {
    const generatedSKU = generateVariationSKU(baseSKU, attributes);
    form.setValue('name', generatedSKU);
  };

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

  const handleSubmit = (data: VariationFormData) => {
    // Validate attributes
    const attributeErrors = validateVariationAttributes(data.attributes);
    if (attributeErrors.length > 0) {
      toast({
        title: 'Erro de validação',
        description: attributeErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    // Validate that sale price is not lower than cost price
    if (parseFloat(data.sale_price) < parseFloat(data.cost_price)) {
      toast({
        title: 'Erro de validação',
        description: 'Preço de venda não pode ser menor que o preço de custo.',
        variant: 'destructive',
      });
      return;
    }

    const variationData: CreateVariationData = {
      product_id: productId,
      sku: data.name,
      name: data.name,
      description: data.description,
      sale_price: parseFloat(data.sale_price),
      cost_price: parseFloat(data.cost_price) || 0,
      stock_quantity: parseInt(data.stock_quantity),
      minimum_stock: parseInt(data.minimum_stock),
      barcode: data.barcode,
      attributes: data.attributes,
    };

    if (variation) {
      updateVariation.mutate({ ...variationData, id: variation.id });
    } else {
      createVariation.mutate(variationData);
    }
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
          {variation ? 'Editar Variação' : 'Nova Variação'}
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
                    <FormLabel>Nome/SKU da Variação *</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU da variação" {...field} />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da variação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variation Attributes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Atributos da Variação
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={generateSKU}>
                  Gerar SKU
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="attributes.color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colors?.map((color) => (
                            <SelectItem key={color.id} value={color.name}>
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 rounded mr-2" 
                                  style={{ backgroundColor: color.hex_code }}
                                  data-color={color.hex_code}
                                />
                                {color.name}
                              </div>
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
                  name="attributes.size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tamanho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sizes?.map((size) => (
                            <SelectItem key={size.id} value={size.name}>
                              {size.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="attributes.material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Algodão, Plástico, Metal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attributes.style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Casual, Esportivo, Formal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="attributes.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 500g, 1.2kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attributes.dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensões</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 20x30x10 cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

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

            <Separator />

            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Ruler className="h-5 w-5 mr-2" />
                Informações de Estoque
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="minimum_stock"
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
              </div>
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
              <Button type="submit" disabled={isLoading || createVariation.isPending || updateVariation.isPending}>
                {isLoading || createVariation.isPending || updateVariation.isPending 
                  ? 'Salvando...' 
                  : variation 
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
