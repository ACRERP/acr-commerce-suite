-- Add email column to clients table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
