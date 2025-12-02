import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço não pode ser negativo.' }),
  cost_price: z.coerce.number().min(0, { message: 'O preço de custo não pode ser negativo.' }),
  category: z.string().optional(),
  brand: z.string().optional(),
  code: z.string().optional(),
  stock_quantity: z.coerce.number().int().min(0, { message: 'O estoque não pode ser negativo.' }),
  minimum_stock_level: z.coerce.number().int().min(0, { message: 'O estoque mínimo não pode ser negativo.' }),
});

import { useEffect } from 'react';
import { Product } from './ProductList';

interface ProductFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  product?: Product | null;
}

export function ProductForm({ onSubmit, isLoading, product }: ProductFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
        defaultValues: {
      name: '',
      price: 0,
      cost_price: 0,
      category: '',
      brand: '',
      code: '',
      stock_quantity: 0,
      minimum_stock_level: 0,
    },
  });

  useEffect(() => {
    if (product) {
            form.reset({
        name: product.name,
        price: product.price,
        cost_price: product.cost_price,
        category: product.category || '',
        brand: product.brand || '',
        code: product.code || '',
        stock_quantity: product.stock_quantity,
        minimum_stock_level: product.minimum_stock_level,
      });
    }
  }, [product, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: iPhone 15 Pro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
                <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Venda</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="R$ 99,90" {...field} />
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
                  <Input type="number" placeholder="R$ 49,90" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estoque Atual</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
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
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Celulares" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código (SKU / EAN)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 1234567890123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : (product ? 'Salvar Alterações' : 'Salvar Produto')}
        </Button>
      </form>
    </Form>
  );
}
