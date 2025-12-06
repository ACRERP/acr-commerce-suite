-- Trigger to decrement stock on sale item insert
CREATE OR REPLACE FUNCTION public.trigger_decrement_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the existing decrement function
  PERFORM public.decrement_stock(NEW.product_id, NEW.quantity);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_sale_item_insert_decrement_stock ON public.sale_items;

CREATE TRIGGER on_sale_item_insert_decrement_stock
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_decrement_stock();
