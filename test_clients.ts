
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Checking clients table...');
    
    // Test Select
    const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .limit(1);
    
    if (error) {
        console.error('Clients Check Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Clients Check Success. Found:', data.length);
        if (data.length > 0) {
            console.log('Sample client:', data[0]);
        }
    }
}

test();
