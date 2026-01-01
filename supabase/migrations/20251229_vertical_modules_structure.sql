-- Vertical Modules Structure Migration
-- Modules: Fleet (Frota), Academic (Acadêmico), Compliance, Marketing

-- 1. FLEET MODULE (FROTA)
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Moto', 'Carro', 'Caminhão'
    status TEXT DEFAULT 'available', -- 'available', 'in_transit', 'maintenance'
    driver_id UUID REFERENCES public.profiles(id),
    current_km NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

CREATE TABLE IF NOT EXISTS public.fleet_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.fleet_vehicles(id),
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0,
    maintenance_date DATE NOT NULL,
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

-- 2. ACADEMIC MODULE (ACADÊMICO)
CREATE TABLE IF NOT EXISTS public.academic_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    enrollment_number TEXT UNIQUE,
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'graduated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

CREATE TABLE IF NOT EXISTS public.academic_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    duration_months INT DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

CREATE TABLE IF NOT EXISTS public.academic_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.academic_students(id),
    course_id UUID REFERENCES public.academic_courses(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

-- 3. COMPLIANCE MODULE
CREATE TABLE IF NOT EXISTS public.compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Alvará', 'Licença', 'Certificado'
    issue_date DATE,
    expiry_date DATE,
    status TEXT DEFAULT 'valid', -- 'valid', 'expired', 'renewing'
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

CREATE TABLE IF NOT EXISTS public.compliance_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspector_name TEXT,
    inspection_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'passed', -- 'passed', 'failed', 'conditional'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

-- 4. MARKETING MODULE
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    channel TEXT, -- 'Email', 'Social', 'Ads'
    budget NUMERIC DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'paused'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id UUID
);

-- Enable RLS (Row Level Security) - Basic Setup
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Create Basic Policies (Authenticated users can view/edit for now)
CREATE POLICY "Allow authenticated read access" ON fleet_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON fleet_maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON academic_students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON academic_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON academic_enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON compliance_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON compliance_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON marketing_campaigns FOR SELECT TO authenticated USING (true);
