import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceOrder } from '@/components/dashboard/service-orders/ServiceOrderList';

interface ServiceOrderItem {
  item_type: 'service' | 'part';
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function generateServiceOrderPDF(
  order: ServiceOrder,
  items: ServiceOrderItem[] = []
): Promise<void> {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACR Store', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema ERP - Ordem de Serviço', 105, 27, { align: 'center' });
  
  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);
  
  // OS Header Info
  let yPos = 40;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ordem de Serviço #${order.id}`, 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos += 7;
  doc.text(`Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}`, 20, yPos);
  yPos += 5;
  doc.text(`Status: ${order.status.toUpperCase()}`, 20, yPos);
  
  // Client Info
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(order.clients?.name || 'N/A', 20, yPos);
  if (order.clients?.phone) {
    yPos += 5;
    doc.text(`Tel: ${order.clients.phone}`, 20, yPos);
  }
  
  // Device Info
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Equipamento:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  doc.text(`Tipo: ${order.device_type}`, 20, yPos);
  if (order.device_brand) {
    yPos += 5;
    doc.text(`Marca: ${order.device_brand}`, 20, yPos);
  }
  if (order.device_model) {
    yPos += 5;
    doc.text(`Modelo: ${order.device_model}`, 20, yPos);
  }
  if (order.serial_number) {
    yPos += 5;
    doc.text(`Serial/IMEI: ${order.serial_number}`, 20, yPos);
  }
  if (order.condition) {
    yPos += 5;
    doc.text(`Condição: ${order.condition}`, 20, yPos);
  }
  
  // Reported Issue
  if (order.reported_issue) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Defeito Relatado:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    const issueLines = doc.splitTextToSize(order.reported_issue, 170);
    doc.text(issueLines, 20, yPos);
    yPos += (issueLines.length * 5);
  }
  
  // Items Table
  if (items.length > 0) {
    yPos += 10;
    
    const tableData = items.map(item => [
      item.item_type === 'service' ? 'Serviço' : 'Peça',
      item.description,
      item.quantity.toString(),
      `R$ ${item.unit_price.toFixed(2)}`,
      `R$ ${item.total_price.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Tipo', 'Descrição', 'Qtd', 'Valor Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Financial Summary
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Financeiro:', 120, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 7;
  doc.text(`Serviços:`, 120, yPos);
  doc.text(`R$ ${(order.total_services || 0).toFixed(2)}`, 180, yPos, { align: 'right' });
  
  yPos += 5;
  doc.text(`Peças:`, 120, yPos);
  doc.text(`R$ ${(order.total_parts || 0).toFixed(2)}`, 180, yPos, { align: 'right' });
  
  if (order.discount && order.discount > 0) {
    yPos += 5;
    doc.text(`Desconto:`, 120, yPos);
    doc.text(`- R$ ${order.discount.toFixed(2)}`, 180, yPos, { align: 'right' });
  }
  
  if (order.additional_fees && order.additional_fees > 0) {
    yPos += 5;
    doc.text(`Taxas Adicionais:`, 120, yPos);
    doc.text(`R$ ${order.additional_fees.toFixed(2)}`, 180, yPos, { align: 'right' });
  }
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL:`, 120, yPos);
  doc.text(`R$ ${(order.final_value || 0).toFixed(2)}`, 180, yPos, { align: 'right' });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Obrigado pela preferência!', 105, pageHeight - 20, { align: 'center' });
  doc.text('ACR Store - Sistema ERP', 105, pageHeight - 15, { align: 'center' });
  
  // Save PDF
  doc.save(`OS_${order.id}_${order.clients?.name || 'Cliente'}.pdf`);
}

export function openWhatsAppWithMessage(phone: string, orderId: number): void {
  // Clean phone number (remove non-digits)
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming Brazil +55)
  const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  
  // Create message
  const message = encodeURIComponent(
    `Olá! Sua Ordem de Serviço #${orderId} está disponível.\n\n` +
    `Você pode baixar o PDF com os detalhes do serviço.\n\n` +
    `Qualquer dúvida, estamos à disposição!`
  );
  
  // Open WhatsApp Web
  const whatsappUrl = `https://wa.me/${fullPhone}?text=${message}`;
  window.open(whatsappUrl, '_blank');
}
