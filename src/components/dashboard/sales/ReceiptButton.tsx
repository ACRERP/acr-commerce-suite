import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ReceiptData,
  generateReceiptText,
  printReceipt
} from '@/lib/receipt';
import { Sale, SaleItem } from '@/lib/sales';
import { Client } from '@/lib/clients';
import { Discount } from '@/lib/discounts';
import { PaymentMethod } from '@/lib/paymentMethods';
import { 
  Printer, 
  FileText, 
  Download, 
  Mail, 
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';

interface SalePayment {
  payment_method_id: string;
  amount: number;
}

interface ReceiptButtonProps {
  sale: Sale;
  items: SaleItem[];
  payments: SalePayment[];
  client?: Client;
  discounts?: Discount[];
  paymentMethods?: PaymentMethod[];
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showDropdown?: boolean;
}

function convertToReceiptData(sale: Sale, items: SaleItem[], payments: SalePayment[]): ReceiptData {
  return {
    saleId: typeof sale.id === 'string' ? parseInt(sale.id) : sale.id,
    companyName: 'ACR Store',
    operatorName: sale.seller?.name || 'Operador',
    cashRegisterId: 1,
    clientName: sale.client?.name,
    items: items.map(item => ({
      name: item.product?.name || 'Produto',
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.quantity * item.price
    })),
    subtotal: sale.subtotal || sale.total_amount,
    discount: sale.discount_amount || 0,
    deliveryFee: 0,
    total: sale.total_amount,
    payments: payments.map(p => ({
      method: p.payment_method_id,
      amount: p.amount
    })),
    createdAt: new Date(sale.created_at)
  };
}

export function ReceiptButton({
  sale,
  items,
  payments,
  client,
  discounts,
  paymentMethods,
  disabled = false,
  size = 'default',
  variant = 'outline',
  showDropdown = true
}: ReceiptButtonProps) {
  const { toast } = useToast();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [emailAddress, setEmailAddress] = React.useState('');

  const receiptData = convertToReceiptData(sale, items, payments);

  const handlePrint = async () => {
    if (isPrinting) return;
    
    setIsPrinting(true);
    try {
      printReceipt(receiptData);
      
      toast({
        title: 'Recibo impresso',
        description: 'O recibo foi enviado para a impressora com sucesso.',
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: 'Erro na impressão',
        description: 'Não foi possível imprimir o recibo. Verifique a impressora.',
        variant: 'destructive',
      });
    } finally {
      setIsPrinting(false);
      setIsPrintDialogOpen(false);
    }
  };

  const handleDownloadText = () => {
    try {
      const text = generateReceiptText(receiptData);
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-venda-${sale.id.toString().slice(-8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Recibo baixado',
        description: 'O recibo foi baixado como arquivo de texto.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível baixar o recibo.',
        variant: 'destructive',
      });
    }
  };

  const handleEmail = async () => {
    if (!emailAddress) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, informe um endereço de email.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'O envio por email será implementado em breve.',
    });
    
    setIsEmailDialogOpen(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      const text = generateReceiptText(receiptData);
      await navigator.clipboard.writeText(text);
      
      toast({
        title: 'Recibo copiado',
        description: 'O recibo foi copiado para a área de transferência.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o recibo.',
        variant: 'destructive',
      });
    }
  };

  if (!showDropdown) {
    return (
      <Button
        size={size}
        variant={variant}
        disabled={disabled || isPrinting}
        onClick={() => setIsPrintDialogOpen(true)}
      >
        <Printer className="h-4 w-4 mr-2" />
        {isPrinting ? 'Imprimindo...' : 'Imprimir Recibo'}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={size}
            variant={variant}
            disabled={disabled || isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            Recibo
            <MoreHorizontal className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsPrintDialogOpen(true)}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadText}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Texto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyToClipboard}>
            <FileText className="h-4 w-4 mr-2" />
            Copiar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar por Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Print Confirmation Dialog */}
      <AlertDialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Imprimir Recibo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deseja imprimir o recibo da venda #{sale.id.toString().slice(-8)}?
              <br />
              <br />
              <strong>Resumo da Venda:</strong>
              <br />
              • Total: R$ {sale.total_amount.toFixed(2)}
              <br />
              • Itens: {items.length}
              <br />
              • Pagamentos: {payments.length}
              {client && (
                <>
                  <br />
                  • Cliente: {client.name}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handlePrint()}
              disabled={isPrinting}
              className="bg-primary hover:bg-primary/90"
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Imprimindo...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Imprimir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Enviar Recibo por Email
            </AlertDialogTitle>
            <AlertDialogDescription>
              Digite o endereço de email para enviar o recibo da venda #{sale.id.toString().slice(-8)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="email" className="text-sm font-medium">
              Email do Destinatário
            </label>
            <input
              id="email"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="cliente@exemplo.com"
              className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmail}
              disabled={!emailAddress}
              className="bg-primary hover:bg-primary/90"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Quick print button for common use cases
export function QuickPrintButton({ sale, items, payments }: Pick<ReceiptButtonProps, 'sale' | 'items' | 'payments'>) {
  return (
    <ReceiptButton
      sale={sale}
      items={items}
      payments={payments}
      showDropdown={false}
      size="sm"
    />
  );
}
