
-- Add condition field to service_orders
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS condition TEXT;
