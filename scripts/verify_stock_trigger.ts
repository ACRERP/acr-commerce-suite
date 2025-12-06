
import { createClient } from '@supabase/supabase-js';

// Parse env from .env.local if possible, or just hardcode for this test since we know them
const SUPABASE_URL = 'https://bcwofzavgafqonogowqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd29memF2Z2FmcW9ub2dvd3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk1NTAsImV4cCI6MjA4MDI3NTU1MH0.5TAe4lDiyRAtNWSqC2qC1IQUcOoiBvhcUP2HWkQ6ZyA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyStockTrigger() {
  console.log("--- Starting Stock Trigger Verification ---");


  console.log("1. Creating Test Product...");
  const { data: stringifyError } = await supabase.from('products').select('*').limit(1); // just to check connection
  
  // Try to insert a test product
  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert([{
      name: 'Test Stock Product',
      stock_quantity: 100,
      price: 10.00,
      min_stock: 5
    }])
    .select()
    .single();

  if (insertError) {
    console.error("Failed to insert test product (Likely RLS):", JSON.stringify(insertError));
    // Fallback: Try to fetch existing again with error logging
    const { data: products, error: pError } = await supabase.from('products').select('id, name, stock_quantity').limit(1);
    if (pError) console.error("Fetch Error:", JSON.stringify(pError));
    if (!products?.length) {
        console.error("No products found and cannot insert.");
        return;
    }
    console.log("Using existing product: ", products[0].name);
    // Proceed with products[0]...
    var product = products[0];
  } else {
    console.log("Created Test Product:", newProduct.name);
    var product = newProduct;
  }

  const initialStock = product.stock_quantity;

  console.log(`Test Product: ${product.name} (ID: ${product.id})`);
  console.log(`Initial Stock: ${initialStock}`);

  // 2. Create Service Order
  const { data: os, error: osError } = await supabase
    .from('service_orders')
    .insert([{
      client_id: 1, // Assuming client 1 exists
      device_type: 'TestScript',
      reported_issue: 'Stock Check',
      status: 'aberta'
    }])
    .select()
    .single();

  if (osError) {
    console.error("Failed to create OS:", osError);
    return;
  }
  console.log(`Created OS #${os.id}`);

  // 3. Add Item (Part) to OS
  const qtyToUse = 2;
  const { error: itemError } = await supabase
    .from('service_order_items')
    .insert([{
      service_order_id: os.id,
      item_type: 'part',
      product_id: product.id,
      description: 'Test Part Usage',
      quantity: qtyToUse,
      unit_price: 10.00,
      total_price: 20.00
    }]);

  if (itemError) {
    console.error("Failed to add Item:", itemError);
    return;
  }
  console.log(`Added Item: Used ${qtyToUse} units of product.`);

  // 4. Check Stock Again
  const { data: productAfter, error: pErrorAfter } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', product.id)
    .single();

  if (pErrorAfter) {
    console.error("Failed to fetch product after update:", pErrorAfter);
    return;
  }

  console.log(`New Stock: ${productAfter.stock_quantity}`);
  
  if (productAfter.stock_quantity === initialStock - qtyToUse) {
    console.log("✅ SUCCESS: Stock deducted correctly!");
  } else {
    console.error("❌ FAILURE: Stock mismatch!");
    console.log(`Expected: ${initialStock - qtyToUse}, Actual: ${productAfter.stock_quantity}`);
  }

  // 5. Cleanup (Restore Stock by deleting item) - Tests the DELETE trigger
  console.log("--- Cleaning up (Deleting Item) ---");
  await supabase.from('service_order_items').delete().eq('service_order_id', os.id);
  
  const { data: productFinal } = await supabase.from('products').select('stock_quantity').eq('id', product.id).single();
  console.log(`Final Stock (After Delete): ${productFinal?.stock_quantity}`);
  
  if (productFinal?.stock_quantity === initialStock) {
     console.log("✅ SUCCESS: Stock restored correctly after delete!");
  } else {
     console.log("❌ FAILURE: Stock NOT restored!");
  }
}

verifyStockTrigger();
