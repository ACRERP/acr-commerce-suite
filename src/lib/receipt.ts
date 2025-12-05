import { Sale, SaleItem } from './sales';
import { Client } from './clients';
import { PaymentMethod } from './paymentMethods';
import { Discount } from './discounts';

// Simple interface for sale payments since it's not in the main sales module
export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface ReceiptData {
  sale: Sale;
  items: SaleItem[];
  payments: SalePayment[];
  client?: Client;
  discounts?: Discount[];
  paymentMethods?: PaymentMethod[];
  companyInfo?: CompanyInfo;
}

export interface CompanyInfo {
  name: string;
  document?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface ReceiptOptions {
  printHeader?: boolean;
  printFooter?: boolean;
  printClientInfo?: boolean;
  printPaymentDetails?: boolean;
  printDiscounts?: boolean;
  printBarcode?: boolean;
  printQrCode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  paperWidth?: number; // in mm
}

export class ReceiptPrinter {
  private companyInfo: CompanyInfo;
  private defaultOptions: ReceiptOptions = {
    printHeader: true,
    printFooter: true,
    printClientInfo: true,
    printPaymentDetails: true,
    printDiscounts: true,
    printBarcode: false,
    printQrCode: false,
    fontSize: 'medium',
    paperWidth: 80, // Standard thermal printer width
  };

  constructor(companyInfo: CompanyInfo) {
    this.companyInfo = companyInfo;
  }

  // Generate receipt HTML for printing
  generateReceiptHTML(data: ReceiptData, options: Partial<ReceiptOptions> = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Recibo - Venda #${data.sale.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: ${this.getFontSize(opts.fontSize)};
              line-height: 1.4;
              width: ${opts.paperWidth}mm;
              padding: 10px;
              background: white;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            
            .company-name {
              font-size: ${this.getFontSize(opts.fontSize, 1.2)};
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .company-info {
              font-size: ${this.getFontSize(opts.fontSize, 0.9)};
              margin-bottom: 3px;
            }
            
            .receipt-title {
              text-align: center;
              font-weight: bold;
              margin: 15px 0;
              font-size: ${this.getFontSize(opts.fontSize, 1.1)};
            }
            
            .sale-info {
              margin-bottom: 15px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .client-info {
              margin-bottom: 15px;
              padding: 8px;
              background: #f5f5f5;
              border-radius: 3px;
            }
            
            .items-table {
              width: 100%;
              margin-bottom: 15px;
            }
            
            .items-table th {
              text-align: left;
              border-bottom: 1px solid #000;
              padding: 5px 0;
              font-weight: bold;
            }
            
            .items-table td {
              padding: 3px 0;
              vertical-align: top;
            }
            
            .item-name {
              width: 50%;
            }
            
            .item-qty {
              width: 15%;
              text-align: center;
            }
            
            .item-price {
              width: 17%;
              text-align: right;
            }
            
            .item-total {
              width: 18%;
              text-align: right;
              font-weight: bold;
            }
            
            .discounts {
              margin-bottom: 15px;
              padding: 8px;
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 3px;
            }
            
            .discount-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .payments {
              margin-bottom: 15px;
            }
            
            .payment-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .totals {
              margin-bottom: 20px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            
            .grand-total {
              font-weight: bold;
              font-size: ${this.getFontSize(opts.fontSize, 1.1)};
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: ${this.getFontSize(opts.fontSize, 0.9)};
            }
            
            .barcode {
              text-align: center;
              margin: 10px 0;
            }
            
            .qrcode {
              text-align: center;
              margin: 10px 0;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 5px;
              }
            }
          </style>
        </head>
        <body>
          ${opts.printHeader ? this.generateHeader() : ''}
          
          <div class="receipt-title">RECIBO DE VENDA</div>
          
          <div class="sale-info">
            <div class="info-row">
              <span>Nº da Venda:</span>
              <span>${data.sale.id.toString().slice(-8)}</span>
            </div>
            <div class="info-row">
              <span>Data:</span>
              <span>${new Date(data.sale.created_at).toLocaleString('pt-BR')}</span>
            </div>
            <div class="info-row">
              <span>Status:</span>
              <span>${this.formatSaleStatus(data.sale.status)}</span>
            </div>
          </div>
          
          ${opts.printClientInfo && data.client ? this.generateClientInfo(data.client) : ''}
          
          <table class="items-table">
            <thead>
              <tr>
                <th class="item-name">Produto</th>
                <th class="item-qty">Qtd</th>
                <th class="item-price">Unit.</th>
                <th class="item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => this.generateItemRow(item)).join('')}
            </tbody>
          </table>
          
          ${opts.printDiscounts && data.discounts && data.discounts.length > 0 ? 
            this.generateDiscounts(data.discounts) : ''}
          
          ${opts.printPaymentDetails ? this.generatePayments(data.payments, data.paymentMethods) : ''}
          
          <div class="totals">
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>R$ ${data.sale.total_amount.toFixed(2)}</span>
            </div>
          </div>
          
          ${opts.printBarcode ? this.generateBarcode(data.sale.id) : ''}
          ${opts.printQrCode ? this.generateQRCode(data.sale.id) : ''}
          
          ${opts.printFooter ? this.generateFooter() : ''}
        </body>
      </html>
    `;
  }

  // Generate receipt text for thermal printers
  generateReceiptText(data: ReceiptData, options: Partial<ReceiptOptions> = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    const width = opts.paperWidth || 80;
    const charsPerLine = Math.floor(width / 0.125); // Approximate characters per line
    
    let receipt = '';
    
    // Header
    if (opts.printHeader) {
      receipt += this.centerText(this.companyInfo.name, charsPerLine) + '\n';
      if (this.companyInfo.document) {
        receipt += this.centerText(this.companyInfo.document, charsPerLine) + '\n';
      }
      if (this.companyInfo.address) {
        receipt += this.centerText(this.companyInfo.address, charsPerLine) + '\n';
      }
      if (this.companyInfo.phone) {
        receipt += this.centerText(this.companyInfo.phone, charsPerLine) + '\n';
      }
      receipt += '\n';
    }
    
    // Title
    receipt += this.centerText('RECIBO DE VENDA', charsPerLine) + '\n';
    receipt += this.repeatChar('=', charsPerLine) + '\n\n';
    
    // Sale info
    receipt += `Venda: ${data.sale.id.toString().slice(-8)}\n`;
    receipt += `Data: ${new Date(data.sale.created_at).toLocaleString('pt-BR')}\n`;
    receipt += `Status: ${this.formatSaleStatus(data.sale.status)}\n\n`;
    
    // Client info
    if (opts.printClientInfo && data.client) {
      receipt += 'CLIENTE:\n';
      receipt += `Nome: ${data.client.name}\n`;
      if (data.client.cpf_cnpj) {
        receipt += `CPF/CNPJ: ${data.client.cpf_cnpj}\n`;
      }
      receipt += '\n';
    }
    
    // Items
    receipt += this.repeatChar('-', charsPerLine) + '\n';
    receipt += this.formatTableRow(['PRODUTO', 'QTD', 'UNIT.', 'TOTAL'], [30, 8, 12, 15]) + '\n';
    receipt += this.repeatChar('-', charsPerLine) + '\n';
    
    data.items.forEach(item => {
      const productName = this.truncateText(item.product?.name || 'Produto', 30);
      receipt += this.formatTableRow(
        [productName, item.quantity.toString(), `R$${item.price.toFixed(2)}`, `R$${(item.quantity * item.price).toFixed(2)}`],
        [30, 8, 12, 15]
      ) + '\n';
    });
    
    receipt += this.repeatChar('-', charsPerLine) + '\n\n';
    
    // Discounts
    if (opts.printDiscounts && data.discounts && data.discounts.length > 0) {
      receipt += 'DESCONTOS:\n';
      data.discounts.forEach(discount => {
        receipt += `${discount.name}: -R$${discount.value?.toFixed(2) || '0.00'}\n`;
      });
      receipt += '\n';
    }
    
    // Payments
    if (opts.printPaymentDetails) {
      receipt += 'PAGAMENTOS:\n';
      data.payments.forEach(payment => {
        const method = data.paymentMethods?.find(m => m.id === payment.payment_method_id);
        receipt += `${method?.name || 'Pagamento'}: R$${payment.amount.toFixed(2)}\n`;
      });
      receipt += '\n';
    }
    
    // Totals
    receipt += this.repeatChar('=', charsPerLine) + '\n';
    receipt += `TOTAL: R$${data.sale.total_amount.toFixed(2)}\n`;
    receipt += this.repeatChar('=', charsPerLine) + '\n\n';
    
    // Footer
    if (opts.printFooter) {
      receipt += this.centerText('Obrigado pela preferência!', charsPerLine) + '\n';
      receipt += this.centerText('Volte sempre!', charsPerLine) + '\n\n';
      if (this.companyInfo.email) {
        receipt += this.centerText(this.companyInfo.email, charsPerLine) + '\n';
      }
    }
    
    receipt += '\n\n\n'; // Add space for cutting
    
    return receipt;
  }

  // Print receipt using browser print API
  async printReceipt(data: ReceiptData, options: Partial<ReceiptOptions> = {}): Promise<void> {
    const html = this.generateReceiptHTML(data, options);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Não foi possível abrir a janela de impressão');
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  // Generate PDF receipt
  async generatePDFReceipt(data: ReceiptData, options: Partial<ReceiptOptions> = {}): Promise<Blob> {
    // This would require a PDF library like jsPDF or puppeteer
    // For now, we'll return the HTML as a blob
    const html = this.generateReceiptHTML(data, options);
    return new Blob([html], { type: 'text/html' });
  }

  // Send receipt to email
  async emailReceipt(data: ReceiptData, email: string, options: Partial<ReceiptOptions> = {}): Promise<void> {
    // This would require an email service integration
    console.log('Email receipt to:', email, 'Data:', data, 'Options:', options);
  }

  // Helper methods
  private getFontSize(baseSize: string, multiplier = 1): string {
    const sizes = {
      small: '10px',
      medium: '12px',
      large: '14px',
    };
    const base = sizes[baseSize as keyof typeof sizes] || sizes.medium;
    const size = parseFloat(base) * multiplier;
    return `${size}px`;
  }

  private formatSaleStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      refunded: 'Devolvida',
    };
    return statusMap[status] || status;
  }

  private generateHeader(): string {
    return `
      <div class="header">
        <div class="company-name">${this.companyInfo.name}</div>
        ${this.companyInfo.document ? `<div class="company-info">${this.companyInfo.document}</div>` : ''}
        ${this.companyInfo.address ? `<div class="company-info">${this.companyInfo.address}</div>` : ''}
        ${this.companyInfo.phone ? `<div class="company-info">${this.companyInfo.phone}</div>` : ''}
        ${this.companyInfo.email ? `<div class="company-info">${this.companyInfo.email}</div>` : ''}
      </div>
    `;
  }

  private generateClientInfo(client: Client): string {
    return `
      <div class="client-info">
        <div><strong>DADOS DO CLIENTE</strong></div>
        <div>Nome: ${client.name}</div>
        ${client.cpf_cnpj ? `<div>CPF/CNPJ: ${client.cpf_cnpj}</div>` : ''}
        ${client.phone ? `<div>Telefone: ${client.phone}</div>` : ''}
      </div>
    `;
  }

  private generateItemRow(item: SaleItem): string {
    const productName = item.product?.name || 'Produto';
    
    return `
      <tr>
        <td class="item-name">
          ${productName}
        </td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-price">R$ ${item.price.toFixed(2)}</td>
        <td class="item-total">R$ ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `;
  }

  private generateDiscounts(discounts: Discount[]): string {
    return `
      <div class="discounts">
        <div><strong>DESCONTOS APLICADOS</strong></div>
        ${discounts.map(discount => `
          <div class="discount-item">
            <span>${discount.name}</span>
            <span>-R$ ${discount.value?.toFixed(2) || '0.00'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private generatePayments(payments: SalePayment[], paymentMethods?: PaymentMethod[]): string {
    return `
      <div class="payments">
        <div><strong>FORMAS DE PAGAMENTO</strong></div>
        ${payments.map(payment => {
          const method = paymentMethods?.find(m => m.id === payment.payment_method_id);
          return `
            <div class="payment-item">
              <span>${method?.name || 'Pagamento'}</span>
              <span>R$ ${payment.amount.toFixed(2)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private generateBarcode(saleId: number): string {
    return `
      <div class="barcode">
        <div>Código de Barras</div>
        <div style="font-family: monospace; font-size: 20px;">${saleId.toString().slice(-12)}</div>
      </div>
    `;
  }

  private generateQRCode(saleId: number): string {
    return `
      <div class="qrcode">
        <div>QR Code</div>
        <div style="width: 100px; height: 100px; border: 1px solid #000; margin: 0 auto;">
          <div style="text-align: center; line-height: 100px; font-size: 10px;">QR</div>
        </div>
      </div>
    `;
  }

  private generateFooter(): string {
    return `
      <div class="footer">
        <div>Obrigado pela preferência!</div>
        <div>Volte sempre!</div>
        ${this.companyInfo.email ? `<div>${this.companyInfo.email}</div>` : ''}
      </div>
    `;
  }

  // Text formatting helpers for thermal printers
  private centerText(text: string, width: number): string {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(Math.max(0, padding)) + text;
  }

  private repeatChar(char: string, count: number): string {
    return char.repeat(count);
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private formatTableRow(columns: string[], widths: number[]): string {
    return columns.map((col, i) => {
      const width = widths[i];
      if (col.length > width) {
        return col.substring(0, width);
      }
      return col.padEnd(width);
    }).join(' ');
  }
}

// Default company info
export const defaultCompanyInfo: CompanyInfo = {
  name: 'ACR Commerce Suite',
  document: 'CNPJ: 00.000.000/0001-00',
  address: 'Rua Principal, 123 - Centro',
  phone: '(11) 1234-5678',
  email: 'contato@acrcommerce.com.br',
};

// Create default receipt printer instance
export const receiptPrinter = new ReceiptPrinter(defaultCompanyInfo);

// Utility functions
export function printSaleReceipt(sale: Sale, items: SaleItem[], payments: SalePayment[], options?: Partial<ReceiptOptions>) {
  return receiptPrinter.printReceipt({
    sale,
    items,
    payments,
  }, options);
}

export function generateSaleReceiptText(sale: Sale, items: SaleItem[], payments: SalePayment[], options?: Partial<ReceiptOptions>) {
  return receiptPrinter.generateReceiptText({
    sale,
    items,
    payments,
  }, options);
}

export function generateSaleReceiptHTML(sale: Sale, items: SaleItem[], payments: SalePayment[], options?: Partial<ReceiptOptions>) {
  return receiptPrinter.generateReceiptHTML({
    sale,
    items,
    payments,
  }, options);
}
