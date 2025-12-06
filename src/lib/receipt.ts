import { formatCurrency } from './pdv';

export interface ReceiptData {
  saleId: number;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyCnpj?: string;
  operatorName: string;
  cashRegisterId: number;
  clientName?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  payments: {
    method: string;
    amount: number;
    change?: number;
  }[];
  createdAt: Date;
}

// Format receipt as text (for thermal printers)
export function generateReceiptText(data: ReceiptData): string {
  const separator = '-'.repeat(40);
  const lines: string[] = [];

  // Header
  lines.push(data.companyName.toUpperCase().padStart(20 + data.companyName.length / 2));
  if (data.companyAddress) lines.push(data.companyAddress);
  if (data.companyPhone) lines.push(`Tel: ${data.companyPhone}`);
  if (data.companyCnpj) lines.push(`CNPJ: ${data.companyCnpj}`);
  lines.push(separator);

  // Sale info
  lines.push(`CUPOM NÃO FISCAL`);
  lines.push(`Venda #${data.saleId}`);
  lines.push(`Data: ${data.createdAt.toLocaleDateString('pt-BR')} ${data.createdAt.toLocaleTimeString('pt-BR')}`);
  lines.push(`Operador: ${data.operatorName}`);
  lines.push(`Caixa: #${data.cashRegisterId}`);
  if (data.clientName && data.clientName !== 'Consumidor') {
    lines.push(`Cliente: ${data.clientName}`);
  }
  lines.push(separator);

  // Items
  lines.push('ITENS');
  data.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name}`);
    lines.push(`   ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}`);
  });
  lines.push(separator);

  // Totals
  lines.push(`Subtotal:        ${formatCurrency(data.subtotal).padStart(12)}`);
  if (data.discount > 0) {
    lines.push(`Desconto:       -${formatCurrency(data.discount).padStart(11)}`);
  }
  if (data.deliveryFee > 0) {
    lines.push(`Taxa Entrega:    ${formatCurrency(data.deliveryFee).padStart(12)}`);
  }
  lines.push(separator);
  lines.push(`TOTAL:           ${formatCurrency(data.total).padStart(12)}`);
  lines.push(separator);

  // Payments
  lines.push('PAGAMENTO');
  data.payments.forEach(p => {
    lines.push(`${p.method}: ${formatCurrency(p.amount)}`);
    if (p.change && p.change > 0) {
      lines.push(`Troco: ${formatCurrency(p.change)}`);
    }
  });
  lines.push(separator);

  // Footer
  lines.push('');
  lines.push('Obrigado pela preferência!');
  lines.push('Volte sempre!');
  lines.push('');

  return lines.join('\n');
}

// Format receipt for WhatsApp
export function generateReceiptWhatsApp(data: ReceiptData): string {
  const lines: string[] = [];

  lines.push(`📋 *CUPOM DE VENDA #${data.saleId}*`);
  lines.push(`📅 ${data.createdAt.toLocaleDateString('pt-BR')} às ${data.createdAt.toLocaleTimeString('pt-BR')}`);
  lines.push('');
  
  lines.push('*ITENS:*');
  data.items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name}`);
    lines.push(`   ${item.quantity}x ${formatCurrency(item.unitPrice)} = *${formatCurrency(item.subtotal)}*`);
  });
  lines.push('');

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`Subtotal: ${formatCurrency(data.subtotal)}`);
  if (data.discount > 0) {
    lines.push(`Desconto: -${formatCurrency(data.discount)}`);
  }
  if (data.deliveryFee > 0) {
    lines.push(`Entrega: ${formatCurrency(data.deliveryFee)}`);
  }
  lines.push(`*TOTAL: ${formatCurrency(data.total)}*`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  lines.push('*PAGAMENTO:*');
  data.payments.forEach(p => {
    lines.push(`💳 ${p.method}: ${formatCurrency(p.amount)}`);
  });
  lines.push('');

  lines.push('✅ _Obrigado pela preferência!_');
  lines.push(`🏪 ${data.companyName}`);

  return lines.join('\n');
}

// Print receipt using browser print
export function printReceipt(data: ReceiptData): void {
  const content = generateReceiptText(data);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, habilite pop-ups para imprimir.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cupom #${data.saleId}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 280px;
          margin: 0 auto;
          padding: 10px;
        }
        pre {
          white-space: pre-wrap;
          margin: 0;
        }
        @media print {
          body { width: 80mm; }
        }
      </style>
    </head>
    <body>
      <pre>${content}</pre>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Share via WhatsApp
export function shareViaWhatsApp(data: ReceiptData, phoneNumber?: string): void {
  const message = generateReceiptWhatsApp(data);
  const encodedMessage = encodeURIComponent(message);
  
  let url = `https://wa.me/`;
  if (phoneNumber) {
    // Format phone number (remove non-digits, add country code if needed)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    url += formattedPhone;
  }
  url += `?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}

// Share via WhatsApp Web (desktop)
export function shareViaWhatsAppWeb(data: ReceiptData): void {
  const message = generateReceiptWhatsApp(data);
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
}

// Copy to clipboard
export async function copyReceiptToClipboard(data: ReceiptData): Promise<boolean> {
  const content = generateReceiptWhatsApp(data);
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}
