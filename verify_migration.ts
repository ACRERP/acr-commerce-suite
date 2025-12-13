
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    const { data: products, error } = await supabase
        .from('products')
        .select('name, category, price')
        .limit(10);

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('## Verification: Products Sample');
    console.table(products);

    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`Total Products in DB: ${count}`);
}

verify();
