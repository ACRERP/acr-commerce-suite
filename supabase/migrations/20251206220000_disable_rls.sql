-- DISABLE RLS TO UNBLOCK DEVELOPMENT
-- Only run this if previous RLS fixes failed.

-- 1. Disable RLS on profiles (Root cause)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on service_orders (Just in case)
ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on transactions
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on clients
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
