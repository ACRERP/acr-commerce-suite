-- Migration: Real Inventory Module
-- Adds movement tracking and balance management

-- Ensure uuid-ossp is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create inventory movements table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'production')),
    quantity DECIMAL(12, 4) NOT NULL,

    price_unit DECIMAL(12, 2),
    total_value DECIMAL(12, 2),
    document_ref VARCHAR(100), -- Invoice number, sale ID, or production ID
    reason TEXT,
    location VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- 2. Add stock_quantity column to products if not exists (Usually it exists, but just in case)
-- Note: The system primarily uses 'stock_quantity'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'stock_quantity') THEN
        ALTER TABLE public.products ADD COLUMN stock_quantity DECIMAL(12, 4) DEFAULT 0;
    END IF;
END $$;

-- 3. Trigger function to update product stock on movement
CREATE OR REPLACE FUNCTION fn_update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'in' OR NEW.type = 'production') THEN
            UPDATE public.products SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity WHERE id = NEW.product_id;
        ELSIF (NEW.type = 'out') THEN
            UPDATE public.products SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity WHERE id = NEW.product_id;
        ELSIF (NEW.type = 'adjustment') THEN
            -- In adjustment, quantity is the DELTA. Pos for adding, neg for removing.
            UPDATE public.products SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity WHERE id = NEW.product_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS tr_inventory_movement_update_stock ON public.inventory_movements;
CREATE TRIGGER tr_inventory_movement_update_stock
AFTER INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION fn_update_product_stock();
