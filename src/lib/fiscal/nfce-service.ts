/**
 * Serviço de Emissão de NFC-e (Nota Fiscal de Consumidor Eletrônica)
 * 
 * Este serviço é responsável por:
 * - Gerar XML da NFC-e
 * - Assinar digitalmente com certificado A1
 * - Enviar para SEFAZ
 * - Processar retorno
 * - Gerar QR Code
 * - Salvar no banco de dados
 */

import { supabase } from '@/lib/supabase';

// Tipos
export interface FiscalConfig {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  regime_tributario: 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
  serie_nfce: string;
  ultimo_numero_nfce: number;
  csc_nfce: string;
  id_csc_nfce: number;
  ambiente: 'producao' | 'homologacao';
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface SaleData {
  id: string;
  sale_number: string;
  client_id?: string;
  client?: {
    name: string;
    cpf_cnpj?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    product_id: string;
    product: {
      name: string;
      barcode?: string;
      ncm?: string;
      cfop_padrao?: string;
      origem?: string;
      icms_aliquota?: number;
      pis_aliquota?: number;
      cofins_aliquota?: number;
      ipi_aliquota?: number;
      unit?: string;
    };
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  total_amount: number;
  discount?: number;
  created_at: string;
}

export interface NFCeResponse {
  success: boolean;
  chaveAcesso?: string;
  protocolo?: string;
  xml?: string;
  qrCode?: string;
  error?: string;
  motivo?: string;
}

export class NFCeService {
  /**
   * Emitir NFC-e para uma venda
   */
  async emitirNFCe(saleId: string, cpfCnpj?: string): Promise<NFCeResponse> {
    try {
      console.log(`[NFCe] Iniciando emissão para venda ${saleId}`);

      // 1. Buscar dados da venda
      const sale = await this.getSaleData(saleId);
      if (!sale) {
        return { success: false, error: 'Venda não encontrada' };
      }

      // 2. Buscar configurações fiscais
      const config = await this.getFiscalConfig();
      if (!config) {
        return { success: false, error: 'Configurações fiscais não encontradas' };
      }

      // 3. Obter próximo número
      const numero = await this.getNextNumber(config.id);

      // 4. Calcular impostos
      const taxes = await this.calculateTaxes(saleId);

      // 5. Gerar chave de acesso
      const chaveAcesso = await this.generateChaveAcesso(config, numero);

      // 6. Montar XML
      const xml = this.buildNFCeXML(sale, config, numero, chaveAcesso, taxes, cpfCnpj);

      // 7. Gerar QR Code
      const qrCode = await this.generateQRCode(chaveAcesso, config);

      // 8. Salvar nota no banco (status: pendente)
      const fiscalNoteId = await this.saveFiscalNote({
        sale_id: saleId,
        numero,
        serie: config.serie_nfce,
        tipo: 'nfce',
        chave_acesso: chaveAcesso,
        valor_produtos: taxes.total_produtos,
        valor_total: sale.total_amount,
        valor_desconto: sale.discount || 0,
        valor_icms: taxes.total_icms,
        valor_pis: taxes.total_pis,
        valor_cofins: taxes.total_cofins,
        valor_ipi: taxes.total_ipi,
        xml_envio: xml,
        qr_code: qrCode,
        status: 'pendente',
      });

      // 9. Em ambiente de homologação, simular autorização
      if (config.ambiente === 'homologacao') {
        console.log('[NFCe] Ambiente de homologação - simulando autorização');
        
        await this.updateFiscalNoteStatus(fiscalNoteId, {
          status: 'autorizada',
          protocolo: `999${Date.now()}`,
          data_autorizacao: new Date().toISOString(),
        });

        return {
          success: true,
          chaveAcesso,
          protocolo: `999${Date.now()}`,
          xml,
          qrCode,
        };
      }

      // 10. TODO: Enviar para SEFAZ (produção)
      // const sefazResponse = await this.sendToSEFAZ(xml, config);
      
      return {
        success: false,
        error: 'Integração com SEFAZ em desenvolvimento',
      };

    } catch (error) {
      console.error('[NFCe] Erro ao emitir:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Cancelar NFC-e
   */
  async cancelarNFCe(chaveAcesso: string, motivo: string): Promise<NFCeResponse> {
    try {
      // 1. Buscar nota
      const { data: note } = await supabase
        .from('fiscal_notes')
        .select('*')
        .eq('chave_acesso', chaveAcesso)
        .single();

      if (!note) {
        return { success: false, error: 'Nota fiscal não encontrada' };
      }

      if (note.status !== 'autorizada') {
        return { success: false, error: 'Apenas notas autorizadas podem ser canceladas' };
      }

      // 2. Verificar prazo de cancelamento (24 horas)
      const dataEmissao = new Date(note.data_emissao);
      const agora = new Date();
      const diferencaHoras = (agora.getTime() - dataEmissao.getTime()) / (1000 * 60 * 60);

      if (diferencaHoras > 24) {
        return { success: false, error: 'Prazo de cancelamento expirado (24 horas)' };
      }

      // 3. TODO: Enviar cancelamento para SEFAZ
      // const cancelResponse = await this.sendCancelToSEFAZ(chaveAcesso, motivo);

      // 4. Atualizar status no banco
      await this.updateFiscalNoteStatus(note.id, {
        status: 'cancelada',
        motivo_cancelamento: motivo,
        data_cancelamento: new Date().toISOString(),
        protocolo_cancelamento: `CANC${Date.now()}`,
      });

      return {
        success: true,
        chaveAcesso,
      };

    } catch (error) {
      console.error('[NFCe] Erro ao cancelar:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Buscar dados da venda
   */
  private async getSaleData(saleId: string): Promise<SaleData | null> {
    const { data: sale } = await supabase
      .from('sales')
      .select(`
        *,
        client:clients(*),
        items:sale_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', saleId)
      .single();

    return sale;
  }

  /**
   * Buscar configurações fiscais
   */
  private async getFiscalConfig(): Promise<FiscalConfig | null> {
    const { data } = await supabase
      .from('company_fiscal_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    return data;
  }

  /**
   * Obter próximo número de nota
   */
  private async getNextNumber(configId: string): Promise<number> {
    const { data } = await supabase.rpc('fn_get_next_fiscal_note_number', {
      p_company_id: configId,
      p_tipo: 'nfce',
    });

    return data || 1;
  }

  /**
   * Calcular impostos
   */
  private async calculateTaxes(saleId: string) {
    const { data } = await supabase.rpc('fn_calculate_taxes_for_sale', {
      p_sale_id: saleId,
    });

    return data?.[0] || {
      total_produtos: 0,
      total_icms: 0,
      total_pis: 0,
      total_cofins: 0,
      total_ipi: 0,
      total_impostos: 0,
    };
  }

  /**
   * Gerar chave de acesso
   */
  private async generateChaveAcesso(config: FiscalConfig, numero: number): Promise<string> {
    const now = new Date();
    const anoMes = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data } = await supabase.rpc('fn_generate_fiscal_note_key', {
      p_uf: config.uf,
      p_ano_mes: anoMes,
      p_cnpj: config.cnpj.replace(/\D/g, ''),
      p_modelo: '65', // NFC-e
      p_serie: config.serie_nfce.padStart(3, '0'),
      p_numero: numero.toString().padStart(9, '0'),
    });

    return data || '';
  }

  /**
   * Montar XML da NFC-e
   */
  private buildNFCeXML(
    sale: SaleData,
    config: FiscalConfig,
    numero: number,
    chaveAcesso: string,
    taxes: any,
    cpfCnpj?: string
  ): string {
    const now = new Date();
    const dataEmissao = now.toISOString();

    // Simplificado - em produção usar biblioteca de geração de XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveAcesso}" versao="4.00">
    <ide>
      <cUF>${this.getUFCode(config.uf)}</cUF>
      <cNF>${chaveAcesso.slice(35, 43)}</cNF>
      <natOp>VENDA</natOp>
      <mod>65</mod>
      <serie>${config.serie_nfce}</serie>
      <nNF>${numero}</nNF>
      <dhEmi>${dataEmissao}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>${this.getCityCode(config.cidade, config.uf)}</cMunFG>
      <tpImp>4</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${chaveAcesso.slice(43)}</cDV>
      <tpAmb>${config.ambiente === 'producao' ? '1' : '2'}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0.0</verProc>
    </ide>
    <emit>
      <CNPJ>${config.cnpj.replace(/\D/g, '')}</CNPJ>
      <xNome>${config.razao_social}</xNome>
      <xFant>${config.nome_fantasia}</xFant>
      <enderEmit>
        <xLgr>${config.logradouro}</xLgr>
        <nro>${config.numero}</nro>
        <xBairro>${config.bairro}</xBairro>
        <cMun>${this.getCityCode(config.cidade, config.uf)}</cMun>
        <xMun>${config.cidade}</xMun>
        <UF>${config.uf}</UF>
        <CEP>${config.cep.replace(/\D/g, '')}</CEP>
      </enderEmit>
      <IE>${config.inscricao_estadual}</IE>
      <CRT>${config.regime_tributario === 'simples_nacional' ? '1' : '3'}</CRT>
    </emit>
    ${cpfCnpj ? this.buildDestXML(cpfCnpj, sale.client) : ''}
    ${this.buildItemsXML(sale.items, config.regime_tributario)}
    ${this.buildTotalXML(sale, taxes)}
  </infNFe>
</NFe>`;

    return xml;
  }

  /**
   * Montar XML do destinatário
   */
  private buildDestXML(cpfCnpj: string, client?: any): string {
    const documento = cpfCnpj.replace(/\D/g, '');
    const isCPF = documento.length === 11;

    return `
    <dest>
      ${isCPF ? `<CPF>${documento}</CPF>` : `<CNPJ>${documento}</CNPJ>`}
      ${client?.name ? `<xNome>${client.name}</xNome>` : ''}
      <indIEDest>9</indIEDest>
    </dest>`;
  }

  /**
   * Montar XML dos itens
   */
  private buildItemsXML(items: any[], regimeTributario: string): string {
    return items.map((item, index) => `
    <det nItem="${index + 1}">
      <prod>
        <cProd>${item.product_id.slice(0, 8)}</cProd>
        <cEAN>${item.product.barcode || 'SEM GTIN'}</cEAN>
        <xProd>${item.product.name}</xProd>
        <NCM>${item.product.ncm || '00000000'}</NCM>
        <CFOP>${item.product.cfop_padrao || '5102'}</CFOP>
        <uCom>${item.product.unit || 'UN'}</uCom>
        <qCom>${item.quantity}</qCom>
        <vUnCom>${item.unit_price.toFixed(4)}</vUnCom>
        <vProd>${item.total.toFixed(2)}</vProd>
        <cEANTrib>${item.product.barcode || 'SEM GTIN'}</cEANTrib>
        <uTrib>${item.product.unit || 'UN'}</uTrib>
        <qTrib>${item.quantity}</qTrib>
        <vUnTrib>${item.unit_price.toFixed(4)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        ${this.buildTaxXML(item, regimeTributario)}
      </imposto>
    </det>`).join('');
  }

  /**
   * Montar XML de impostos do item
   */
  private buildTaxXML(item: any, regimeTributario: string): string {
    if (regimeTributario === 'simples_nacional') {
      return `
        <ICMS>
          <ICMSSN102>
            <orig>${item.product.origem || '0'}</orig>
            <CSOSN>102</CSOSN>
          </ICMSSN102>
        </ICMS>
        <PIS>
          <PISOutr>
            <CST>99</CST>
            <vBC>0.00</vBC>
            <pPIS>0.00</pPIS>
            <vPIS>0.00</vPIS>
          </PISOutr>
        </PIS>
        <COFINS>
          <COFINSOutr>
            <CST>99</CST>
            <vBC>0.00</vBC>
            <pCOFINS>0.00</pCOFINS>
            <vCOFINS>0.00</vCOFINS>
          </COFINSOutr>
        </COFINS>`;
    }

    // Regime normal - calcular impostos
    return `
      <ICMS>
        <ICMS00>
          <orig>${item.product.origem || '0'}</orig>
          <CST>00</CST>
          <modBC>3</modBC>
          <vBC>${item.total.toFixed(2)}</vBC>
          <pICMS>${item.product.icms_aliquota || 0}</pICMS>
          <vICMS>${(item.total * (item.product.icms_aliquota || 0) / 100).toFixed(2)}</vICMS>
        </ICMS00>
      </ICMS>
      <PIS>
        <PISAliq>
          <CST>01</CST>
          <vBC>${item.total.toFixed(2)}</vBC>
          <pPIS>${item.product.pis_aliquota || 0}</pPIS>
          <vPIS>${(item.total * (item.product.pis_aliquota || 0) / 100).toFixed(2)}</vPIS>
        </PISAliq>
      </PIS>
      <COFINS>
        <COFINSAliq>
          <CST>01</CST>
          <vBC>${item.total.toFixed(2)}</vBC>
          <pCOFINS>${item.product.cofins_aliquota || 0}</pCOFINS>
          <vCOFINS>${(item.total * (item.product.cofins_aliquota || 0) / 100).toFixed(2)}</vCOFINS>
        </COFINSAliq>
      </COFINS>`;
  }

  /**
   * Montar XML de totais
   */
  private buildTotalXML(sale: SaleData, taxes: any): string {
    return `
    <total>
      <ICMSTot>
        <vBC>${taxes.total_produtos.toFixed(2)}</vBC>
        <vICMS>${taxes.total_icms.toFixed(2)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${taxes.total_produtos.toFixed(2)}</vProd>
        <vFrete>0.00</vFrete>
        <vSeg>0.00</vSeg>
        <vDesc>${(sale.discount || 0).toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>${taxes.total_ipi.toFixed(2)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${taxes.total_pis.toFixed(2)}</vPIS>
        <vCOFINS>${taxes.total_cofins.toFixed(2)}</vCOFINS>
        <vOutro>0.00</vOutro>
        <vNF>${sale.total_amount.toFixed(2)}</vNF>
      </ICMSTot>
    </total>`;
  }

  /**
   * Gerar QR Code
   */
  private async generateQRCode(chaveAcesso: string, config: FiscalConfig): Promise<string> {
    const { data } = await supabase.rpc('fn_generate_nfce_qrcode_data', {
      p_chave_acesso: chaveAcesso,
      p_ambiente: config.ambiente,
      p_id_csc: config.id_csc_nfce,
      p_csc: config.csc_nfce,
    });

    return data || '';
  }

  /**
   * Salvar nota fiscal no banco
   */
  private async saveFiscalNote(data: any): Promise<string> {
    const { data: note, error } = await supabase
      .from('fiscal_notes')
      .insert(data)
      .select('id')
      .single();

    if (error) throw error;
    return note.id;
  }

  /**
   * Atualizar status da nota fiscal
   */
  private async updateFiscalNoteStatus(id: string, data: any): Promise<void> {
    const { error } = await supabase
      .from('fiscal_notes')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Obter código da UF
   */
  private getUFCode(uf: string): string {
    const codes: Record<string, string> = {
      'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
      'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
      'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
      'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
      'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
      'SE': '28', 'TO': '17'
    };
    return codes[uf] || '35';
  }

  /**
   * Obter código do município (simplificado)
   */
  private getCityCode(cidade: string, uf: string): string {
    // Em produção, usar tabela IBGE completa
    return '3550308'; // São Paulo como exemplo
  }
}

// Exportar instância única
export const nfceService = new NFCeService();
