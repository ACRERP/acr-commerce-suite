-- Migration: Fix RLS Recursion & Expand Products Schema
-- Created at: 2025-12-13
-- Description: Fixes variable infinite recursion in profiles RLS and adds missing columns to products table.

-- =====================================================
-- 1. FIX RLS RECURSION (Profiles)
-- =====================================================

-- Drop ALL existing policies to ensure we clear the recursive one
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all for public" ON profiles;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can see all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profile" ON profiles;
DROP POLICY IF EXISTS "Users can update profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create Safe, Non-Recursive Policies
-- 1. SELECT: Allow everyone to see profiles (Safe for social/team apps)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. INSERT: Users can only create their own profile (auth.uid() matches id in row)
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- =====================================================
-- 2. EXPAND PRODUCTS SCHEMA (Real World Data)
-- =====================================================

-- Add columns required by the UI (Produtos.tsx) and Logic (Premium Audit)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_stock_level INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verify if product_categories exists before referencing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
        CREATE TABLE product_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        GRANT ALL ON product_categories TO authenticated;
    END IF;
END $$;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES product_categories(id);

-- =====================================================
-- 3. PERMISSIONS (Grant Access)
-- =====================================================

GRANT ALL ON products TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON product_categories TO authenticated;
