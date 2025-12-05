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
  receiptPrinter, 
  printSaleReceipt, 
  generateSaleReceiptText, 
  generateSaleReceiptHTML,
  ReceiptData,
  ReceiptOptions 
} from '@/lib/receipt';
import { Sale, SaleItem } from '@/lib/sales';
import { Client } from '@/lib/clients';
import { Discount } from '@/lib/discounts';
import { PaymentMethod } from '@/lib/paymentMethods';
import { SalePayment } from '@/lib/receipt';
import { 
  Printer, 
  FileText, 
  Download, 
  Mail, 
  MoreHorizontal,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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

  const receiptData: ReceiptData = {
    sale,
    items,
    payments,
    client,
    discounts,
    paymentMethods,
  };

  const handlePrint = async (options?: Partial<ReceiptOptions>) => {
    if (isPrinting) return;
    
    setIsPrinting(true);
    try {
      await printSaleReceipt(sale, items, payments, options);
      
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

  const handleDownloadHTML = () => {
    try {
      const html = generateSaleReceiptHTML(sale, items, payments);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-venda-${sale.id.toString().slice(-8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Recibo baixado',
        description: 'O recibo foi baixado como arquivo HTML.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: 'Não foi possível baixar o recibo.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadText = () => {
    try {
      const text = generateSaleReceiptText(sale, items, payments);
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

    try {
      // In a real implementation, this would call an email service
      await receiptPrinter.emailReceipt(receiptData, emailAddress);
      
      toast({
        title: 'Recibo enviado',
        description: `O recibo foi enviado para ${emailAddress}.`,
      });
      
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o recibo por email.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const text = generateSaleReceiptText(sale, items, payments);
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

  const handlePrintPreview = () => {
    try {
      const html = generateSaleReceiptHTML(sale, items, payments);
      const previewWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (previewWindow) {
        previewWindow.document.write(html);
        previewWindow.document.close();
      } else {
        throw new Error('Não foi possível abrir a janela de visualização');
      }
    } catch (error) {
      toast({
        title: 'Erro na visualização',
        description: 'Não foi possível abrir a visualização do recibo.',
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
          <DropdownMenuItem onClick={handlePrintPreview}>
            <FileText className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadHTML}>
            <Download className="h-4 w-4 mr-2" />
            Baixar HTML
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmail}
              disabled={!emailAddress}
              className="bg-blue-600 hover:bg-blue-700"
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

// Receipt action buttons group
export function ReceiptActions({ sale, items, payments, client, discounts, paymentMethods }: ReceiptButtonProps) {
  return (
    <div className="flex gap-2">
      <ReceiptButton
        sale={sale}
        items={items}
        payments={payments}
        client={client}
        discounts={discounts}
        paymentMethods={paymentMethods}
        showDropdown={false}
        variant="default"
      />
      <ReceiptButton
        sale={sale}
        items={items}
        payments={payments}
        client={client}
        discounts={discounts}
        paymentMethods={paymentMethods}
        size="sm"
      />
    </div>
  );
}
