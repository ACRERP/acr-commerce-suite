-- Create inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('entry', 'exit')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(20) CHECK (reference_type IN ('sale', 'purchase', 'adjustment', 'return')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);

-- Create RLS policies
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view inventory transactions
CREATE POLICY "Inventory transactions are viewable by authenticated users"
ON inventory_transactions FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Users can create inventory transactions
CREATE POLICY "Authenticated users can create inventory transactions"
ON inventory_transactions FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- Policy: Users can update their own inventory transactions
CREATE POLICY "Users can update their own inventory transactions"
ON inventory_transactions FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- Policy: Users can delete their own inventory transactions
CREATE POLICY "Users can delete their own inventory transactions"
ON inventory_transactions FOR DELETE
USING (
  auth.role() = 'authenticated' AND
  created_by = auth.uid()
);

-- Create function to automatically update product stock
CREATE OR REPLACE FUNCTION update_product_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add or subtract from product stock based on transaction type
    UPDATE products 
    SET stock_quantity = CASE 
      WHEN NEW.transaction_type = 'entry' THEN stock_quantity + NEW.quantity
      WHEN NEW.transaction_type = 'exit' THEN GREATEST(0, stock_quantity - NEW.quantity)
    END
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Calculate the difference and adjust stock accordingly
    DECLARE
      quantity_diff INTEGER;
    BEGIN
      quantity_diff := NEW.quantity - OLD.quantity;
      IF quantity_diff != 0 THEN
        UPDATE products 
        SET stock_quantity = CASE 
          WHEN quantity_diff > 0 THEN stock_quantity + quantity_diff
          WHEN quantity_diff < 0 THEN GREATEST(0, stock_quantity + quantity_diff)
        END
        WHERE id = NEW.product_id;
      END IF;
      RETURN NEW;
    END;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the stock change
    UPDATE products 
    SET stock_quantity = CASE 
      WHEN OLD.transaction_type = 'entry' THEN GREATEST(0, stock_quantity - OLD.quantity)
      WHEN OLD.transaction_type = 'exit' THEN stock_quantity + OLD.quantity
    END
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update product stock
DROP TRIGGER IF EXISTS inventory_transaction_trigger ON inventory_transactions;
CREATE TRIGGER inventory_transaction_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_transaction();

-- Add comments
COMMENT ON TABLE inventory_transactions IS 'Tracks all inventory movements for products';
COMMENT ON COLUMN inventory_transactions.transaction_type IS 'Type of transaction: entry (stock in) or exit (stock out)';
COMMENT ON COLUMN inventory_transactions.reference_id IS 'Optional reference to related record (sale, purchase, etc.)';
COMMENT ON COLUMN inventory_transactions.reference_type IS 'Type of reference: sale, purchase, adjustment, or return';
