import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ReceiptData, 
  ReceiptOptions, 
  receiptPrinter,
  defaultCompanyInfo 
} from '@/lib/receipt';
import { useReceiptPreview } from './receiptUtils';
import { Sale, SaleItem } from '@/lib/sales';
import { Client } from '@/lib/clients';
import { Discount } from '@/lib/discounts';
import { PaymentMethod } from '@/lib/paymentMethods';
import { SalePayment } from '@/lib/receipt';
import { 
  Printer, 
  Download, 
  Mail, 
  Copy,
  X,
  Building2,
  User,
  Calendar,
  CreditCard,
  Tag,
  Percent
} from 'lucide-react';

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
  options?: Partial<ReceiptOptions>;
  onPrint?: (options?: Partial<ReceiptOptions>) => void;
  onDownload?: () => void;
  onEmail?: (email: string) => void;
  onCopy?: () => void;
}

export function ReceiptPreview({
  isOpen,
  onClose,
  receiptData,
  options = {},
  onPrint,
  onDownload,
  onEmail,
  onCopy
}: ReceiptPreviewProps) {
  const [emailAddress, setEmailAddress] = React.useState(receiptData.client?.email || '');

  if (!isOpen) return null;

  const { sale, items, payments, client, discounts, paymentMethods } = receiptData;

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR');

  const handlePrint = () => {
    onPrint?.(options);
  };

  const handleDownload = () => {
    onDownload?.();
  };

  const handleEmail = () => {
    onEmail?.(emailAddress);
  };

  const handleCopy = () => {
    onCopy?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Visualização do Recibo</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Receipt Preview */}
          <div className="flex-1 p-6">
            <div className="bg-white border rounded-lg p-4 max-w-sm mx-auto">
              {/* Company Header */}
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg">{defaultCompanyInfo.name}</h3>
                {defaultCompanyInfo.document && (
                  <p className="text-sm text-gray-600">{defaultCompanyInfo.document}</p>
                )}
                {defaultCompanyInfo.address && (
                  <p className="text-sm text-gray-600">{defaultCompanyInfo.address}</p>
                )}
                {defaultCompanyInfo.phone && (
                  <p className="text-sm text-gray-600">{defaultCompanyInfo.phone}</p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Receipt Title */}
              <div className="text-center mb-4">
                <h4 className="font-bold">RECIBO DE VENDA</h4>
              </div>

              {/* Sale Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span>Venda:</span>
                  <span className="font-mono">#{sale.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>{formatDate(sale.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendedor:</span>
                  <span>{sale.seller?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                    {sale.status === 'completed' ? 'Concluída' : sale.status}
                  </Badge>
                </div>
              </div>

              {/* Client Info */}
              {client && (
                <>
                  <Separator className="my-4" />
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="font-semibold text-sm">DADOS DO CLIENTE</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>{client.name}</div>
                      {client.cpf_cnpj && <div>{client.cpf_cnpj}</div>}
                      {client.phone && <div>{client.phone}</div>}
                    </div>
                  </div>
                </>
              )}

              {/* Items */}
              <Separator className="my-4" />
              <div className="mb-4">
                <div className="font-semibold text-sm mb-2">ITENS</div>
                <div className="space-y-2 text-sm">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex-1">
                        <div>{item.product?.name || 'Produto'}</div>
                      </div>
                      <div className="text-right">
                        <div>{item.quantity}x {formatCurrency(item.price)}</div>
                        <div className="font-semibold">{formatCurrency(item.quantity * item.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts */}
              {discounts && discounts.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="h-4 w-4" />
                      <span className="font-semibold text-sm">DESCONTOS</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {discounts.map((discount, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{discount.name}</span>
                          <span className="text-red-600">
                            -{formatCurrency(discount.value || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Payments */}
              <Separator className="my-4" />
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-semibold text-sm">PAGAMENTOS</span>
                </div>
                <div className="space-y-1 text-sm">
                  {payments.map((payment, index) => {
                    const method = paymentMethods?.find(m => m.id === payment.payment_method_id);
                    return (
                      <div key={index} className="flex justify-between">
                        <span>{method?.name || 'Pagamento'}</span>
                        <span>{formatCurrency(payment.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(sale.total_amount)}</span>
                </div>
              </div>

              {/* Footer */}
              <Separator className="my-4" />
              <div className="text-center text-sm text-gray-600">
                <div>Obrigado pela preferência!</div>
                <div>Volte sempre!</div>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="w-80 border-l p-6 space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo da Venda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span>Venda:</span>
                  <span className="font-mono">#{sale.id.toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>{formatDate(sale.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={sale.status === 'concluida' ? 'default' : 'secondary'}>
                    {sale.status === 'concluida' ? 'Concluída' : sale.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(sale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Itens:</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pagamentos:</span>
                <span>{payments.length}</span>
              </div>
            </CardContent>
          </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handlePrint} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Recibo
              </Button>
              <Button onClick={handleDownload} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            {/* Email */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Button 
                  onClick={handleEmail} 
                  disabled={!emailAddress}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Opções de Impressão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Cabeçalho da empresa</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Dados do cliente</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Detalhes de pagamento</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Descontos aplicados</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Código de barras</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>QR Code</span>
                </label>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
