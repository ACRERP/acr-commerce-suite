
-- Trigger Function to handle Stock Updates for OS Items
CREATE OR REPLACE FUNCTION handle_os_item_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT (Consumption)
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.item_type = 'part' AND NEW.product_id IS NOT NULL) THEN
        -- Decrement Stock (Direct update to avoid 'sale' type in decrement_stock function)
        UPDATE products 
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;

        -- Log Movement
        INSERT INTO stock_movements (
            product_id, 
            quantity_change, 
            new_stock_level, 
            movement_type, 
            description, 
            user_id
        )
        VALUES (
            NEW.product_id,
            -NEW.quantity,
            (SELECT stock_quantity FROM products WHERE id = NEW.product_id),
            'service_use',
            'Used in OS #' || NEW.service_order_id,
            auth.uid() -- Might be null if via trigger? No, auth.uid() usually works in RLS context.
        );
    END IF;
    RETURN NEW;
  
  -- Handle DELETE (Refund/Correction)
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.item_type = 'part' AND OLD.product_id IS NOT NULL) THEN
        -- Increment Stock
        UPDATE products 
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;

        -- Log Movement
        INSERT INTO stock_movements (
            product_id, 
            quantity_change, 
            new_stock_level, 
            movement_type, 
            description, 
            user_id
        )
        VALUES (
            OLD.product_id,
            OLD.quantity,
            (SELECT stock_quantity FROM products WHERE id = OLD.product_id),
            'service_return',
            'Returned from OS #' || OLD.service_order_id,
            auth.uid()
        );
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger for INSERT and DELETE
DROP TRIGGER IF EXISTS on_os_item_stock_change ON service_order_items;

CREATE TRIGGER on_os_item_stock_change
AFTER INSERT OR DELETE ON service_order_items
FOR EACH ROW
EXECUTE FUNCTION handle_os_item_stock();
