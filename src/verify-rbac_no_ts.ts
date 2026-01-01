import { rbacService } from './lib/rbac-service';
import { supabase } from './lib/supabaseClient';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

async function runVerification() {
    console.log('--- INICIANDO VERIFICAÇÃO TÉCNICA DO AGENTE ---');

    try {
        console.log('\n[1/3] Testando Conexão com Supabase...');
        const { data: authUser, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        console.log('✅ Conexão estabelecida.');

        console.log('\n[2/3] Testando RBAC Service (Role Modules)...');
        const modules = await rbacService.getRoleModules();
        console.log('✅ Permissões recuperadas:', JSON.stringify(modules, null, 2));

        console.log('\n[3/3] Testando Seller Management (Sellers)...');
        const sellers = await rbacService.listSellers();
        console.log('✅ Vendedores recuperados:', sellers.length);
        if (sellers.length > 0) {
            console.log('Primeiro vendedor encontrado:', sellers[0].name);
        }

        console.log('\n--- VERIFICAÇÃO CONCLUÍDA COM SUCESSO ---');
    } catch (error) {
        console.error('\n❌ ERRO NA VERIFICAÇÃO:', error);
        process.exit(1);
    }
}

runVerification();
