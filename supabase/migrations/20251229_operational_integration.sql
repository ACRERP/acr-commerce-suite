-- Migration: Operational Integration (Sales & OS -> Inventory)
-- Consolidates stock logic into the inventory_movements table via triggers

-- 1. Trigger for Sales (sale_items)
CREATE OR REPLACE FUNCTION fn_sale_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_operator_id UUID;
BEGIN
    -- Get operator from parent sale
    SELECT operator_id INTO v_operator_id FROM public.sales WHERE id = NEW.sale_id;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.inventory_movements (
            product_id,
            type,
            quantity,
            price_unit,
            total_value,
            document_ref,
            reason,
            created_by
        ) VALUES (
            NEW.product_id,
            'out',
            NEW.quantity,
            NEW.price,
            NEW.subtotal,
            'SALE-' || NEW.sale_id,
            'Venda PDV #' || NEW.sale_id,
            v_operator_id
        );
    ELSIF (TG_OP = 'DELETE') THEN
        -- Reverse movement (Sale Cancel/Item Remove)
        -- We insert an 'in' movement to put items back
        INSERT INTO public.inventory_movements (
            product_id,
            type,
            quantity,
            price_unit,
            total_value,
            document_ref,
            reason
        ) VALUES (
            OLD.product_id,
            'in',
            OLD.quantity,
            OLD.price,
            OLD.subtotal,
            'SALE-CANCEL-' || OLD.sale_id,
            'Estorno Venda #' || OLD.sale_id
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sale_item_stock ON public.sale_items;
CREATE TRIGGER tr_sale_item_stock
AFTER INSERT OR DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION fn_sale_stock_movement();

-- 2. Trigger for Service Orders (service_order_parts)
CREATE OR REPLACE FUNCTION fn_os_part_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.inventory_movements (
            product_id,
            type,
            quantity,
            price_unit,
            total_value,
            document_ref,
            reason
        ) VALUES (
            NEW.produto_id, -- Note: OS table uses 'produto_id'
            'out', -- Parts consumed
            NEW.quantidade, -- Note: OS table uses 'quantidade'
            NEW.valor_unitario,
            NEW.valor_total,
            'OS-' || NEW.service_order_id,
            'Peça em OS #' || NEW.service_order_id
        );
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.inventory_movements (
            product_id,
            type,
            quantity,
            price_unit,
            total_value,
            document_ref,
            reason
        ) VALUES (
            OLD.produto_id,
            'in', -- Parts returned
            OLD.quantidade,
            OLD.valor_unitario,
            OLD.valor_total,
            'OS-Part-CANCEL-' || OLD.service_order_id,
            'Retorno Peça OS #' || OLD.service_order_id
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_os_part_stock ON public.service_order_parts;
CREATE TRIGGER tr_os_part_stock
AFTER INSERT OR DELETE ON public.service_order_parts
FOR EACH ROW
EXECUTE FUNCTION fn_os_part_stock_movement();
