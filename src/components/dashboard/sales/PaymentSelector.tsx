import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { usePaymentMethods, useCreateSalePayment } from '@/hooks/usePaymentMethods';
import { PaymentMethod, SalePayment } from '@/lib/paymentMethods';
import { 
  calculatePaymentFees, 
  calculateNetAmount, 
  supportsInstallments, 
  getAvailableInstallments,
  formatPaymentMethodDisplay 
} from '@/lib/paymentMethods';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Check, 
  Plus, 
  Minus,
  Percent,
  Calculator,
  Wallet
} from 'lucide-react';

interface PaymentSelectorProps {
  totalAmount: number;
  saleId?: string;
  onPaymentAdded?: (payment: SalePayment | {
    paymentMethod: PaymentMethod;
    amount: number;
    installments: number;
    fees: number;
    netAmount: number;
  }) => void;
  existingPayments?: Array<{
    payment_method?: { name: string };
    amount?: number;
    status?: string;
    installments?: number;
  }>;
  maxInstallments?: number;
}

export function PaymentSelector({ 
  totalAmount, 
  saleId, 
  onPaymentAdded,
  existingPayments = [],
  maxInstallments = 12
}: PaymentSelectorProps) {
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const createSalePayment = useCreateSalePayment();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<Array<{
    paymentMethod: PaymentMethod;
    amount: number;
    installments: number;
    fees: number;
    netAmount: number;
  }>>([]);
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [installments, setInstallments] = useState(1);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [cardLastDigits, setCardLastDigits] = useState('');
  const [cardBrand, setCardBrand] = useState('');

  // Calculate remaining amount to be paid
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + 
                   existingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingAmount = totalAmount - totalPaid;

  // Auto-select payment amount when method changes
  useEffect(() => {
    if (selectedPaymentMethod && remainingAmount > 0) {
      setPaymentAmount(remainingAmount.toFixed(2));
    }
  }, [selectedPaymentMethod, remainingAmount]);

  // Reset installments when payment method changes
  useEffect(() => {
    if (selectedPaymentMethod) {
      setInstallments(1);
      setShowCardDetails(selectedPaymentMethod.type === 'card');
    }
  }, [selectedPaymentMethod]);

  const handleAddPayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Erro',
        description: 'Selecione um método de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor válido.',
        variant: 'destructive',
      });
      return;
    }

    if (amount > remainingAmount) {
      toast({
        title: 'Erro',
        description: 'O valor não pode ser maior que o valor restante.',
        variant: 'destructive',
      });
      return;
    }

    // Validate card details if needed
    if (selectedPaymentMethod.type === 'card' && !cardLastDigits) {
      toast({
        title: 'Erro',
        description: 'Informe os últimos 4 dígitos do cartão.',
        variant: 'destructive',
      });
      return;
    }

    const fees = calculatePaymentFees(selectedPaymentMethod, amount);
    const netAmount = calculateNetAmount(selectedPaymentMethod, amount);

    const paymentData = {
      paymentMethod: selectedPaymentMethod,
      amount,
      installments,
      fees,
      netAmount,
    };

    if (saleId) {
      try {
        const salePayment = await createSalePayment.mutateAsync({
          sale_id: saleId,
          payment_method_id: selectedPaymentMethod.id,
          amount,
          installments,
          card_last_digits: cardLastDigits || undefined,
          card_brand: cardBrand || undefined,
        });
        
        onPaymentAdded?.(salePayment);
      } catch (error) {
        return;
      }
    } else {
      // Add to local payments list for preview
      setPayments(prev => [...prev, paymentData]);
      onPaymentAdded?.(paymentData);
    }

    // Reset form
    setSelectedPaymentMethod(null);
    setPaymentAmount('');
    setInstallments(1);
    setCardLastDigits('');
    setCardBrand('');
    setShowCardDetails(false);

    toast({
      title: 'Pagamento adicionado',
      description: `Pagamento de R$${amount.toFixed(2)} adicionado com sucesso.`,
    });
  };

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const getPaymentIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash': return DollarSign;
      case 'card': return CreditCard;
      case 'digital': return Smartphone;
      default: return Wallet;
    }
  };

  const getPaymentTypeLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'digital': return 'Digital';
      case 'check': return 'Cheque';
      case 'other': return 'Outro';
      default: return type;
    }
  };

  const availableInstallments = selectedPaymentMethod 
    ? getAvailableInstallments(selectedPaymentMethod, parseFloat(paymentAmount) || 0)
      .filter(i => i <= maxInstallments)
    : [1];

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
          <Wallet className="h-5 w-5 mr-2" />
          Métodos de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total da Venda:</span>
              <span className="ml-2 font-medium">R${totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Pago:</span>
              <span className="ml-2 font-medium text-green-600">R${totalPaid.toFixed(2)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Restante:</span>
              <span className={`ml-2 font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                R${Math.abs(remainingAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {remainingAmount > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Método de Pagamento</Label>
                <Select 
                  value={selectedPaymentMethod?.id || ''} 
                  onValueChange={(value) => {
                    const method = paymentMethods?.find(m => m.id === value);
                    setSelectedPaymentMethod(method || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((method) => {
                      const Icon = getPaymentIcon(method.type);
                      return (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{method.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {getPaymentTypeLabel(method.type)}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Installments for card payments */}
            {selectedPaymentMethod && supportsInstallments(selectedPaymentMethod) && (
              <div>
                <Label>Parcelas</Label>
                <Select 
                  value={installments.toString()} 
                  onValueChange={(value) => setInstallments(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstallments.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R${(parseFloat(paymentAmount || '0') / num).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Card Details */}
            {showCardDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Últimos 4 dígitos</Label>
                  <Input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={cardLastDigits}
                    onChange={(e) => setCardLastDigits(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div>
                  <Label>Bandeira (opcional)</Label>
                  <Select value={cardBrand} onValueChange={setCardBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="elo">Elo</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="hiper">Hiper</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Fee Preview */}
            {selectedPaymentMethod && (selectedPaymentMethod.fee_percentage > 0 || selectedPaymentMethod.fee_fixed_amount > 0) && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Taxas:</span>
                  <span>
                    {selectedPaymentMethod.fee_percentage > 0 && `${selectedPaymentMethod.fee_percentage}%`}
                    {selectedPaymentMethod.fee_percentage > 0 && selectedPaymentMethod.fee_fixed_amount > 0 && ' + '}
                    {selectedPaymentMethod.fee_fixed_amount > 0 && `R$${selectedPaymentMethod.fee_fixed_amount.toFixed(2)}`}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Valor líquido: R${calculateNetAmount(selectedPaymentMethod, parseFloat(paymentAmount || '0')).toFixed(2)}
                </div>
              </div>
            )}

            <Button 
              onClick={handleAddPayment}
              disabled={!selectedPaymentMethod || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pagamento
            </Button>
          </div>
        )}

        {/* Current Payments List */}
        {(payments.length > 0 || existingPayments.length > 0) && (
          <div className="space-y-2">
            <h4 className="font-medium">Pagamentos Adicionados:</h4>
            <div className="space-y-2">
              {/* Existing payments */}
              {existingPayments.map((payment, index) => (
                <div key={`existing-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.payment_method?.name || 'Pagamento'}</p>
                      <p className="text-sm text-gray-500">
                        {payment.installments > 1 && `${payment.installments}x `}
                        R${payment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {payment.status === 'approved' ? 'Aprovado' : 'Pendente'}
                  </Badge>
                </div>
              ))}

              {/* New payments */}
              {payments.map((payment, index) => {
                const Icon = getPaymentIcon(payment.paymentMethod.type);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.paymentMethod.name}</p>
                        <p className="text-sm text-gray-500">
                          {payment.installments > 1 && `${payment.installments}x `}
                          R${payment.amount.toFixed(2)}
                          {payment.fees > 0 && ` (Taxa: R${payment.fees.toFixed(2)})`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePayment(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Complete */}
        {remainingAmount <= 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Pagamento Completo</p>
                <p className="text-sm text-green-600">
                  Todos os pagamentos foram processados com sucesso.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
