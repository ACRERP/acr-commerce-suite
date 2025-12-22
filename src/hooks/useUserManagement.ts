import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
  position?: string;
  employee_id?: string;
  hire_date?: string;
  birth_date?: string;
  address?: Record<string, unknown>;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  user?: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
  };
}

export interface UserRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  tenant_id: string;
  role?: UserRole;
  assigner?: {
    id: string;
    email: string;
  };
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, unknown>;
  location?: Record<string, unknown>;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
  tenant_id: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  tenant_id: string;
  user?: {
    id: string;
    email: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_names?: string[];
  department?: string;
  position?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
  position?: string;
  address?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

export function useUserProfiles() {
  const queryClient = useQueryClient();

  const {
    data: profiles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const createProfile = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Create profile
      const { data: profileData, error: profileError } = await supabase.rpc('create_user_profile', {
        p_user_id: authData.user.id,
        p_first_name: userData.first_name,
        p_last_name: userData.last_name,
        p_phone: userData.phone,
      });

      if (profileError) throw profileError;

      // Assign roles
      if (userData.role_names && userData.role_names.length > 0) {
        for (const roleName of userData.role_names) {
          await supabase.rpc('assign_user_role', {
            p_user_id: authData.user.id,
            p_role_name: roleName,
          });
        }
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role-assignments'] });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ userId, ...updateData }: UpdateProfileData & { userId: string }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
    },
  });

  return {
    profiles,
    isLoading,
    error,
    createProfile: createProfile.mutateAsync,
    updateProfile: updateProfile.mutateAsync,
    isCreating: createProfile.isPending,
    isUpdating: updateProfile.isPending,
  };
}

export function useUserProfile(userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: profile = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
  });

  return {
    profile,
    isLoading,
    error,
  };
}

export function useUserRoles() {
  const queryClient = useQueryClient();

  const {
    data: roles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true)
        .order('is_system_role', { ascending: false })
        .order('display_name', { ascending: true });

      if (error) throw error;
      return data as UserRole[];
    },
  });

  const createRole = useMutation({
    mutationFn: async (roleData: Omit<UserRole, 'id' | 'created_at' | 'updated_at' | 'is_system_role'>) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert(roleData)
        .select()
        .single();

      if (error) throw error;
      return data as UserRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<UserRole> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UserRole;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
  });

  return {
    roles,
    isLoading,
    error,
    createRole: createRole.mutateAsync,
    updateRole: updateRole.mutateAsync,
    isCreating: createRole.isPending,
    isUpdating: updateRole.isPending,
  };
}

export function useUserRoleAssignments(userId?: string) {
  const queryClient = useQueryClient();

  const {
    data: assignments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-role-assignments', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_role_assignments')
        .select('*')
        .eq('is_active', true);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserRoleAssignment[];
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, roleName, expiresAt }: { userId: string; roleName: string; expiresAt?: string }) => {
      const { data, error } = await supabase.rpc('assign_user_role', {
        p_user_id: userId,
        p_role_name: roleName,
        p_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role-assignments'] });
    },
  });

  const revokeRole = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role-assignments'] });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    assignRole: assignRole.mutateAsync,
    revokeRole: revokeRole.mutateAsync,
    isAssigning: assignRole.isPending,
    isRevoking: revokeRole.isPending,
  };
}

export function useUserSessions(userId?: string) {
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-sessions', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserSession[];
    },
  });

  return {
    sessions,
    isLoading,
    error,
  };
}

export function useUserActivityLog(userId?: string, limit: number = 50) {
  const {
    data: logs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-activity-log', userId, limit],
    queryFn: async () => {
      let query = supabase
        .from('user_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserActivityLog[];
    },
  });

  return {
    logs,
    isLoading,
    error,
  };
}

export function usePasswordReset() {
  const queryClient = useQueryClient();

  const requestReset = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        p_email: email,
        p_expires_hours: 1,
      });

      if (error) throw error;
      return data;
    },
  });

  const verifyToken = useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('verify_password_reset_token', {
        p_token: token,
      });

      if (error) throw error;
      return data;
    },
  });

  const resetPassword = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      // Verify token and get user_id
      const userId = await verifyToken.mutateAsync(token);

      // Update password
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset'] });
    },
  });

  return {
    requestReset: requestReset.mutateAsync,
    verifyToken: verifyToken.mutateAsync,
    resetPassword: resetPassword.mutateAsync,
    isRequesting: requestReset.isPending,
    isVerifying: verifyToken.isPending,
    isResetting: resetPassword.isPending,
  };
}

export function formatFullName(profile?: UserProfile | null): string {
  if (!profile) return '';
  return `${profile.first_name} ${profile.last_name}`.trim();
}

export function getRoleDisplayName(roleName: string): string {
  const names: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    sales: 'Vendedor',
    finance: 'Financeiro',
    user: 'Usuário',
  };
  
  return names[roleName] || roleName;
}

export function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    'user.created': 'Usuário criado',
    'user.updated': 'Usuário atualizado',
    'user.deleted': 'Usuário excluído',
    'login': 'Login realizado',
    'logout': 'Logout realizado',
    'password.changed': 'Senha alterada',
    'role.assigned': 'Função atribuída',
    'role.revoked': 'Função revogada',
    'product.created': 'Produto criado',
    'product.updated': 'Produto atualizado',
    'product.deleted': 'Produto excluído',
    'sale.created': 'Venda realizada',
    'inventory.movement': 'Movimentação de estoque',
  };
  
  return descriptions[action] || action;
}

export function formatPermissions(permissions: string[]): string[] {
  return permissions.map(permission => {
    const parts = permission.split(':');
    const resource = parts[0];
    const action = parts[1];
    
    const resourceNames: Record<string, string> = {
      users: 'Usuários',
      products: 'Produtos',
      sales: 'Vendas',
      finance: 'Financeiro',
      reports: 'Relatórios',
      inventory: 'Estoque',
      profile: 'Perfil',
    };
    
    const actionNames: Record<string, string> = {
      read: 'Visualizar',
      write: 'Editar',
      delete: 'Excluir',
    };
    
    return `${resourceNames[resource] || resource}: ${actionNames[action] || action}`;
  });
}
