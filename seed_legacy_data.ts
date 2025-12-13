
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Client (Verify environment variables are loaded in your terminal or .env)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'; 
// Note: For seeding, you might need SERVICE_ROLE_KEY if RLS is enabled and blocking inserts. 
// Assuming client-side insert is allowed or user is authenticated. 
// For this script to run standalone, it might be better to use the service role key if available, 
// or ensure the anon key has permissions. 

const supabase = createClient(supabaseUrl, supabaseKey);

const FILE_PATH = 'BancoDeDados.xlsx';

function deriveCategory(name: string): string {
    if (!name) return 'Outros';
    const firstWord = name.trim().split(' ')[0];
    // Ensure Title Case (e.g. "tela" -> "Tela")
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

async function seedData() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        return;
    }

    const workbook = XLSX.readFile(FILE_PATH);

    // 1. MIGRATE CLIENTS
    if (workbook.Sheets['Clientes']) {
        const clients = XLSX.utils.sheet_to_json(workbook.Sheets['Clientes']);
        console.log(`Processing ${clients.length} clients...`);

        for (const c of clients as any[]) {
            const { error } = await supabase.from('clients').upsert({
                name: c.Nome,
                cpf_cnpj: c.CNPJ_CPF?.replace(/\D/g, ''), // Correct column: cpf_cnpj
                phone: c.Telefone,
                address: c.EnderecoPrincipal,
                credit_limit: c.LimiteCredito,
                notes: c.TipoCliente,
                client_type: c.CNPJ_CPF?.length > 14 ? 'PJ' : 'PF', // Uppercase for constraint
                status: 'active'
            }, { onConflict: 'cpf_cnpj' });
            
            if (error) console.error(`Error inserting client ${c.Nome}:`, error.message);
        }
    }

    // 2. MIGRATE PRODUCTS with CATEGORIZATION
    if (workbook.Sheets['CatálogoProdutos']) {
        const products = XLSX.utils.sheet_to_json(workbook.Sheets['CatálogoProdutos']);
        console.log(`Processing ${products.length} products...`);

        for (const p of products as any[]) {
            const derivedCategory = deriveCategory(p['Nome do Produto']);
            
            const { error } = await supabase.from('products').upsert({
                name: p['Nome do Produto'],
                price: p['Preço'], // Actual column is 'price'
                brand: p['Marca'],
                code: p['Código'],
                description: p['Descrição'],
                category: derivedCategory, // Smart categorization
                stock_quantity: p['Estoque'] || 0,
                // normalized image path logic could go here
            }, { onConflict: 'code' });

            if (error) {
                 // Try inserting without onConflict if code is not unique constraint, or log error
                 console.error(`Error inserting product ${p['Nome do Produto']}:`, error.message);
            }
        }
    }

    // 3. MIGRATE DELIVERY MEN
    if (workbook.Sheets['Motoboys']) {
         const motoboys = XLSX.utils.sheet_to_json(workbook.Sheets['Motoboys']);
         console.log(`Processing ${motoboys.length} delivery men...`);
         
         for (const m of motoboys as any[]) {
             const { error } = await supabase.from('delivery_men').upsert({
                 name: m.Nome,
                 phone: m.Telefone ? String(m.Telefone) : null,
                 status: m.Status === 'Ativo' ? 'available' : 'unavailable', // Mapping status
                 active: m.Status === 'Ativo'
             }); // Add onConflict if possible, e.g., phone
             
             if (error) console.error(`Error delivery man ${m.Nome}:`, error.message);
         }
    }

    console.log('Migration completed!');
}

seedData();
