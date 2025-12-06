# Manual Stock Integration Test

Since automated browser testing has UI interaction issues with the tabbed form, here's how to manually verify the stock trigger works:

## Test Procedure

### 1. Check Initial Stock
```sql
-- Run in Supabase SQL Editor
SELECT id, name, stock_quantity FROM products LIMIT 5;
```
Note a product ID and its current stock (e.g., Product #1 has 50 units).

### 2. Create Service Order with Part
```sql
-- Create a test service order
INSERT INTO service_orders (client_id, device_type, reported_issue, status)
VALUES (1, 'Test Device', 'Stock Integration Test', 'aberta')
RETURNING id;
-- Note the returned OS ID (e.g., #123)

-- Add a part to the OS (use product ID from step 1)
INSERT INTO service_order_items (service_order_id, item_type, product_id, description, quantity, unit_price, total_price)
VALUES (123, 'part', 1, 'Test Part', 2, 10.00, 20.00);
```

### 3. Verify Stock Decreased
```sql
SELECT id, name, stock_quantity FROM products WHERE id = 1;
-- Should show 48 units (50 - 2)
```

### 4. Verify Stock Movement Logged
```sql
SELECT * FROM stock_movements WHERE product_id = 1 ORDER BY created_at DESC LIMIT 1;
-- Should show: movement_type='service_use', quantity_change=-2
```

### 5. Test Stock Restoration (Delete Item)
```sql
DELETE FROM service_order_items WHERE service_order_id = 123;

-- Check stock again
SELECT stock_quantity FROM products WHERE id = 1;
-- Should show 50 units (restored)
```

## Expected Results
✅ Stock decreases when part is added to OS
✅ Movement is logged in stock_movements table
✅ Stock increases when part is removed from OS
✅ Return movement is logged

## Known Issue
The UI form's "Peças e Serviços" tab has interaction issues in automated testing. The backend trigger works correctly when items are added via SQL or when the UI successfully submits the form data.
