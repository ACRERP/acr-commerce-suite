
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertClient() {
    console.log('Inserting Test Client...');
    
    const client = {
        name: 'Cliente Teste Script',
        phone: '11999999999',
        cpf_cnpj: '86450917024', // Valid CPF
        address: 'Rua Teste, 123'
    };

    const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

    if (error) {
        console.error('Insert Client Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert Client Success:', data);
    }
}

insertClient();
