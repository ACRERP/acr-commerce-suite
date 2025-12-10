-- Expand clients table with financial and detailed fields for Phase 1
-- This migration adds all necessary fields for advanced client management

-- Add new columns to clients table
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS client_type VARCHAR(10) DEFAULT 'PF' CHECK (client_type IN ('PF', 'PJ')),
  ADD COLUMN IF NOT EXISTS rg_ie VARCHAR(50),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(2),
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(10,2) DEFAULT 0 CHECK (credit_limit >= 0),
  ADD COLUMN IF NOT EXISTS credit_used DECIMAL(10,2) DEFAULT 0 CHECK (credit_used >= 0),
  ADD COLUMN IF NOT EXISTS allow_credit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_purchases DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON public.clients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_city ON public.clients(city);
CREATE INDEX IF NOT EXISTS idx_clients_credit_limit ON public.clients(credit_limit);

-- Function to calculate available credit
CREATE OR REPLACE FUNCTION get_client_available_credit(client_id_param BIGINT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  available_credit DECIMAL(10,2);
BEGIN
  SELECT (credit_limit - credit_used) INTO available_credit
  FROM public.clients
  WHERE id = client_id_param;
  
  RETURN COALESCE(available_credit, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update client credit usage
CREATE OR REPLACE FUNCTION update_client_credit_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- When a sale is created with credit (fiado)
  IF NEW.payment_status = 'pending' AND NEW.client_id IS NOT NULL THEN
    UPDATE public.clients
    SET credit_used = credit_used + NEW.total_amount
    WHERE id = NEW.client_id;
    
    -- Check if credit limit exceeded and block client
    UPDATE public.clients
    SET status = 'blocked'
    WHERE id = NEW.client_id 
      AND credit_used > credit_limit 
      AND allow_credit = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update client when payment is received
CREATE OR REPLACE FUNCTION update_client_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a payment is made, reduce credit_used
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.client_id IS NOT NULL THEN
    UPDATE public.clients
    SET 
      credit_used = GREATEST(0, credit_used - NEW.total_amount),
      last_purchase_date = NOW()
    WHERE id = NEW.client_id;
    
    -- Unblock client if credit is now within limit
    UPDATE public.clients
    SET status = 'active'
    WHERE id = NEW.client_id 
      AND status = 'blocked'
      AND credit_used <= credit_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update client statistics
CREATE OR REPLACE FUNCTION update_client_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.client_id IS NOT NULL THEN
    UPDATE public.clients
    SET 
      last_purchase_date = NOW(),
      total_purchases = total_purchases + NEW.total_amount
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (only if sales table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS trigger_update_client_credit ON public.sales;
    DROP TRIGGER IF EXISTS trigger_update_client_payment ON public.sales;
    DROP TRIGGER IF EXISTS trigger_update_client_stats ON public.sales;
    
    -- Create triggers
    CREATE TRIGGER trigger_update_client_credit
      AFTER INSERT ON public.sales
      FOR EACH ROW
      EXECUTE FUNCTION update_client_credit_usage();
    
    CREATE TRIGGER trigger_update_client_payment
      AFTER UPDATE ON public.sales
      FOR EACH ROW
      EXECUTE FUNCTION update_client_on_payment();
    
    CREATE TRIGGER trigger_update_client_stats
      AFTER UPDATE ON public.sales
      FOR EACH ROW
      EXECUTE FUNCTION update_client_statistics();
  END IF;
END $$;

-- Create view for client financial summary
CREATE OR REPLACE VIEW client_financial_summary AS
SELECT 
  c.id,
  c.name,
  c.cpf_cnpj,
  c.client_type,
  c.status,
  c.credit_limit,
  c.credit_used,
  (c.credit_limit - c.credit_used) as credit_available,
  c.allow_credit,
  c.total_purchases,
  c.last_purchase_date,
  c.is_vip,
  COUNT(DISTINCT s.id) as total_sales,
  COALESCE(SUM(CASE WHEN s.payment_status = 'pending' THEN s.total_amount ELSE 0 END), 0) as pending_amount,
  COALESCE(SUM(CASE WHEN s.payment_status = 'paid' THEN s.total_amount ELSE 0 END), 0) as paid_amount
FROM public.clients c
LEFT JOIN public.sales s ON s.client_id = c.id
GROUP BY c.id, c.name, c.cpf_cnpj, c.client_type, c.status, c.credit_limit, 
         c.credit_used, c.allow_credit, c.total_purchases, c.last_purchase_date, c.is_vip;

-- Comments
COMMENT ON COLUMN public.clients.client_type IS 'Type of client: PF (Pessoa Física) or PJ (Pessoa Jurídica)';
COMMENT ON COLUMN public.clients.rg_ie IS 'RG for PF or Inscrição Estadual for PJ';
COMMENT ON COLUMN public.clients.credit_limit IS 'Maximum credit limit allowed for this client';
COMMENT ON COLUMN public.clients.credit_used IS 'Current credit being used (pending payments)';
COMMENT ON COLUMN public.clients.allow_credit IS 'Whether this client is allowed to buy on credit (fiado)';
COMMENT ON COLUMN public.clients.status IS 'Client status: active, inactive, or blocked';
COMMENT ON COLUMN public.clients.is_vip IS 'Whether this is a VIP client';

-- Grant permissions
GRANT SELECT ON client_financial_summary TO authenticated;
