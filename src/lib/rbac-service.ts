import { supabase } from './supabaseClient';

export type UserRole = 'admin' | 'vendas' | 'financeiro' | 'estoque';

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
