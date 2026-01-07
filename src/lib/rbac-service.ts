import { supabase } from './supabaseClient';

export type UserRole = 'admin' | 'vendas' | 'financeiro' | 'estoque';

export type Module = string;
export type Action = 'view' | 'create' | 'edit' | 'delete';

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Record<string, Record<string, boolean>>;
  is_system?: boolean;
}

export const MODULES = [
  'dashboard', 'products', 'clients', 'sales', 'finance', 
  'reports', 'settings', 'users', 'inventory', 'crm'
];

export const ACTIONS: Action[] = ['view', 'create', 'edit', 'delete'];

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
  last_sign_in_at?: string;
}

export const rbacService = {
  async listUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing users:', error);
      throw error;
    }

    return data as UserProfile[];
  },

  async updateUserRole(id: string, role: UserRole): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
    
    // Auth metadata update should be handled by a database trigger 
    // for security and compatibility when done from the frontend.
  },

  async updateUserStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Dynamic RBAC Functions
  async getRoleModules(): Promise<Record<string, string[]>> {
    const { data, error } = await supabase
      .from('role_modules')
      .select('role, modules');

    if (error) {
      console.error('Error fetching role modules:', error);
      throw error;
    }

    const mapping: Record<string, string[]> = {};
    data.forEach(item => {
      mapping[item.role] = item.modules;
    });
    return mapping;
  },

  async updateRoleModules(role: string, modules: string[]): Promise<void> {
    const { error } = await supabase
      .from('role_modules')
      .upsert({ role, modules, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Error updating role modules:', error);
      throw error;
    }
  },

  // Seller Management Functions
  async listSellers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error listing sellers:', error);
      throw error;
    }
    return data;
  },

  async upsertSeller(seller: any): Promise<void> {
    const { error } = await supabase
      .from('sellers')
      .upsert({
        ...seller,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving seller:', error);
      throw error;
    }
  },

  // Helper to check if user has permission for a module
  hasPermission(role: UserRole, module: string): boolean {
    if (role === 'admin') return true;

    const permissions: Record<UserRole, string[]> = {
      admin: ['*'],
      vendas: ['pdv', 'products', 'clients', 'sales'],
      financeiro: ['financeiro', 'dashboard', 'reports'],
      estoque: ['products', 'stock', 'suppliers'],
    };

    const userPermissions = permissions[role] || [];
    return userPermissions.includes(module) || userPermissions.includes('*');
  }
};

// Named exports for backwards compatibility
export const getUsers = rbacService.listUsers;
export const updateUserRole = rbacService.updateUserRole;
export const updateUserStatus = rbacService.updateUserStatus;

// Role Management Functions
export async function getRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching roles:', error);
    // Return default roles if table doesn't exist
    return [
      { id: 1, name: 'admin', description: 'Administrador', permissions: {}, is_system: true },
      { id: 2, name: 'vendas', description: 'Vendedor', permissions: {}, is_system: true },
      { id: 3, name: 'financeiro', description: 'Financeiro', permissions: {}, is_system: true },
      { id: 4, name: 'estoque', description: 'Estoquista', permissions: {}, is_system: true },
    ];
  }

  return data as Role[];
}

export async function createRole(roleData: { name: string; description: string; permissions: Record<string, any> }): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .insert(roleData)
    .select()
    .single();

  if (error) {
    console.error('Error creating role:', error);
    throw error;
  }

  return data as Role;
}

export async function updateRole(id: number, updates: Partial<Role>): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating role:', error);
    throw error;
  }

  return data as Role;
}

export async function deleteRole(id: number): Promise<void> {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
}
