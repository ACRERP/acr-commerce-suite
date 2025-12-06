
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing connection to:', supabaseUrl);
    
    // Test Insert
    console.log('Attempting insert...');
    const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert({
            description: 'Test Script Transaction',
            amount: 10.00,
            type: 'income',
            status: 'completed',
            date: new Date().toISOString()
        })
        .select()
        .single();
    
    if (insertError) {
        console.error('Insert Error:', JSON.stringify(insertError, null, 2));
    } else {
        console.log('Insert Success:', insertData);
    }
}

test();
