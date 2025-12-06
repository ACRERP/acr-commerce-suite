
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bcwofzavgafqonogowqf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('--- Isolation Test ---');
    
    // 1. Test Service Orders ONLY
    console.log('1. Testing Service Orders ONLY...');
    const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select('id')
        .limit(1);

    if (osError) {
        console.error('FAIL: Service Orders Error:', osError.message);
    } else {
        console.log('PASS: Service Orders Access OK');
    }

    // 2. Test Clients ONLY
    console.log('2. Testing Clients ONLY...');
    const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

    if (clientError) {
        console.error('FAIL: Clients Error:', clientError.message);
    } else {
        console.log('PASS: Clients Access OK');
    }

   // 3. Test Profiles Direct Access (to check if IT is the problem)
    console.log('3. Testing Profiles Direct Access...');
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

    if (profileError) {
        console.error('FAIL: Profiles Error:', profileError.message);
    } else {
        console.log('PASS: Profiles Access OK');
    }
}

test();
