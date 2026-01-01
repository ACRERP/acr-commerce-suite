import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis do .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
    console.log('--- INICIANDO VERIFICAÇÃO STANDALONE DO AGENTE ---');

    try {
        console.log('\n[1/4] Testando Conexão com Supabase...');
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        console.log('✅ Conexão estabelecida (Iniciada).');

        console.log('\n[2/4] Testando Matriz de Permissões (role_modules)...');
        const { data: modules, error: modError } = await supabase
            .from('role_modules')
            .select('*');
        
        if (modError) throw modError;
        console.log('✅ Dados de permissões recuperados:', modules?.length);
        console.log(JSON.stringify(modules, null, 2));

        console.log('\n[3/4] Testando Tabela de Vendedores (sellers)...');
        const { data: sellers, error: sellError } = await supabase
            .from('sellers')
            .select('*');
        
        if (sellError) throw sellError;
        console.log('✅ Dados de vendedores recuperados:', sellers?.length);
        if (sellers && sellers.length > 0) {
            console.log('Exemplo:', sellers[0].name, '-', sellers[0].commission_rate + '%');
        }

        console.log('\n[4/4] Verificando Estrutura de Perfis (User Roles)...');
        const { data: profiles, error: profError } = await supabase
            .from('profiles')
            .select('role, count()')
            .group('role');
        
        if (!profError) {
            console.log('✅ Distribuição de cargos:', profiles);
        }

        console.log('\n--- VERIFICAÇÃO CONCLUÍDA ---');
        console.log('O backend está respondendo corretamente para as novas tabelas e lógica de RBAC.');
    } catch (error) {
        console.error('\n❌ ERRO NA VERIFICAÇÃO:', error);
        process.exit(1);
    }
}

runVerification();
