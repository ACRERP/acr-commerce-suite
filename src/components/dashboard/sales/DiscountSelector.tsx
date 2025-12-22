import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useApplicableDiscounts, useApplyDiscountToSale } from '@/hooks/useDiscounts';
import { Discount } from '@/lib/discounts';
import { formatDiscountDisplay, isDiscountApplicable, calculateDiscountAmount } from '@/lib/discounts';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Percent, 
  DollarSign, 
  Check, 
  X, 
  TrendingUp,
  Calendar,
  Target,
  AlertCircle
} from 'lucide-react';

interface DiscountSelectorProps {
  subtotal: number;
  saleId?: string;
  productIds?: string[];
  categoryIds?: string[];
  clientIds?: string[];
  onDiscountApplied?: (discount: Discount, amount: number) => void;
  onDiscountRemoved?: () => void;
  selectedDiscount?: Discount;
  selectedDiscountAmount?: number;
}

export function DiscountSelector({ 
  subtotal, 
  saleId, 
  productIds = [], 
  categoryIds = [], 
  clientIds = [],
  onDiscountApplied,
  onDiscountRemoved,
  selectedDiscount,
  selectedDiscountAmount = 0,
}: DiscountSelectorProps) {
  const { data: applicableDiscounts, isLoading } = useApplicableDiscounts(subtotal, productIds, categoryIds, clientIds);
  const applyDiscountToSale = useApplyDiscountToSale();
  const { toast } = useToast();
  
  const [customDiscountAmount, setCustomDiscountAmount] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleApplyDiscount = async (discount: Discount) => {
    if (!isDiscountApplicable(discount, subtotal)) {
      toast({
        title: 'Desconto não aplicável',
        description: 'Este desconto não pode ser aplicado ao valor atual.',
        variant: 'destructive',
      });
      return;
    }

    const discountAmount = calculateDiscountAmount(discount, subtotal);
    
    if (saleId) {
      try {
        await applyDiscountToSale.mutateAsync({
          saleId,
          discount,
          discountAmount,
        });
      } catch (error) {
        return;
      }
    }
    
    onDiscountApplied?.(discount, discountAmount);
    
    toast({
      title: 'Desconto aplicado',
      description: `Desconto de ${formatDiscountDisplay(discount)} aplicado com sucesso.`,
    });
  };

  const handleApplyCustomDiscount = () => {
    const amount = parseFloat(customDiscountAmount);
    if (isNaN(amount) || amount <= 0 || amount > subtotal) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor válido maior que zero e menor que o subtotal.',
        variant: 'destructive',
      });
      return;
    }

    const customDiscount: Discount = {
      id: 'custom',
      name: 'Desconto Manual',
      description: 'Desconto aplicado manualmente',
      type: 'fixed_amount',
      value: amount,
      applicable_to: 'all',
      is_active: true,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (saleId) {
      // For custom discounts, we'd need a different approach since they're not in the database
      // For now, just call the callback
    }
    
    onDiscountApplied?.(customDiscount, amount);
    
    toast({
      title: 'Desconto aplicado',
      description: `Desconto de R$${amount.toFixed(2)} aplicado com sucesso.`,
    });
    
    setCustomDiscountAmount('');
    setIsCustomMode(false);
  };

  const handleRemoveDiscount = () => {
    onDiscountRemoved?.();
    toast({
      title: 'Desconto removido',
      description: 'O desconto foi removido com sucesso.',
    });
  };

  const getTypeIcon = (type: string) => {
    return type === 'percentage' ? Percent : DollarSign;
  };

  const getBestDiscount = (discounts: Discount[], subtotal: number): { discount: Discount | null; amount: number } => {
    if (!discounts.length) return { discount: null, amount: 0 };
    
    let bestDiscount = discounts[0];
    let maxAmount = 0;
    
    discounts.forEach(discount => {
      const amount = calculateDiscountAmount(discount, subtotal);
      if (amount > maxAmount) {
        maxAmount = amount;
        bestDiscount = discount;
      }
    });
    
    return { discount: bestDiscount, amount: maxAmount };
  };

  const bestDiscount = applicableDiscounts ? getBestDiscount(applicableDiscounts, subtotal) : { discount: null, amount: 0 };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Descontos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Applied Discount */}
        {selectedDiscount && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">{selectedDiscount.name}</p>
                  <p className="text-sm text-green-600">
                    {formatDiscountDisplay(selectedDiscount)} = R${selectedDiscountAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveDiscount}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Best Discount Suggestion */}
        {!selectedDiscount && bestDiscount.discount && bestDiscount.amount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">Melhor desconto disponível</p>
                  <p className="text-sm text-blue-600">
                    {bestDiscount.discount.name}: {formatDiscountDisplay(bestDiscount.discount)} = R${bestDiscount.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleApplyDiscount(bestDiscount.discount!)}
                disabled={applyDiscountToSale.isPending}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* Available Discounts */}
        {!selectedDiscount && applicableDiscounts && applicableDiscounts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Descontos disponíveis:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {applicableDiscounts.map((discount) => {
                const discountAmount = calculateDiscountAmount(discount, subtotal);
                const TypeIcon = getTypeIcon(discount.type);
                
                return (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <TypeIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{discount.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-600 font-medium">
                            {formatDiscountDisplay(discount)}
                          </span>
                          <span className="text-sm text-gray-500">
                            = R${discountAmount.toFixed(2)}
                          </span>
                        </div>
                        {discount.min_purchase_amount > 0 && (
                          <p className="text-xs text-gray-500">
                            Mín: R${discount.min_purchase_amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplyDiscount(discount)}
                      disabled={applyDiscountToSale.isPending}
                    >
                      Aplicar
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Discount */}
        {!selectedDiscount && (
          <div className="space-y-2">
            {!isCustomMode ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCustomMode(true)}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Aplicar Desconto Manual
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={subtotal}
                    placeholder="Valor do desconto"
                    value={customDiscountAmount}
                    onChange={(e) => setCustomDiscountAmount(e.target.value)}
                  />
                  <Button
                    onClick={handleApplyCustomDiscount}
                    disabled={!customDiscountAmount || parseFloat(customDiscountAmount) <= 0}
                  >
                    Aplicar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCustomMode(false);
                      setCustomDiscountAmount('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Máximo: R${subtotal.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Discounts Available */}
        {!selectedDiscount && (!applicableDiscounts || applicableDiscounts.length === 0) && (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Nenhum desconto disponível para este valor.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tente aplicar um desconto manual.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="font-medium">R${subtotal.toFixed(2)}</span>
          </div>
          {selectedDiscount && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Desconto:</span>
              <span className="font-medium text-red-600">-R${selectedDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-bold pt-2 border-t">
            <span>Total:</span>
            <span>R${(subtotal - selectedDiscountAmount).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
