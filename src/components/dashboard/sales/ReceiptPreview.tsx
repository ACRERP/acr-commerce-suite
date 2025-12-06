import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReceiptData, generateReceiptText, printReceipt } from '@/lib/receipt';
import { 
  Printer, 
  Download, 
  Mail, 
  Copy,
  X,
  CreditCard
} from 'lucide-react';

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: (email: string) => void;
  onCopy?: () => void;
}

export function ReceiptPreview({
  isOpen,
  onClose,
  receiptData,
  onPrint,
  onDownload,
  onEmail,
  onCopy
}: ReceiptPreviewProps) {
  const [emailAddress, setEmailAddress] = React.useState('');

  if (!isOpen) return null;

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleString('pt-BR');

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      printReceipt(receiptData);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const text = generateReceiptText(receiptData);
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${receiptData.saleId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleEmail = () => {
    onEmail?.(emailAddress);
  };

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
    } else {
      const text = generateReceiptText(receiptData);
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
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
            <div className="bg-background border rounded-lg p-4 max-w-sm mx-auto">
              {/* Company Header */}
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg">{receiptData.companyName}</h3>
                {receiptData.companyAddress && (
                  <p className="text-sm text-muted-foreground">{receiptData.companyAddress}</p>
                )}
                {receiptData.companyPhone && (
                  <p className="text-sm text-muted-foreground">{receiptData.companyPhone}</p>
                )}
                {receiptData.companyCnpj && (
                  <p className="text-sm text-muted-foreground">{receiptData.companyCnpj}</p>
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
                  <span className="font-mono">#{receiptData.saleId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>{formatDate(receiptData.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operador:</span>
                  <span>{receiptData.operatorName}</span>
                </div>
                {receiptData.clientName && (
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>{receiptData.clientName}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <Separator className="my-4" />
              <div className="mb-4">
                <div className="font-semibold text-sm mb-2">ITENS</div>
                <div className="space-y-2 text-sm">
                  {receiptData.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div className="flex-1">
                        <div>{item.name}</div>
                      </div>
                      <div className="text-right">
                        <div>{item.quantity}x {formatCurrency(item.unitPrice)}</div>
                        <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <Separator className="my-4" />
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-semibold text-sm">PAGAMENTOS</span>
                </div>
                <div className="space-y-1 text-sm">
                  {receiptData.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{payment.method}</span>
                      <span>{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(receiptData.discount)}</span>
                  </div>
                )}
                {receiptData.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(receiptData.deliveryFee)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              {/* Footer */}
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground">
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
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Venda:</span>
                  <span className="font-mono">#{receiptData.saleId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>{formatDate(receiptData.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Itens:</span>
                  <span>{receiptData.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pagamentos:</span>
                  <span>{receiptData.payments.length}</span>
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
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
          </div>
        </div>
      </div>
    </div>
  );
}
