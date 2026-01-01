/**
 * ACR Commerce Suite - License Key Generator
 * Use this script to generate activation keys for your customers.
 * 
 * Usage: node scripts/generate-license.js [company_name] [days_valid]
 */

import crypto from 'crypto';

const SIGN_SALT = 'acr_erp_2026_secure_shield_v1';

function generateKey(id, salt) {
    const data = `${id}-${salt}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const base = Math.abs(hash).toString(36).toUpperCase();
    return base.padEnd(16, 'X').substring(0, 16).match(/.{1,4}/g).join('-');
}

const args = process.argv.slice(2);
const company = args[0] || 'DEMO';
const days = parseInt(args[1]) || 30;

const timestamp = Date.now().toString(36).toUpperCase();
const rawKey = generateKey(`${company}-${timestamp}`, SIGN_SALT);

console.log('\n==========================================');
console.log('       ACR ERP - GERADOR DE LICENÇA       ');
console.log('==========================================');
console.log(`Empresa:    ${company}`);
console.log(`Validade:   ${days} dias`);
console.log(`Data:       ${new Date().toLocaleDateString()}`);
console.log('------------------------------------------');
console.log(`CHAVE DE ATIVAÇÃO: \x1b[32m${rawKey}\x1b[0m`);
console.log('==========================================\n');
console.log('Dica: Copie a chave acima e envie ao cliente.');
