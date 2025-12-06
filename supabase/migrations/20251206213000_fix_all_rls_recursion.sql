-- AGGRESSIVE FIX FOR RLS RECURSION
-- This script resets policies for all major tables to a simple "allow all" state for development.

-- 1. Profiles (The root cause of recursion)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable all for public" ON profiles;

CREATE POLICY "Enable all for public" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Service Orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public" ON service_orders;
CREATE POLICY "Enable all for public" ON service_orders FOR ALL USING (true) WITH CHECK (true);

-- 3. Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public" ON clients;
CREATE POLICY "Enable all for public" ON clients FOR ALL USING (true) WITH CHECK (true);

-- 4. Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public" ON transactions;
CREATE POLICY "Enable all for public" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- 5. Products & Variations
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public" ON products;
CREATE POLICY "Enable all for public" ON products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for public" ON product_variations;
CREATE POLICY "Enable all for public" ON product_variations FOR ALL USING (true) WITH CHECK (true);
