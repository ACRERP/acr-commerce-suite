-- Enable RLS on all tables if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create user roles enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'vendas', 'financeiro', 'estoque');
    END IF;
END
$$;

-- Add role column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role user_role DEFAULT 'vendas';
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;
    END IF;
END
$$;

-- Update existing users to have admin role if they're the first user
UPDATE users SET role = 'admin' WHERE id = (
    SELECT id FROM users ORDER BY created_at ASC LIMIT 1
) AND role IS NULL;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

DROP POLICY IF EXISTS "Users can view all sales" ON sales;
DROP POLICY IF EXISTS "Users can insert sales" ON sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON sales;

DROP POLICY IF EXISTS "Users can view all sale_items" ON sale_items;
DROP POLICY IF EXISTS "Users can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Users can update their own sale_items" ON sale_items;
DROP POLICY IF EXISTS "Users can delete their own sale_items" ON sale_items;

-- Products RLS Policies
CREATE POLICY "Admins can view all products" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all products" ON products
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete all products" ON products
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view products" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can insert products" ON products
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can update products" ON products
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Estoque can view products" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('estoque', 'admin'));

CREATE POLICY "Estoque can update products stock" ON products
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('estoque', 'admin') AND
        (stock_quantity IS NOT NULL OR minimum_stock_level IS NOT NULL)
    );

CREATE POLICY "Financeiro can view products" ON products
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('financeiro', 'admin'));

-- Clients RLS Policies
CREATE POLICY "Admins can view all clients" ON clients
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all clients" ON clients
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete all clients" ON clients
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view clients" ON clients
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can update clients" ON clients
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Financeiro can view clients" ON clients
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('financeiro', 'admin'));

-- Sales RLS Policies
CREATE POLICY "Admins can view all sales" ON sales
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert sales" ON sales
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all sales" ON sales
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete all sales" ON sales
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view sales" ON sales
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can insert sales" ON sales
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can update their own sales" ON sales
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('vendas', 'admin') AND
        created_by = auth.uid()
    );

CREATE POLICY "Financeiro can view sales" ON sales
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('financeiro', 'admin'));

-- Sale Items RLS Policies
CREATE POLICY "Admins can view all sale_items" ON sale_items
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert sale_items" ON sale_items
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all sale_items" ON sale_items
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can delete all sale_items" ON sale_items
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Vendas can view sale_items" ON sale_items
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Vendas can insert sale_items" ON sale_items
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('vendas', 'admin'));

CREATE POLICY "Financeiro can view sale_items" ON sale_items
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('financeiro', 'admin'));

-- Users RLS Policies (for user management)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update user roles" ON users
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid() AND role IS NOT DISTINCT FROM auth.jwt() ->> 'role');

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(required_role text)
RETURNS boolean AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = required_role OR auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
BEGIN
    RETURN auth.jwt() ->> 'role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access resource
CREATE OR REPLACE FUNCTION can_access_resource(resource_table text, action text)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    user_role := auth.jwt() ->> 'role';
    
    -- Admin can access everything
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Define role permissions
    CASE resource_table
        WHEN 'products' THEN
            RETURN action IN ('SELECT') AND user_role IN ('vendas', 'financeiro', 'estoque');
        WHEN 'clients' THEN
            RETURN action IN ('SELECT') AND user_role IN ('vendas', 'financeiro');
        WHEN 'sales' THEN
            RETURN action IN ('SELECT') AND user_role IN ('vendas', 'financeiro');
        WHEN 'financial_transactions' THEN
            RETURN action IN ('SELECT') AND user_role IN ('financeiro');
        WHEN 'inventory_transactions' THEN
            RETURN action IN ('SELECT') AND user_role IN ('estoque');
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger for important tables
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS trigger AS $$
BEGIN
    -- Log the action to audit table (would need to create audit_logs table)
    -- For now, just return the record
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    old_values jsonb,
    new_values jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create trigger for products audit
DROP TR";TRIGGER };
  IF EXISTS.
 .
.
