-- Migration: OMNI-FIX RLS (Nuclear Option)
-- Created at: 2025-12-13
-- Description: Dynamically drops ALL policies on key tables to remove "ghost" recursive policies, then re-applies simple rules.

-- =====================================================
-- 1. DYNAMIC POLICY FLUSH
-- =====================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Flush PROFILES policies
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON profiles';
    END LOOP;

    -- Flush PRODUCTS policies
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'products' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON products';
    END LOOP;
    
     -- Flush PRODUCT_CATEGORIES policies
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'product_categories' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON product_categories';
    END LOOP;
END $$;

-- =====================================================
-- 2. RE-APPLY CLEAN POLICIES (PROFILES)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "profiles_insert_self" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_self" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 3. RE-APPLY CLEAN POLICIES (PRODUCTS)
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read (Dashboard needs it, Storefront needs it)
CREATE POLICY "products_select_public" 
ON products FOR SELECT USING (true);

-- Allow authenticated create/update (Any logged in user for now - Audit Stage)
CREATE POLICY "products_all_authenticated" 
ON products FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- 4. RE-APPLY CLEAN POLICIES (CATEGORIES)
-- =====================================================
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_public" 
ON product_categories FOR SELECT USING (true);

CREATE POLICY "categories_all_authenticated" 
ON product_categories FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- 5. ENSURE TRIGGERS DON'T BREAK THINGS
-- =====================================================
-- Disable triggers that might call RLS functions if necessary. 
-- For now, we trust the standard triggers.

GRANT ALL ON products TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON product_categories TO authenticated;
