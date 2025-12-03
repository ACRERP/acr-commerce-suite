import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { Product } from '@/lib/products';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/constants/productForm';
import { formSchema, ProductFormData } from '@/schemas/productSchema';


interface ProductFormProps {
  product?: Product | null;
  categories?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({ product, categories = [], brands = [], onSuccess, onCancel }: ProductFormProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  
  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      brand: '',
      code: '',
      stock_quantity: 0,
      minimum_stock_level: 0,
      images: [],
    },
  });


  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        images: [],
      });
      
      // Carregar previews de imagens existentes se houver
      if (product.image_url) {
        setPreviewImages([product.image_url]);
      }
    } else {
      form.reset({
        name: '',
        description: '',
        category: '',
        brand: '',
        code: '',
        stock_quantity: 0,
        minimum_stock_level: 0,
        images: [],
      });
      setPreviewImages([]);
    }
  }, [product, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    const newFiles: File[] = [];
    let hasError = false;

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Erro',
          description: `O arquivo ${file.name} excede o tamanho máximo de 5MB`,
          variant: 'destructive',
        });
        hasError = true;
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Erro',
          description: `O arquivo ${file.name} tem um formato não suportado. Use JPG, PNG ou WebP.`,
          variant: 'destructive',
        });
        hasError = true;
        return;
      }

      newImages.push(URL.createObjectURL(file));
      newFiles.push(file);
    });

    if (hasError) return;

    setPreviewImages((prev) => [...prev, ...newImages].slice(0, 5));
    form.setValue('images', [...(form.getValues('images') || []), ...newFiles].slice(0, 5));
  };

  const removeImage = (index: number) => {
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);

    const currentImages = form.getValues('images') || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    form.setValue('images', newImages);
  };

  const calculateProfitMargin = () => {
    // TODO: Implementar quando tiver campos de preço
    return '0.00';
  };

  const calculateProfitValue = () => {
    // TODO: Implementar quando tiver campos de preço
    return '0.00';
  };

  const handleSubmit = async (values: ProductFormData) => {
    try {
      // TODO: Handle image upload to storage
      const productData = {
        name: values.name,
        description: values.description || null,
        category: values.category || null,
        brand: values.brand || null,
        code: values.code,
        stock_quantity: values.stock_quantity,
        minimum_stock_level: values.minimum_stock_level,
        image_url: previewImages[0] || null, // Use first image for now
      };

      if (product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          ...productData,
        });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Informações Básicas</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: iPhone 15 Pro 128GB Azul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descrição detalhada do produto..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Código interno" 
                              {...field} 
                              value={field.value || ''}
                            />
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
                          <FormLabel>Categoria</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              value={field.value || ''}
                            >
                              <option value="">Selecione uma categoria</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
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
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                              value={field.value || ''}
                            >
                              <option value="">Selecione uma marca</option>
                              {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                  {brand.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Estoque</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Atual *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            title="Quantidade em estoque"
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
                        <FormLabel>Estoque Mínimo *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            title="Estoque mínimo para alerta"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Imagens do Produto</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`Remover imagem ${index + 1}`}
                          aria-label={`Remover imagem ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {previewImages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-24 w-full border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        <ImagePlus className="h-6 w-6 mb-1" />
                        <span className="text-xs">Adicionar Imagem</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    multiple
                    onChange={handleImageChange}
                    title="Selecionar imagens do produto"
                  />

                  <p className="text-xs text-muted-foreground">
                    Formatos suportados: JPG, PNG, WebP. Tamanho máximo: 5MB por imagem.
                    Máximo de 5 imagens.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
            title="Limpar formulário"
          >
            Limpar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </>
            ) : product ? (
              'Atualizar Produto'
            ) : (
              'Adicionar Produto'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
