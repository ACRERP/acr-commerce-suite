import { supabase } from '@/lib/supabaseClient'; // Ensure implementation matches your project import
import { FiscalConfig, SaleData, NFCeResponse } from './nfce-service';

export interface FocusNFeConfig {
    token: string;
    environment: 'homologacao' | 'producao';
}

/**
 * Cliente HTTP Simples para API FocusNFe v2
 */
export class FocusNFeClient {
    private baseUrl: string;
    private token: string;

    constructor(config: FocusNFeConfig) {
        this.baseUrl = config.environment === 'producao' 
            ? 'https://api.focusnfe.com.br/v2' 
            : 'https://homologacao.focusnfe.com.br/v2';
        this.token = config.token;
    }

    private async request(endpoint: string, method: 'GET' | 'POST' | 'DELETE', body?: any) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(this.token + ':') 
        };

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FocusNFe API Error: ${response.status} - ${errorText}`);
        }

        return response.json();
    }

    async emitirNFCe(data: any): Promise<any> {
        // Na Focus, enviamos autorizar com referencia
        // POST /v2/nfce?ref=REFERENCIA
        return this.request(`/nfce?ref=${data.referencia}`, 'POST', data);
    }

    async consultarNFCe(referencia: string): Promise<any> {
        return this.request(`/nfce/${referencia}`, 'GET');
    }

    async cancelarNFCe(referencia: string, justificativa: string): Promise<any> {
        return this.request(`/nfce/${referencia}`, 'DELETE', { justificativa });
    }
}

/**
 * Adaptador para transformar SaleData no formato FocusNFe
 */
export function mapSaleToFocusNFe(sale: SaleData, config: FiscalConfig, nextNumber: number): any {
    return {
        referencia: sale.id, // ID da Venda como Ref
        natureza_operacao: 'VENDA AO CONSUMIDOR',
        serie: config.serie_nfce,
        numero: nextNumber,
        data_emissao: new Date().toISOString(),
        
        // Emitente é configurado no painel da Focus pelo Token, mas alguns dados podem ir aqui se necessario
        
        items: sale.items.map((item, i) => ({
            numero_item: i + 1,
            codigo_produto: item.product_id.slice(0, 20), // Focus limit
            descricao: item.product.name,
            codigo_ncm: item.product.ncm || '00000000',
            codigo_cest: null, // Ideal ter no cadastro de produto
            cfop: item.product.cfop_padrao || '5102',
            unidade_comercial: item.product.unit || 'UN',
            quantidade_comercial: item.quantity,
            valor_unitario_comercial: item.unit_price,
            valor_bruto: item.total,
            unidade_tributavel: item.product.unit || 'UN',
            quantidade_tributavel: item.quantity,
            valor_unitario_tributavel: item.unit_price,
            // Impostos SIMPLIFICADOS (Simples Nacional)
            icms_origem: item.product.origem || '0',
            icms_situacao_tributaria: '102', // CSOSN 102
            pis_situacao_tributaria: '99',
            cofins_situacao_tributaria: '99'
        })),

        formas_pagamento: [{
            forma_pagamento: '01', // Dinheiro (Mapear corretamente em prod)
            valor_pagamento: sale.total_amount
        }],

        // Cliente (Opcional na NFCe)
        cliente: sale.client ? {    
            cpf: sale.client.cpf_cnpj?.length === 11 ? sale.client.cpf_cnpj : undefined,
            cnpj: sale.client.cpf_cnpj?.length === 14 ? sale.client.cpf_cnpj : undefined,
            nome_completo: sale.client.name,
            email: sale.client.email
        } : undefined
    };
}
