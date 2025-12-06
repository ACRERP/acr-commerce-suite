# Manual Financial Generation Test

Test the automatic accounts receivable generation when completing a Service Order.

## Test Procedure

### 1. Check Initial Transactions
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM transactions WHERE category = 'Serviços';
```
Note the count.

### 2. Create and Complete a Service Order
```sql
-- Create a test service order with financial value
INSERT INTO service_orders (
  client_id, 
  device_type, 
  reported_issue, 
  status,
  final_value,
  payment_status,
  payment_method
)
VALUES (
  1, 
  'Test Device', 
  'Financial Integration Test', 
  'em_execucao',
  150.00,
  'pending',
  'pix'
)
RETURNING id;
-- Note the returned OS ID (e.g., #456)

-- Now mark it as completed (this should trigger the receivable generation)
UPDATE service_orders 
SET status = 'concluida' 
WHERE id = 456;
```

### 3. Verify Transaction Created
```sql
-- Check if transaction was created
SELECT * FROM transactions 
WHERE description LIKE '%OS #456%'
ORDER BY created_at DESC;

-- Should show:
-- - description: 'OS #456 - [Client Name]'
-- - amount: 150.00
-- - type: 'income'
-- - category: 'Serviços'
-- - status: 'pending' (since payment_status was 'pending')
```

### 4. Verify History Logged
```sql
SELECT * FROM service_order_history 
WHERE service_order_id = 456 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- - notes: 'Conta a Receber gerada automaticamente'
```

### 5. Test with Paid Status
```sql
-- Create another OS already marked as paid
INSERT INTO service_orders (
  client_id, 
  device_type, 
  reported_issue, 
  status,
  final_value,
  payment_status,
  payment_method
)
VALUES (
  1, 
  'Test Device 2', 
  'Paid Test', 
  'em_execucao',
  200.00,
  'paid',
  'credit_card'
)
RETURNING id;
-- Note ID (e.g., #457)

-- Complete it
UPDATE service_orders SET status = 'concluida' WHERE id = 457;

-- Verify transaction status is 'completed'
SELECT status FROM transactions WHERE description LIKE '%OS #457%';
-- Should show: 'completed'
```

## Expected Results
✅ Transaction created when OS status changes to 'concluida' or 'entregue'
✅ Transaction amount matches OS final_value
✅ Transaction status reflects payment_status (pending/completed)
✅ History entry created with automatic note
✅ No duplicate transactions if status updated multiple times

## Trigger Logic
- Only fires when status **changes TO** 'concluida' or 'entregue'
- Only creates transaction if `final_value > 0`
- Maps `payment_status` to transaction `status`
- Sets default due date to 30 days from completion
