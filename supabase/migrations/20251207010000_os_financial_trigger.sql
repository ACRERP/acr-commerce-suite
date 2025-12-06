-- Trigger to automatically create financial transaction (Accounts Receivable)
-- when a Service Order is completed

CREATE OR REPLACE FUNCTION generate_os_receivable()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate receivable when status changes TO 'concluida' or 'entregue'
  -- AND there's a final_value > 0
  IF (NEW.status IN ('concluida', 'entregue') 
      AND (OLD.status IS NULL OR OLD.status NOT IN ('concluida', 'entregue'))
      AND NEW.final_value > 0) THEN
    
    -- Insert transaction as Accounts Receivable
    INSERT INTO transactions (
      description,
      amount,
      type,
      category,
      status,
      date,
      due_date,
      payment_method
    ) VALUES (
      'OS #' || NEW.id || ' - ' || COALESCE((SELECT name FROM clients WHERE id = NEW.client_id), 'Cliente'),
      NEW.final_value,
      'income',
      'Serviços',
      CASE 
        WHEN NEW.payment_status = 'paid' THEN 'completed'
        WHEN NEW.payment_status = 'partially_paid' THEN 'pending'
        ELSE 'pending'
      END,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days', -- Default 30 days due date
      NEW.payment_method
    );
    
    -- Log in service order history
    INSERT INTO service_order_history (
      service_order_id,
      previous_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Conta a Receber gerada automaticamente'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_os_completion_generate_receivable ON service_orders;

CREATE TRIGGER on_os_completion_generate_receivable
AFTER UPDATE ON service_orders
FOR EACH ROW
EXECUTE FUNCTION generate_os_receivable();
