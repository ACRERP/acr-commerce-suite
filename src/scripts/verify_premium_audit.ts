
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPremiumAudit() {
  console.log('🛡️  Starting Premium Audit Verification (The Shield)...');

  // 1. Create a Test Product
  const randomSuffix = Math.floor(Math.random() * 10000);
  const testProduct = {
    name: `Test Product ${randomSuffix}`,
    description: 'Automated Audit Item',
    sku: `TEST-${randomSuffix}`,
    price: 150.00,
    cost_price: 100.00,
    stock_quantity: 10,
    minimum_stock_level: 5 
    // Add other required fields if any. Assuming minimal schema.
  };
  
  // NOTE: Inserting into 'products'. Adjust fields if schema differs (e.g. 'code', 'barcode').
  // We'll try to insert with minimal fields and see.
  const { data: product, error: prodError } = await supabase
    .from('products')
    .insert(testProduct)
    .select()
    .single();

  if (prodError) {
    console.error('❌ Failed to create test product:', prodError.message);
    process.exit(1);
  }
  console.log(`✅ Test Product Created: ${product.name} (Stock: ${product.stock_quantity})`);

  // 2. Create a Mock User (if needed for sales) or use existing.
  // We'll just pick the first user found or a specific ID if known.
  // For 'audit' logs or relationships, usually a user_id is required.
  // We'll try to fetch one.
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  // ADMIN API might be restricted or keys might be anon.
  // If anon key, we can't list users.
  // We'll try to perform the sale with a hardcoded ID or NULL if allowed.
  // BUT the trigger might need a valid user.
  // Workaround: We will use the 'anon' flow but we need a valid user_id for the foreign key if it's strictly enforced.
  // "sales.user_id" is usually FK to auth.users.
  // If we can't get a user, we might fail.
  // Let's assume there is at least one public profile or we can spoof it? No.
  // Let's rely on the user having run the app and logged in? No.
  // We will try to fetch from 'profiles' or 'users' table if public?
  // Let's try to proceed. If sales require user_id, we might need to skip this or mock it better.
  // Actually, usually RLS policies apply.
  
  // Let's just try to insert a Sale.
  // If it needs authentication, this script might fail unless we sign in.
  // We will attempt to sign in as a test user if possible, or skip auth if RLS is disabled (unlikely for Premium).
  
  // Simpler approach: Just check if the functions exist? 
  // No, we want to run them.
  
  console.log('⚠️  Skipping User Auth (Running as Anon/Service Role if configured)...');

  // 3. Perform a Sale (Status: 'concluida')
  const salePayload = {
    total_amount: 150.00,
    payment_method: 'dinheiro', // Checks case sensitivity? usually lowercase.
    status: 'concluida', // This triggers the Cash Flow logic
    created_at: new Date().toISOString()
    // user_id: ???
    // client_id: ???
  };

  // We need a user_id. Let's try to find one from 'sales' history if any.
  const { data: existingSale } = await supabase.from('sales').select('user_id').limit(1).maybeSingle();
  if (existingSale?.user_id) {
      // @ts-ignore
      salePayload.user_id = existingSale.user_id;
  } else {
      console.log('⚠️  No existing sales found to grab a User ID. Trying to proceed without...');
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(salePayload)
    .select()
    .single();

  if (saleError) {
    console.error('❌ Failed to create Sale:', saleError.message);
    // If RLS fails, we know.
    process.exit(1);
  }
  console.log(`✅ Sale Created: #${sale.id} (Status: ${sale.status})`);

  // 4. Add Item to Sale (This triggers Stock Deduction)
  const itemPayload = {
    sale_id: sale.id,
    product_id: product.id,
    quantity: 1,
    unit_price: 150.00,
    subtotal: 150.00
  };

  const { error: itemError } = await supabase
    .from('sale_items')
    .insert(itemPayload);

  if (itemError) {
    console.error('❌ Failed to add Sale Item:', itemError.message);
    process.exit(1);
  }
  console.log(`✅ Sale Item Added: 1x ${product.name}`);

  // 5. VERIFY STOCK DEDUCTION
  const { data: updatedProduct } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', product.id)
    .single();

  if (updatedProduct.stock_quantity === 9) {
     console.log('✅ PASS: Stock deduction verified (10 -> 9).');
  } else {
     console.error(`❌ FAIL: Stock deduction failed. Expected 9, got ${updatedProduct.stock_quantity}.`);
  }

  // 6. VERIFY CASH FLOW ENTRY
  const { data: cashFlow } = await supabase
    .from('cash_flow')
    .select('*')
    .eq('reference_id', sale.id)
    .eq('reference_type', 'sale')
    .single();

  if (cashFlow) {
     console.log(`✅ PASS: Cash Flow entry verified (Amount: ${cashFlow.amount}, Type: ${cashFlow.type}).`);
  } else {
     console.error('❌ FAIL: Cash Flow entry NOT found.');
  }

  // 7. CLEANUP
  console.log('🧹 Cleaning up test data...');
  await supabase.from('sale_items').delete().eq('sale_id', sale.id);
  await supabase.from('sales').delete().eq('id', sale.id);
  await supabase.from('products').delete().eq('id', product.id);
  // Cash flow should cascade delete? Or trigger? 
  // If not cascading, we might leave trash. 
  // Ideally we assume CASCADE on reference.
  // Checking cleanup
  const { data: checkClean } = await supabase.from('cash_flow').select('id').eq('reference_id', sale.id).eq('reference_type', 'sale');
  if (checkClean && checkClean.length > 0) {
      console.log('⚠️  Cash flow entries remained. Deleting manually...');
      await supabase.from('cash_flow').delete().eq('reference_id', sale.id).eq('reference_type', 'sale');
  }

  console.log('🎉 Verification Complete.');
}

verifyPremiumAudit().catch(console.error);
