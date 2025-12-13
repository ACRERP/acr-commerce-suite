-- Migration: Phase 6 UI Fixes (PDV, Clients, Sales)
-- Created at: 2025-12-13
-- Description: Ensures RLS policies allow authenticated users to access PDV-related tables and Clients.

-- =====================================================
-- 1. UNBLOCK PDV (Cash Register)
-- =====================================================

-- Ensure tables exist (just in case)
CREATE TABLE IF NOT EXISTS cash_register_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_amount DECIMAL(10,2) DEFAULT 0,
    closing_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'open',
    opened_by UUID REFERENCES auth.users(id),
    closed_by UUID REFERENCES auth.users(id),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS cash_register_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES cash_register_sessions(id),
    type VARCHAR(20) NOT NULL, -- 'sale', 'deposit', 'withdraw'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_movements ENABLE ROW LEVEL SECURITY;

-- Flush old policies to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'cash_register_sessions' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON cash_register_sessions';
    END LOOP;
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'cash_register_movements' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON cash_register_movements';
    END LOOP;
     FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'clients' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON clients';
    END LOOP;
     FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'sales' LOOP
        EXECUTE 'DROP POLICY "' || r.policyname || '" ON sales';
    END LOOP;
END $$;

-- Create Permissive Policies for Authenticated Users (Phase 6 Requirement: "It just works")

-- Cash Register
CREATE POLICY "Enable all for authenticated users" ON cash_register_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON cash_register_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON cash_register_sessions TO authenticated;
GRANT ALL ON cash_register_movements TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON sales TO authenticated;
