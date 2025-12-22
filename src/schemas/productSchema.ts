import * as z from 'zod';

export const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  code: z.string().min(1, { message: 'O código é obrigatório' }),
  stock_quantity: z.coerce
    .number({ invalid_type_error: 'Informe um valor válido' })
    .int()
    .min(0, { message: 'O estoque não pode ser negativo.' }),
  minimum_stock_level: z.coerce
    .number({ invalid_type_error: 'Informe um valor válido' })
    .int()
    .min(0, { message: 'O estoque mínimo não pode ser negativo.' }),
  images: z
    .array(z.instanceof(File))
    .max(5, { message: 'Máximo de 5 imagens permitidas' })
    .optional(),
});

export type ProductFormData = z.infer<typeof formSchema>;
