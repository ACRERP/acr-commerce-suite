import { ServiceOrder } from "./os-service";

export const printOS = (os: ServiceOrder, services: any[] = [], parts: any[] = []) => {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor, permita popups para imprimir.');
    return;
  }

  const logoUrl = '/logo.png'; // Substituir por logo real se houver
  const companyName = 'ACR Assistência Técnica';
  const companyInfo = 'Rua Exemplo, 123 - Centro<br>Tel: (11) 99999-9999';

  const servicesHtml = services.length > 0 ? `
    <div class="section">
      <h3>Serviços Realizados</h3>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${services.map(s => `
            <tr>
              <td>${s.descricao}</td>
              <td class="text-right">${s.quantidade}</td>
              <td class="text-right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.valor_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const partsHtml = parts.length > 0 ? `
    <div class="section">
      <h3>Peças Utilizadas</h3>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="text-right">Qtd</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${parts.map(p => `
            <tr>
              <td>${p.descricao}</td>
              <td class="text-right">${p.quantidade}</td>
              <td class="text-right">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor_total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OS #${os.numero}</title>
        <style>
          body { font-family: sans-serif; font-size: 12px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #000; }
          .info { text-align: right; line-height: 1.4; }
          .os-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; background: #f9f9f9; padding: 10px; border: 1px solid #ddd; }
          
          .grid { display: flex; gap: 20px; margin-bottom: 20px; }
          .col { flex: 1; }
          .box { border: 1px solid #ddd; padding: 10px; border-radius: 4px; height: 100%; }
          .box h4 { margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 14px; }
          .item { margin-bottom: 5px; }
          .label { font-weight: bold; color: #555; }
          
          .section { margin-top: 20px; }
          .section h3 { border-bottom: 2px solid #eee; padding-bottom: 5px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { text-align: left; background: #f5f5f5; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          .text-right { text-align: right; }
          .font-mono { font-family: monospace; }
          
          .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
          .totals-box { width: 300px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .row.final { font-size: 16px; font-weight: bold; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 10px; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
          .sig-line { width: 40%; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
          
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${companyName}</div>
          <div class="info">${companyInfo}</div>
        </div>
        
        <div class="os-title">ORDEM DE SERVIÇO Nº ${os.numero}</div>
        
        <div class="grid">
          <div class="col">
            <div class="box">
              <h4>Cliente</h4>
              <div class="item"><span class="label">Nome:</span> ${os.clients?.name || 'N/A'}</div>
              <div class="item"><span class="label">Telefone:</span> ${os.clients?.phone || 'N/A'}</div>
              <div class="item"><span class="label">Documento:</span> ${os.clients?.cpf_cnpj || 'N/A'}</div>
            </div>
          </div>
          <div class="col">
            <div class="box">
              <h4>Equipamento</h4>
              <div class="item"><span class="label">Tipo:</span> ${os.device_type}</div>
              <div class="item"><span class="label">Marca/Modelo:</span> ${os.device_brand || ''} ${os.device_model || ''}</div>
              <div class="item"><span class="label">Série/IMEI:</span> ${os.serial_number || 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <div class="box" style="margin-bottom: 20px;">
          <h4>Defeito Relatado</h4>
          <div>${os.reported_issue}</div>
        </div>
        
        ${os.diagnostico ? `
        <div class="box" style="margin-bottom: 20px; background-color: #f0f7ff;">
          <h4>Diagnóstico Técnico</h4>
          <div>${os.diagnostico}</div>
        </div>` : ''}
        
        ${servicesHtml}
        
        ${partsHtml}
        
        <div class="totals">
          <div class="totals-box">
            <div class="row"><span>Serviços:</span> <span class="font-mono">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_servicos || 0)}</span></div>
            <div class="row"><span>Peças:</span> <span class="font-mono">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_pecas || 0)}</span></div>
            <div class="row"><span>Desconto:</span> <span class="font-mono text-red">- ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.desconto || 0)}</span></div>
            <div class="row final"><span>TOTAL:</span> <span class="font-mono">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_final || 0)}</span></div>
          </div>
        </div>
        
        <div class="signatures">
          <div class="sig-line">Assinatura do Técnico</div>
          <div class="sig-line">Assinatura do Cliente</div>
        </div>
        
        <div class="footer">
          <p>Garantia de 90 dias para serviços realizados. A garantia não cobre mau uso ou danos físicos.</p>
          <p>Impresso em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
};
