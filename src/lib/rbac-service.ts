import { supabase } from '@/lib/supabaseClient';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, any>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: number;
  assigned_at: string;
  assigned_by: string | null;
  role?: Role;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  roles?: Role[];
}

// ============ ROLES ============

export async function getRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getRole(id: number): Promise<Role | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRole(role: Partial<Role>): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .insert([role])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRole(id: number, updates: Partial<Role>): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  // Verificar se é papel do sistema
  const role = await getRole(id);
  if (role?.is_system) {
    throw new Error('Não é possível deletar papéis do sistema');
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ USER ROLES ============

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function assignRole(userId: string, roleId: number, assignedBy?: string): Promise<void> {
  const { error} = await supabase
    .from('user_roles')
    .insert([{
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy || null
    }]);

  if (error) throw error;
}

export async function removeRole(userId: string, roleId: number): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) throw error;
}

// ============ USERS ============

export async function getUsers(): Promise<User[]> {
  // Buscar usuários da tabela profiles (não requer admin API)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!profiles) return [];

  // Para cada usuário, buscar seus papéis
  const usersWithRoles = await Promise.all(
    profiles.map(async (profile) => {
      const userRoles = await getUserRoles(profile.id);
      return {
        id: profile.id,
        email: profile.email || '',
        created_at: profile.created_at,
        roles: userRoles.map(ur => ur.role).filter(Boolean) as Role[]
      };
    })
  );

  return usersWithRoles;
}

export async function getUserWithRoles(userId: string): Promise<User | null> {
  // Buscar usuário da tabela profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;
  if (!profile) return null;

  const userRoles = await getUserRoles(userId);

  return {
    id: profile.id,
    email: profile.email || '',
    created_at: profile.created_at,
    roles: userRoles.map(ur => ur.role).filter(Boolean) as Role[]
  };
}

// ============ USER MANAGEMENT ============

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
  // Atualizar status na tabela profiles
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) throw error;
}

export async function resetUserPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

// ============ PERMISSIONS ============

export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('has_permission', {
      p_user_id: userId,
      p_module: module,
      p_action: action
    });

  if (error) throw error;
  return data || false;
}

export async function checkPermission(
  module: string,
  action: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  return hasPermission(user.id, module, action);
}

// ============ HELPERS ============

export const MODULES = [
  'dashboard',
  'pdv',
  'vendas',
  'clientes',
  'produtos',
  'os',
  'delivery',
  'financeiro',
  'fiscal',
  'relatorios',
  'configuracoes',
  'caixa'
] as const;

export const ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'export',
  'update_status'
] as const;

export type Module = typeof MODULES[number];
export type Action = typeof ACTIONS[number];
