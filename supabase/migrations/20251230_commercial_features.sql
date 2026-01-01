-- Add commercial features to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS locked_profile_id TEXT, -- If set, user cannot switch profiles
ADD COLUMN IF NOT EXISTS extra_modules TEXT[] DEFAULT '{}'; -- Array of module IDs purchased separately

-- Create function to purchase module (dummy for now)
CREATE OR REPLACE FUNCTION public.purchase_module(module_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET extra_modules = array_append(extra_modules, module_id)
  WHERE id = auth.uid()
  AND NOT (extra_modules @> ARRAY[module_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to lock profile selection
CREATE OR REPLACE FUNCTION public.lock_profile_selection(profile_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET locked_profile_id = profile_id,
      business_profile_id = profile_id -- Ensure it matches
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
