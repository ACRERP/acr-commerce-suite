-- Fix existing tables and add missing columns
-- This migration handles existing tables and adds what's missing

-- Add email column to clients if not exists
DO $$ BEGIN
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add missing columns to sales table if they don't exist
DO $$ BEGIN
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS discount numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS addition numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS type text DEFAULT 'sale';
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS notes text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS change numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_cpf text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS client_name text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS plate text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS table_number integer;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS command_number integer;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS waiter_id integer;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS service_fee numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS service_percentage numeric(5,2) DEFAULT 0;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS nfe_key text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS nfe_number integer;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS nfe_status text;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS nfe_date timestamp with time zone;
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS nfe_time text;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add missing columns to sale_items table if they don't exist
DO $$ BEGIN
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS total_price numeric(10,2);
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS discount numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS addition numeric(10,2) DEFAULT 0;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit text DEFAULT 'UN';
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS real_cost numeric(10,2);
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS profit numeric(10,2);
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS commission numeric(10,2);
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS icms_rate numeric(5,2) DEFAULT 0;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS ipi_rate numeric(5,2) DEFAULT 0;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS pis_rate numeric(5,2) DEFAULT 0;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cofins_rate numeric(5,2) DEFAULT 0;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cfop text;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cst_icms text;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cst_ipi text;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cst_pis text;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cst_cofins text;
    ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS notes text;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Create trigger for updated_at on sale_items if not exists
DO $$ BEGIN
    CREATE TRIGGER IF NOT EXISTS update_sale_items_updated_at 
        BEFORE UPDATE ON public.sale_items 
        FOR EACH ROW 
        EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;