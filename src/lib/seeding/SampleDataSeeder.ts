
import { supabase } from '@/lib/supabaseClient';
import { CreateProductData } from '@/lib/products';
import { Client } from '@/lib/clients/client-service';

export interface SampleData {
  products: Partial<CreateProductData>[];
  clients: Partial<Client>[];
}

const SAMPLE_DATA_MAP: Record<string, SampleData> = {
  'bakery': {
    products: [
      { name: 'Pão Francês (Cento)', code: 'PF-001', unit: 'UN', stock_quantity: 500, minimum_stock_level: 50, sale_price: 60.00, cost_price: 25.00, description: 'Pão francês fresquinho produzido diariamente.' },
      { name: 'Bolo de Cenoura com Cobertura', code: 'BO-002', unit: 'UN', stock_quantity: 12, minimum_stock_level: 3, sale_price: 35.00, cost_price: 12.00, description: 'Bolo caseiro com calda de chocolate belga.' },
      { name: 'Sonho de Creme', code: 'SO-003', unit: 'UN', stock_quantity: 24, minimum_stock_level: 5, sale_price: 8.50, cost_price: 3.20, description: 'Sonho tradicional recheado com creme de baunilha.' },
      { name: 'Café Expresso G', code: 'CF-004', unit: 'UN', stock_quantity: 1000, minimum_stock_level: 100, sale_price: 7.00, cost_price: 1.50, description: 'Café torrado premium 100% arábica.' }
    ],
    clients: [
      { name: 'Carlos Alberto (Mensalista)', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Cliente fiel, consome café da manhã diariamente.' },
      { name: 'Restaurante Sabor Local', client_type: 'pj', cpf_cnpj: '12.345.678/0001-99', status: 'active', financial_status: 'ok', notes: 'Compra pães para revenda.' }
    ]
  },
  'mechanic': {
    products: [
      { name: 'Troca de Óleo Sintético 5W30', code: 'SRV-001', unit: 'SRV', stock_quantity: 50, minimum_stock_level: 10, sale_price: 180.00, cost_price: 95.00, description: 'Serviço completo com troca de filtro.' },
      { name: 'Pastilha de Freio Dianteira (Par)', code: 'PC-002', unit: 'PAR', stock_quantity: 15, minimum_stock_level: 4, sale_price: 145.00, cost_price: 65.00, description: 'Pastilhas cerâmicas de alta performance.' },
      { name: 'Alinhamento e Balanceamento 3D', code: 'SRV-003', unit: 'SRV', stock_quantity: 100, minimum_stock_level: 0, sale_price: 120.00, cost_price: 15.00, description: 'Serviço realizado em rampa computadorizada.' },
      { name: 'Filtro de Ar Condicionado', code: 'PC-004', unit: 'UN', stock_quantity: 20, minimum_stock_level: 5, sale_price: 45.00, cost_price: 18.00, description: 'Filtro com carvão ativado contra odores.' }
    ],
    clients: [
      { name: 'Roberto da Silva', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Dono de um Corolla, faz manutenção preventiva.' },
      { name: 'Transportadora Veloz', client_type: 'pj', cpf_cnpj: '99.888.777/0001-11', status: 'active', financial_status: 'ok', notes: 'Frota de 5 caminhonetes.' }
    ]
  },
  'restaurant': {
    products: [
      { name: 'Marmitex Executiva G', code: 'PRT-001', unit: 'UN', stock_quantity: 100, minimum_stock_level: 10, sale_price: 28.00, cost_price: 11.50, description: 'Arroz, feijão, proteína, 2 guarnições e salada.' },
      { name: 'Coca-Cola 2L', code: 'BEB-002', unit: 'UN', stock_quantity: 48, minimum_stock_level: 12, sale_price: 14.00, cost_price: 8.50, description: 'Refrigerante gelado embalagem família.' },
      { name: 'Sobremesa Pudim de Leite', code: 'DO-003', unit: 'UN', stock_quantity: 20, minimum_stock_level: 5, sale_price: 7.50, cost_price: 2.10, description: 'Fatia generosa de pudim caseiro.' },
      { name: 'Suco Natural de Laranja 500ml', code: 'BEB-004', unit: 'UN', stock_quantity: 50, minimum_stock_level: 10, sale_price: 12.00, cost_price: 3.50, description: 'Suco feito na hora com frutas selecionadas.' }
    ],
    clients: [
      { name: 'Ana Paula (VIP)', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Frequenta o restaurante no almoço todos os dias.' },
      { name: 'Empresa Alpha Tech', client_type: 'pj', status: 'active', financial_status: 'ok', notes: 'Convênio para funcionários (15 pessoas).' }
    ]
  },
  'clothing_store': {
    products: [
      { name: 'Camiseta Básica Algodão Egípcio', code: 'MOD-001', unit: 'UN', stock_quantity: 30, minimum_stock_level: 10, sale_price: 89.90, cost_price: 35.00, description: 'Camiseta premium com toque macio e alta durabilidade.' },
      { name: 'Calça Jeans Slim Fit Masculina', code: 'MOD-002', unit: 'UN', stock_quantity: 20, minimum_stock_level: 5, sale_price: 189.00, cost_price: 72.00, description: 'Jeans com elastano para máximo conforto.' },
      { name: 'Vestido Midi Floral Primavera', code: 'MOD-003', unit: 'UN', stock_quantity: 15, minimum_stock_level: 3, sale_price: 245.00, cost_price: 98.00, description: 'Vestido leve em viscose sustentável.' },
      { name: 'Sapato Social de Couro', code: 'MOD-004', unit: 'PAR', stock_quantity: 10, minimum_stock_level: 2, sale_price: 320.00, cost_price: 145.00, description: 'Couro legítimo com acabamento feito à mão.' }
    ],
    clients: [
      { name: 'Mariana Fashion', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Sempre compra as novidades da coleção.' },
      { name: 'Boutique revenda', client_type: 'pj', status: 'active', financial_status: 'ok', notes: 'Compra no atacado mensalmente.' }
    ]
  },
  'construction': {
    products: [
      { name: 'Cimento CP-II 50kg', code: 'MAT-001', unit: 'SACO', stock_quantity: 100, minimum_stock_level: 20, sale_price: 32.50, cost_price: 24.50, description: 'Cimento Portland composto de alta resistência.' },
      { name: 'Tijolo 8 Furos (Milheiro)', code: 'MAT-002', unit: 'MIL', stock_quantity: 5, minimum_stock_level: 2, sale_price: 850.00, cost_price: 520.00, description: 'Tijolo cerâmico para alvenaria.' },
      { name: 'Areia Média Lavada (m³)', code: 'MAT-003', unit: 'M3', stock_quantity: 10, minimum_stock_level: 3, sale_price: 110.00, cost_price: 45.00, description: 'Areia limpa para contrapiso e reboco.' },
      { name: 'Vergalhão CA-50 10mm', code: 'MAT-004', unit: 'BARRA', stock_quantity: 50, minimum_stock_level: 10, sale_price: 78.00, cost_price: 42.00, description: 'Barra de 12 metros para estruturas.' }
    ],
    clients: [
      { name: 'Mestre de Obras Wilson', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Indica a loja para todos os seus clientes.' },
      { name: 'Construtora Edificar', client_type: 'pj', status: 'active', financial_status: 'ok', notes: 'Conta faturada mensalmente.' }
    ]
  },
  'pet_shop': {
    products: [
      { name: 'Ração Golden Adulto 15kg', code: 'PET-001', unit: 'UN', stock_quantity: 15, minimum_stock_level: 5, sale_price: 165.00, cost_price: 112.00, description: 'Alimento premium para cães adultos.' },
      { name: 'Banho e Tosa (Porte M)', code: 'SRV-002', unit: 'SRV', stock_quantity: 999, minimum_stock_level: 0, sale_price: 90.00, cost_price: 15.00, description: 'Serviço completo com hidratação.' },
      { name: 'Brinquedo Mordedor Interativo', code: 'PET-003', unit: 'UN', stock_quantity: 24, minimum_stock_level: 6, sale_price: 45.00, cost_price: 12.50, description: 'Borracha atóxica de alta resistência.' },
      { name: 'Antipulgas Bravecto 10-20kg', code: 'PET-004', unit: 'UN', stock_quantity: 8, minimum_stock_level: 2, sale_price: 210.00, cost_price: 155.00, description: 'Proteção por 12 semanas.' }
    ],
    clients: [
      { name: 'Alisson e Totó', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Totó é alérgico a shampoos com perfume.' },
      { name: 'ONG Patas Felizes', client_type: 'pj', status: 'active', financial_status: 'ok', notes: 'Parceiro para adoção e resgates.' }
    ]
  },
  'market': {
    products: [
      { name: 'Arroz Tipo 1 - 5kg', code: 'ALM-001', unit: 'UN', stock_quantity: 40, minimum_stock_level: 10, sale_price: 29.90, cost_price: 21.00, description: 'Arroz agulhinha de alta qualidade.' },
      { name: 'Feijão Carioca 1kg', code: 'ALM-002', unit: 'UN', stock_quantity: 60, minimum_stock_level: 15, sale_price: 8.50, cost_price: 4.20, description: 'Feijão novo, fácil cozimento.' },
      { name: 'Óleo de Soja 900ml', code: 'ALM-003', unit: 'UN', stock_quantity: 36, minimum_stock_level: 12, sale_price: 7.20, cost_price: 5.10, description: 'Óleo vegetal refinado.' },
      { name: 'Leite Integral UHT 1L', code: 'ALM-004', unit: 'UN', stock_quantity: 120, minimum_stock_level: 24, sale_price: 5.50, cost_price: 3.80, description: 'Leite integral tipo A.' }
    ],
    clients: [
      { name: 'Dona Benta (Vizinha)', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Cliente antiga do bairro.' },
      { name: 'Lanchonete Central', client_type: 'pj', status: 'active', financial_status: 'ok', notes: 'Compra ingredientes diariamente.' }
    ]
  },
  'beauty_salon': {
    products: [
      { name: 'Corte de Cabelo Feminino', code: 'SRV-001', unit: 'SRV', stock_quantity: 999, minimum_stock_level: 0, sale_price: 80.00, cost_price: 0, description: 'Corte com lavagem e secagem inclusas.' },
      { name: 'Coloração Completa', code: 'SRV-002', unit: 'SRV', stock_quantity: 999, minimum_stock_level: 0, sale_price: 150.00, cost_price: 45.00, description: 'Aplicação de tintura premium.' },
      { name: 'Manicure + Pedicure', code: 'SRV-003', unit: 'SRV', stock_quantity: 999, minimum_stock_level: 0, sale_price: 65.00, cost_price: 10.00, description: 'Serviço completo de unhas.' },
      { name: 'Shampoo Pós-Química 500ml', code: 'PC-004', unit: 'UN', stock_quantity: 12, minimum_stock_level: 3, sale_price: 85.00, cost_price: 38.00, description: 'Linha profissional para manutenção em casa.' }
    ],
    clients: [
      { name: 'Gisele B.', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Faz luzes a cada 3 meses.' },
      { name: 'Carla Silva', client_type: 'pf', status: 'active', financial_status: 'ok', notes: 'Vem toda sexta para manicure.' }
    ]
  }
};

export class SampleDataSeeder {
  /**
   * Seeds sample data for a user based on their active profile.
   * @param profileId The business profile ID (e.g., 'bakery', 'mechanic')
   * @param userId The Supabase User ID
   */
  static async seed(profileId: string, userId: string): Promise<boolean> {
    try {
      console.log(`Starting seeding for profile: ${profileId}...`);

      // 1. Check if already seeded (precautionary)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('has_seeded_data')
        .eq('id', userId)
        .single();

      if (profileData?.has_seeded_data) {
        console.log('User already has seeded data. Skipping.');
        return true;
      }

      // 2. Get sample data template
      const template = SAMPLE_DATA_MAP[profileId] || SAMPLE_DATA_MAP['bakery']; // Fallback to bakery

      // 3. Insert Products
      if (template.products && template.products.length > 0) {
        const productPayloads = template.products.map(p => ({
          ...p,
          price: p.sale_price, // Map to DB column name
          sale_price: undefined, // Remove frontend-name
          user_id: userId // Association might be needed depending on RLS
        }));
        
        // Remove undefined keys
        productPayloads.forEach(p => {
            Object.keys(p).forEach(key => (p as any)[key] === undefined && delete (p as any)[key]);
        });

        const { error: pError } = await supabase
          .from('products')
          .insert(productPayloads);

        if (pError) throw pError;
      }

      // 4. Insert Clients
      if (template.clients && template.clients.length > 0) {
        const clientPayloads = template.clients.map(c => ({
          ...c,
          user_id: userId // Association might be needed
        }));

        const { error: cError } = await supabase
          .from('clients')
          .insert(clientPayloads);

        if (cError) throw cError;
      }

      // 5. Mark as seeded in profile
      const { error: upError } = await supabase
        .from('profiles')
        .update({ has_seeded_data: true })
        .eq('id', userId);

      if (upError) {
        console.warn('Could not update has_seeded_data flag. This might be due to missing column. Error:', upError);
        // We don't throw here to not break the flow if the migration hasn't run yet
      }

      console.log('Seeding completed successfully!');
      return true;
    } catch (error) {
      console.error('CRITICAL: Sample Data Seeding Failed!', error);
      return false;
    }
  }

  /**
   * Clears all data for a user (useful for "Start from scratch" feature)
   */
  static async clearUserContent(userId: string): Promise<boolean> {
     // This would typically involve deleting from products, clients, sales, etc.
     // For now, it's a placeholder for future implementation.
     console.log(`Clearing content for user ${userId}...`);
     return true;
  }
}
