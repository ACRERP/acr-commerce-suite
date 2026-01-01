-- Migration: Real Production Module
-- Handles Technical Data Sheets (Recipes) and Production Orders

-- 1. Create Recipes (Technical Data Sheets)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id) -- One recipe per finished product
);

-- 2. Create Recipe Items (Ingredients)
CREATE TABLE IF NOT EXISTS public.recipe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    component_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE, -- The ingredient
    quantity DECIMAL(12, 4) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Production Orders
CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    quantity_planned DECIMAL(12, 4) NOT NULL,

    quantity_produced DECIMAL(12, 4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- 4. Function to automatically consume stock when production is completed
CREATE OR REPLACE FUNCTION fn_execute_production_stock_movements()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF (OLD.status <> 'completed' AND NEW.status = 'completed') THEN
        -- 1. Add the finished product to inventory
        INSERT INTO public.inventory_movements (product_id, type, quantity, reason, document_ref)
        VALUES (NEW.product_id, 'production', NEW.quantity_produced, 'Produção Finalizada', NEW.id::text);

        -- 2. Consume ingredients from stock based on the recipe
        FOR item IN (SELECT component_id, quantity FROM public.recipe_items WHERE recipe_id = NEW.recipe_id) LOOP
            INSERT INTO public.inventory_movements (product_id, type, quantity, reason, document_ref)
            VALUES (item.component_id, 'out', item.quantity * NEW.quantity_produced, 'Consumo de Insumos - OP ' || NEW.id, NEW.id::text);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
DROP TRIGGER IF EXISTS tr_production_order_stock_update ON public.production_orders;
CREATE TRIGGER tr_production_order_stock_update
AFTER UPDATE ON public.production_orders
FOR EACH ROW
EXECUTE FUNCTION fn_execute_production_stock_movements();
