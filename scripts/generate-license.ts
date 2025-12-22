/**
 * Script para Gerar Licenças do ACR Commerce Suite
 * 
 * Uso:
 * node scripts/generate-license.js
 * 
 * Ou com parâmetros:
 * node scripts/generate-license.js --email="cliente@email.com" --name="João Silva" --days=365
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Chave de serviço (admin) - NÃO compartilhar
);

interface LicenseOptions {
  customerEmail?: string;
  customerName?: string;
  purchasePlatform?: 'mercadolivre' | 'shopee' | 'direto';
  purchaseId?: string;
  maxActivations?: number;
  expiresInDays?: number;
  licenseType?: 'trial' | 'standard' | 'premium' | 'enterprise';
}

/**
 * Gerar uma única licença
 */
async function generateLicense(options: LicenseOptions = {}) {
  try {
    // Gerar chave única (formato: XXXX-XXXX-XXXX-XXXX)
    const segments = Array.from({ length: 4 }, () => 
      crypto.randomBytes(2).toString('hex').toUpperCase()
    );
    const licenseKey = segments.join('-');

    // Calcular data de expiração
    const expiresAt = options.expiresInDays
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Inserir no banco
    const { data, error } = await supabase.from('licenses').insert({
      license_key: licenseKey,
      customer_email: options.customerEmail,
      customer_name: options.customerName,
      purchase_platform: options.purchasePlatform,
      purchase_id: options.purchaseId,
      max_activations: options.maxActivations || 1,
      expires_at: expiresAt,
      license_type: options.licenseType || 'standard',
    }).select().single();

    if (error) {
      console.error('❌ Erro ao gerar licença:', error.message);
      return null;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ LICENÇA GERADA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`📋 Chave: ${licenseKey}`);
    console.log(`👤 Cliente: ${options.customerName || 'N/A'}`);
    console.log(`📧 Email: ${options.customerEmail || 'N/A'}`);
    console.log(`🏪 Plataforma: ${options.purchasePlatform || 'N/A'}`);
    console.log(`📅 Expira em: ${expiresAt ? expiresAt.toLocaleDateString('pt-BR') : 'Nunca'}`);
    console.log(`💻 Máx. Instalações: ${options.maxActivations || 1}`);
    console.log(`🎫 Tipo: ${options.licenseType || 'standard'}`);
    console.log('='.repeat(60) + '\n');

    return data;
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return null;
  }
}

/**
 * Gerar múltiplas licenças em lote
 */
async function generateBulkLicenses(count: number, options: LicenseOptions = {}) {
  console.log(`\n🚀 Gerando ${count} licenças...\n`);
  
  const licenses = [];
  const failed = [];
  
  for (let i = 0; i < count; i++) {
    const license = await generateLicense(options);
    if (license) {
      licenses.push(license.license_key);
    } else {
      failed.push(i + 1);
    }
    // Aguardar um pouco entre gerações para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Salvar em arquivo CSV
  const fs = await import('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `licenses_${timestamp}.csv`;
  
  const csv = [
    'Chave,Status,Data Geração,Tipo,Expira Em,Max Instalações',
    ...licenses.map(key => {
      const expiresAt = options.expiresInDays 
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
        : 'Nunca';
      return `${key},Não ativada,${new Date().toLocaleDateString('pt-BR')},${options.licenseType || 'standard'},${expiresAt},${options.maxActivations || 1}`;
    })
  ].join('\n');
  
  fs.writeFileSync(filename, csv);
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${licenses.length} licenças geradas com sucesso!`);
  if (failed.length > 0) {
    console.log(`❌ ${failed.length} licenças falharam`);
  }
  console.log(`📄 Salvo em: ${filename}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Processar argumentos da linha de comando
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options: any = {};
  
  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    options[key] = value;
  });
  
  return options;
}

/**
 * Função principal
 */
async function main() {
  const args = parseArgs();
  
  // Verificar se tem SUPABASE_SERVICE_KEY
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: SUPABASE_SERVICE_KEY não encontrada no .env');
    console.log('\n💡 Adicione ao arquivo .env:');
    console.log('SUPABASE_SERVICE_KEY=sua_chave_de_servico_aqui\n');
    process.exit(1);
  }
  
  if (args.bulk) {
    // Geração em lote
    await generateBulkLicenses(parseInt(args.bulk), {
      maxActivations: parseInt(args.activations) || 1,
      expiresInDays: parseInt(args.days),
      licenseType: args.type as any || 'standard',
    });
  } else {
    // Geração única
    await generateLicense({
      customerName: args.name,
      customerEmail: args.email,
      purchasePlatform: args.platform as any,
      purchaseId: args.purchaseId,
      maxActivations: parseInt(args.activations) || 1,
      expiresInDays: parseInt(args.days),
      licenseType: args.type as any || 'standard',
    });
  }
}

// Executar
main().catch(console.error);

/**
 * EXEMPLOS DE USO:
 * 
 * 1. Gerar uma licença simples:
 *    node scripts/generate-license.js
 * 
 * 2. Gerar licença com dados do cliente:
 *    node scripts/generate-license.js --name="João Silva" --email="joao@email.com" --days=365
 * 
 * 3. Gerar licença de venda do Mercado Livre:
 *    node scripts/generate-license.js --name="Maria" --email="maria@email.com" --platform=mercadolivre --purchaseId=ML123456 --days=365
 * 
 * 4. Gerar 100 licenças em lote:
 *    node scripts/generate-license.js --bulk=100 --days=365 --type=standard
 * 
 * 5. Gerar licença premium com 3 instalações:
 *    node scripts/generate-license.js --type=premium --activations=3 --days=365
 */
