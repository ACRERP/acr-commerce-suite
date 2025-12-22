/**
 * Serviço de Impressão
 * 
 * Fornece templates e métodos para impressão de documentos
 */

export interface PrintData {
  // Dados da empresa
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyCNPJ?: string;
  
  // Dados da venda
  saleId: string;
  saleDate: Date;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount?: number;
  addition?: number;
  deliveryFee?: number;
  total: number;
  
  // Dados do pagamento
  payments?: Array<{
    method: string;
    amount: number;
  }>;
  
  // Dados do cliente
  clientName?: string;
  clientCPF?: string;
  
  // Observações
  notes?: string;
}

export class PrintService {
  /**
   * Template de cupom 80mm (impressora térmica)
   */
  static printReceipt80mm(data: PrintData): void {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cupom - ${data.saleId}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 10px;
              width: 80mm;
            }
            
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .company-info {
              font-size: 10px;
              margin-bottom: 2px;
            }
            
            .sale-info {
              margin-bottom: 15px;
              font-size: 11px;
            }
            
            .items {
              margin-bottom: 15px;
            }
            
            .item {
              margin-bottom: 8px;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 5px;
            }
            
            .item-name {
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
            }
            
            .totals {
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-bottom: 15px;
            }
            
            .total-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            
            .total-line.final {
              font-size: 14px;
              font-weight: bold;
              margin-top: 8px;
              border-top: 1px solid #000;
              padding-top: 8px;
            }
            
            .payments {
              margin-bottom: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            
            .payment-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 11px;
            }
            
            .footer {
              text-align: center;
              font-size: 10px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            
            .notes {
              margin: 10px 0;
              padding: 8px;
              background: #f5f5f5;
              border: 1px solid #ddd;
              font-size: 10px;
            }
            
            @media print {
              body {
                padding: 5mm;
              }
            }
          </style>
        </head>
        <body>
          <!-- Cabeçalho -->
          <div class="header">
            <div class="company-name">${data.companyName}</div>
            ${data.companyAddress ? `<div class="company-info">${data.companyAddress}</div>` : ''}
            ${data.companyPhone ? `<div class="company-info">Tel: ${data.companyPhone}</div>` : ''}
            ${data.companyCNPJ ? `<div class="company-info">CNPJ: ${data.companyCNPJ}</div>` : ''}
          </div>
          
          <!-- Informações da Venda -->
          <div class="sale-info">
            <div><strong>Cupom:</strong> ${data.saleId}</div>
            <div><strong>Data:</strong> ${data.saleDate.toLocaleString('pt-BR')}</div>
            ${data.clientName ? `<div><strong>Cliente:</strong> ${data.clientName}</div>` : ''}
            ${data.clientCPF ? `<div><strong>CPF:</strong> ${data.clientCPF}</div>` : ''}
          </div>
          
          <!-- Itens -->
          <div class="items">
            ${data.items.map(item => `
              <div class="item">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                  <span>${item.quantity} x R$ ${item.unitPrice.toFixed(2)}</span>
                  <span>R$ ${item.total.toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Totais -->
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>R$ ${data.subtotal.toFixed(2)}</span>
            </div>
            ${data.discount ? `
              <div class="total-line">
                <span>Desconto:</span>
                <span>- R$ ${data.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            ${data.addition ? `
              <div class="total-line">
                <span>Acréscimo:</span>
                <span>+ R$ ${data.addition.toFixed(2)}</span>
              </div>
            ` : ''}
            ${data.deliveryFee ? `
              <div class="total-line">
                <span>Taxa de Entrega:</span>
                <span>R$ ${data.deliveryFee.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line final">
              <span>TOTAL:</span>
              <span>R$ ${data.total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Formas de Pagamento -->
          ${data.payments && data.payments.length > 0 ? `
            <div class="payments">
              <div style="font-weight: bold; margin-bottom: 5px;">Pagamento:</div>
              ${data.payments.map(payment => `
                <div class="payment-line">
                  <span>${payment.method}</span>
                  <span>R$ ${payment.amount.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- Observações -->
          ${data.notes ? `
            <div class="notes">
              <strong>Obs:</strong> ${data.notes}
            </div>
          ` : ''}
          
          <!-- Rodapé -->
          <div class="footer">
            <div>Obrigado pela preferência!</div>
            <div>Volte sempre!</div>
          </div>
        </body>
      </html>
    `;
    
    this.openPrintWindow(html);
  }
  
  /**
   * Template de recibo A4
   */
  static printReceiptA4(data: PrintData): void {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Recibo - ${data.saleId}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #333;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            
            .company-name {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .company-info {
              font-size: 11pt;
              color: #666;
              margin-bottom: 5px;
            }
            
            .title {
              font-size: 18pt;
              font-weight: bold;
              text-align: center;
              margin: 30px 0;
              text-transform: uppercase;
            }
            
            .info-section {
              margin-bottom: 25px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .info-item {
              padding: 10px;
              background: #f9f9f9;
              border-left: 3px solid #333;
            }
            
            .info-label {
              font-weight: bold;
              font-size: 10pt;
              color: #666;
              margin-bottom: 3px;
            }
            
            .info-value {
              font-size: 12pt;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            
            th {
              background: #333;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            
            tr:hover {
              background: #f5f5f5;
            }
            
            .text-right {
              text-align: right;
            }
            
            .totals-section {
              margin-top: 30px;
              padding: 20px;
              background: #f9f9f9;
              border: 2px solid #333;
            }
            
            .total-line {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 12pt;
            }
            
            .total-line.final {
              font-size: 16pt;
              font-weight: bold;
              border-top: 2px solid #333;
              margin-top: 10px;
              padding-top: 15px;
            }
            
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10pt;
              color: #666;
            }
            
            .signature-section {
              margin-top: 60px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            
            .signature-line {
              border-top: 1px solid #333;
              padding-top: 10px;
              text-align: center;
            }
            
            @media print {
              .container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Cabeçalho -->
            <div class="header">
              <div class="company-name">${data.companyName}</div>
              ${data.companyAddress ? `<div class="company-info">${data.companyAddress}</div>` : ''}
              ${data.companyPhone ? `<div class="company-info">Telefone: ${data.companyPhone}</div>` : ''}
              ${data.companyCNPJ ? `<div class="company-info">CNPJ: ${data.companyCNPJ}</div>` : ''}
            </div>
            
            <div class="title">Recibo de Venda</div>
            
            <!-- Informações -->
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Número do Recibo</div>
                <div class="info-value">${data.saleId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data e Hora</div>
                <div class="info-value">${data.saleDate.toLocaleString('pt-BR')}</div>
              </div>
              ${data.clientName ? `
                <div class="info-item">
                  <div class="info-label">Cliente</div>
                  <div class="info-value">${data.clientName}</div>
                </div>
              ` : ''}
              ${data.clientCPF ? `
                <div class="info-item">
                  <div class="info-label">CPF/CNPJ</div>
                  <div class="info-value">${data.clientCPF}</div>
                </div>
              ` : ''}
            </div>
            
            <!-- Tabela de Itens -->
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-right">Qtd</th>
                  <th class="text-right">Valor Unit.</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">R$ ${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">R$ ${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Totais -->
            <div class="totals-section">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>R$ ${data.subtotal.toFixed(2)}</span>
              </div>
              ${data.discount ? `
                <div class="total-line">
                  <span>Desconto:</span>
                  <span>- R$ ${data.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${data.addition ? `
                <div class="total-line">
                  <span>Acréscimo:</span>
                  <span>+ R$ ${data.addition.toFixed(2)}</span>
                </div>
              ` : ''}
              ${data.deliveryFee ? `
                <div class="total-line">
                  <span>Taxa de Entrega:</span>
                  <span>R$ ${data.deliveryFee.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-line final">
                <span>VALOR TOTAL:</span>
                <span>R$ ${data.total.toFixed(2)}</span>
              </div>
            </div>
            
            <!-- Formas de Pagamento -->
            ${data.payments && data.payments.length > 0 ? `
              <div class="info-section">
                <h3 style="margin-bottom: 10px;">Formas de Pagamento:</h3>
                ${data.payments.map(payment => `
                  <div class="total-line">
                    <span>${payment.method}</span>
                    <span>R$ ${payment.amount.toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <!-- Observações -->
            ${data.notes ? `
              <div class="info-section">
                <h3 style="margin-bottom: 10px;">Observações:</h3>
                <p style="padding: 10px; background: #f9f9f9; border-left: 3px solid #333;">
                  ${data.notes}
                </p>
              </div>
            ` : ''}
            
            <!-- Assinaturas -->
            <div class="signature-section">
              <div class="signature-line">
                <div>Assinatura do Cliente</div>
              </div>
              <div class="signature-line">
                <div>Assinatura do Vendedor</div>
              </div>
            </div>
            
            <!-- Rodapé -->
            <div class="footer">
              <p>Este documento é um comprovante de venda.</p>
              <p>Emitido em ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    this.openPrintWindow(html);
  }
  
  /**
   * Abre janela de impressão
   */
  private static openPrintWindow(html: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      console.error('Não foi possível abrir janela de impressão');
      alert('Por favor, permita pop-ups para imprimir');
    }
  }
}

// Exportar instância única
export const printService = new PrintService();
