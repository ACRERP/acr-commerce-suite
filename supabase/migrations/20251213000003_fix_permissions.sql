-- Migration: Fix Permissions (System Config & Leads)
-- Created at: 2025-12-13
-- Description: Ensures authenticated users can CRUD system_config (for settings) and leads (for CRM).

-- 1. System Config Permissions
-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users can select system_config" ON public.system_config;
DROP POLICY IF EXISTS "Authenticated users can insert system_config" ON public.system_config;
DROP POLICY IF EXISTS "Authenticated users can update system_config" ON public.system_config;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.system_config;

-- Re-create permissive policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON public.system_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions explicitly
GRANT ALL ON TABLE public.system_config TO authenticated;
GRANT ALL ON TABLE public.system_config TO service_role;

-- 2. Leads Permissions (CRM)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.leads;
CREATE POLICY "Enable all access for authenticated users" ON public.leads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

GRANT ALL ON TABLE public.leads TO authenticated;
GRANT ALL ON TABLE public.leads TO service_role;

-- 3. Ensure Sequences are accessible (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Fix updated_at trigger permissions
-- We set search_path=public in the previous migration, so this should be fine.
-- But we ensure the trigger function is executable.
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_system_config_timestamp() TO authenticated;
