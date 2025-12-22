import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getProductVariations,
  getVariationBySku,
  createVariation,
  updateVariation,
  deleteVariation,
  updateVariationStock,
  getVariationColors,
  getVariationSizes,
  ProductVariation,
  CreateVariationData,
  UpdateVariationData,
  VariationColor,
  VariationSize,
} from '@/lib/productVariations';

// Query keys
export const variationKeys = {
  all: ['variations'] as const,
  lists: () => [...variationKeys.all, 'list'] as const,
  list: (productId: string) => [...variationKeys.lists(), productId] as const,
  details: () => [...variationKeys.all, 'detail'] as const,
  detail: (sku: string) => [...variationKeys.details(), sku] as const,
  colors: ['variation-colors'] as const,
  sizes: ['variation-sizes'] as const,
};

// Get variations for a product
export function useProductVariations(productId: string) {
  return useQuery({
    queryKey: variationKeys.list(productId),
    queryFn: () => getProductVariations(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single variation by SKU
export function useVariation(sku: string) {
  return useQuery({
    queryKey: variationKeys.detail(sku),
    queryFn: () => getVariationBySku(sku),
    enabled: !!sku,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get variation colors
export function useVariationColors() {
  return useQuery({
    queryKey: variationKeys.colors,
    queryFn: getVariationColors,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Get variation sizes
export function useVariationSizes() {
  return useQuery({
    queryKey: variationKeys.sizes,
    queryFn: getVariationSizes,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Create variation mutation
export function useCreateVariation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateVariationData) => createVariation(data),
    onSuccess: (newVariation) => {
      queryClient.invalidateQueries({
        queryKey: variationKeys.list(newVariation.product_id),
      });
      toast({
        title: 'Variação criada',
        description: 'A variação do produto foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar variação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update variation mutation
export function useUpdateVariation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateVariationData) => updateVariation(data),
    onSuccess: (updatedVariation) => {
      // Invalidate product variations list
      queryClient.invalidateQueries({
        queryKey: variationKeys.list(updatedVariation.product_id),
      });
      
      // Invalidate specific variation cache
      queryClient.invalidateQueries({
        queryKey: variationKeys.detail(updatedVariation.sku),
      });
      
      toast({
        title: 'Variação atualizada',
        description: 'A variação do produto foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar variação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete variation mutation
export function useDeleteVariation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteVariation(id),
    onSuccess: (_, variationId) => {
      // Invalidate all variation lists since we don't have product_id
      queryClient.invalidateQueries({
        queryKey: variationKeys.lists(),
      });
      
      toast({
        title: 'Variação excluída',
        description: 'A variação do produto foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir variação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update variation stock mutation
export function useUpdateVariationStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateVariationStock(id, quantity),
    onSuccess: (updatedVariation) => {
      // Invalidate product variations list
      queryClient.invalidateQueries({
        queryKey: variationKeys.list(updatedVariation.product_id),
      });
      
      // Invalidate specific variation cache
      queryClient.invalidateQueries({
        queryKey: variationKeys.detail(updatedVariation.sku),
      });
      
      toast({
        title: 'Estoque atualizado',
        description: 'O estoque da variação foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar estoque',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Combined hook for product with variations
export function useProductWithVariations(productId: string) {
  const variations = useProductVariations(productId);
  
  const totalStock = variations.data?.reduce((sum, variation) => sum + variation.stock_quantity, 0) || 0;
  const activeVariations = variations.data?.filter(v => v.is_active).length || 0;
  const lowStockVariations = variations.data?.filter(v => v.stock_quantity <= v.minimum_stock).length || 0;
  const outOfStockVariations = variations.data?.filter(v => v.stock_quantity === 0).length || 0;
  
  const priceRange = variations.data && variations.data.length > 0 ? {
    min: Math.min(...variations.data.map(v => v.sale_price)),
    max: Math.max(...variations.data.map(v => v.sale_price)),
  } : null;
  
  return {
    ...variations,
    totalStock,
    activeVariations,
    lowStockVariations,
    outOfStockVariations,
    priceRange,
  };
}

// Hook for managing variation form state
export function useVariationForm(initialVariation?: ProductVariation) {
  const [formData, setFormData] = useState<CreateVariationData>({
    product_id: initialVariation?.product_id || '',
    sku: initialVariation?.sku || '',
    name: initialVariation?.name || '',
    description: initialVariation?.description || '',
    sale_price: initialVariation?.sale_price || 0,
    cost_price: initialVariation?.cost_price || 0,
    stock_quantity: initialVariation?.stock_quantity || 0,
    minimum_stock: initialVariation?.minimum_stock || 5,
    barcode: initialVariation?.barcode || '',
    image_url: initialVariation?.image_url || '',
    attributes: initialVariation?.attributes || {},
  });
  
  const updateField = (field: keyof CreateVariationData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const updateAttribute = (key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value,
      },
    }));
  };
  
  const removeAttribute = (key: string) => {
    setFormData(prev => {
      const newAttributes = { ...prev.attributes };
      delete newAttributes[key];
      return {
        ...prev,
        attributes: newAttributes,
      };
    });
  };
  
  const reset = () => {
    setFormData({
      product_id: '',
      sku: '',
      name: '',
      description: '',
      sale_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      minimum_stock: 5,
      barcode: '',
      image_url: '',
      attributes: {},
    });
  };
  
  return {
    formData,
    updateField,
    updateAttribute,
    removeAttribute,
    reset,
  };
}
