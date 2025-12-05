-- Create user management tables
-- Migration: 20251205170000_create_user_management.sql

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  department VARCHAR(100),
  position VARCHAR(100),
  employee_id VARCHAR(50),
  hire_date DATE,
  birth_date DATE,
  address JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL,
  UNIQUE(user_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES user_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL,
  UNIQUE(user_id, role_id)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location JSONB,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  tenant_id UUID NOT NULL
);

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Create password_reset_requests table
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_tenant_id ON user_role_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_tenant_id ON user_activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_token ON password_reset_requests(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
        AND ur.name = 'admin'
        AND ura.is_active = true
    )
  );

CREATE POLICY "Users can view roles for their tenant" ON user_roles
  FOR SELECT USING (
    tenant_id = auth.jwt() ->> 'tenant_id' OR 
    is_system_role = true
  );

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
        AND ur.name = 'admin'
        AND ura.is_active = true
    )
  );

CREATE POLICY "Users can view own role assignments" ON user_role_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage role assignments" ON user_role_assignments
  FOR ALL USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
        AND ur.name = 'admin'
        AND ura.is_active = true
    )
  );

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity" ON user_activity_log
  FOR SELECT USING (
    tenant_id = auth.jwt() ->> 'tenant_id' AND
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
        AND ur.name = 'admin'
        AND ura.is_active = true
    )
  );

CREATE POLICY "Users can manage own password resets" ON password_reset_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own email verification" ON email_verification_tokens
  FOR ALL USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    phone,
    tenant_id
  ) VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    p_phone,
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  p_user_id UUID,
  p_role_name VARCHAR,
  p_assigned_by UUID DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  assignment_id UUID;
  role_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO role_id
  FROM user_roles
  WHERE name = p_role_name
    AND (tenant_id = COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id') OR is_system_role = true)
    AND is_active = true;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role % not found', p_role_name;
  END IF;
  
  -- Insert assignment
  INSERT INTO user_role_assignments (
    user_id,
    role_id,
    assigned_by,
    expires_at,
    tenant_id
  ) VALUES (
    p_user_id,
    role_id,
    COALESCE(p_assigned_by, auth.uid()),
    p_expires_at,
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO assignment_id;
  
  RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    tenant_id
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent,
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(
  p_email VARCHAR,
  p_expires_hours INTEGER DEFAULT 1,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
  reset_token VARCHAR;
  user_record RECORD;
BEGIN
  -- Find user by email
  SELECT id, email INTO user_record
  FROM auth.users
  WHERE email = p_email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;
  
  -- Generate token
  reset_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert reset request
  INSERT INTO password_reset_requests (
    user_id,
    token,
    email,
    expires_at,
    ip_address,
    user_agent,
    tenant_id
  ) VALUES (
    user_record.id,
    reset_token,
    user_record.email,
    NOW() + (p_expires_hours || ' hours')::INTERVAL,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent',
    COALESCE(p_tenant_id, auth.jwt() ->> 'tenant_id')
  );
  
  RETURN reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify password reset token
CREATE OR REPLACE FUNCTION verify_password_reset_token(
  p_token VARCHAR
)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT user_id INTO user_id
  FROM password_reset_requests
  WHERE token = p_token
    AND expires_at > NOW()
    AND used_at IS NULL;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;
  
  -- Mark token as used
  UPDATE password_reset_requests
  SET used_at = NOW()
  WHERE token = p_token;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system roles
INSERT INTO user_roles (
  id,
  name,
  display_name,
  description,
  permissions,
  is_system_role,
  is_active
) VALUES
(
  gen_random_uuid(),
  'admin',
  'Administrador',
  'Acesso completo ao sistema',
  '["*"]',
  true,
  true
),
(
  gen_random_uuid(),
  'manager',
  'Gerente',
  'Acesso gerencial com permissões estendidas',
  '["users:read", "users:write", "products:read", "products:write", "sales:read", "sales:write", "reports:read", "inventory:read", "inventory:write"]',
  true,
  true
),
(
  gen_random_uuid(),
  'sales',
  'Vendedor',
  'Acesso às funcionalidades de vendas',
  '["products:read", "sales:read", "sales:write", "clients:read", "clients:write"]',
  true,
  true
),
(
  gen_random_uuid(),
  'finance',
  'Financeiro',
  'Acesso às funcionalidades financeiras',
  '["sales:read", "finance:read", "finance:write", "reports:read"]',
  true,
  true
),
(
  gen_random_uuid(),
  'user',
  'Usuário',
  'Acesso básico ao sistema',
  '["profile:read", "profile:write"]',
  true,
  true
);
