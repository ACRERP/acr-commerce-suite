import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

type Role = 'admin' | 'vendas' | 'financeiro' | 'estoque';

interface Permission {
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

interface RoleBasedAccessProps {
  children: ReactNode;
  roles?: Role[];
  permissions?: Permission[];
  fallback?: ReactNode;
  showWarning?: boolean;
}

// Role permissions matrix
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Admin has access to everything
    { module: 'products', action: 'create' },
    { module: 'products', action: 'read' },
    { module: 'products', action: 'update' },
    { module: 'products', action: 'delete' },
    { module: 'clients', action: 'create' },
    { module: 'clients', action: 'read' },
    { module: 'clients', action: 'update' },
    { module: 'clients', action: 'delete' },
    { module: 'sales', action: 'create' },
    { module: 'sales', action: 'read' },
    { module: 'sales', action: 'update' },
    { module: 'sales', action: 'delete' },
    { module: 'inventory', action: 'create' },
    { module: 'inventory', action: 'read' },
    { module: 'inventory', action: 'update' },
    { module: 'inventory', action: 'delete' },
    { module: 'financial', action: 'create' },
    { module: 'financial', action: 'read' },
    { module: 'financial', action: 'update' },
    { module: 'financial', action: 'delete' },
    { module: 'reports', action: 'create' },
    { module: 'reports', action: 'read' },
    { module: 'reports', action: 'update' },
    { module: 'reports', action: 'delete' },
    { module: 'users', action: 'create' },
    { module: 'users', action: 'read' },
    { module: 'users', action: 'update' },
    { module: 'users', action: 'delete' },
    { module: 'settings', action: 'create' },
    { module: 'settings', action: 'read' },
    { module: 'settings', action: 'update' },
    { module: 'settings', action: 'delete' },
  ],
  vendas: [
    // Sales permissions
    { module: 'products', action: 'read' },
    { module: 'products', action: 'update' }, // Can update price/stock for sales
    { module: 'clients', action: 'create' },
    { module: 'clients', action: 'read' },
    { module: 'clients', action: 'update' },
    { module: 'sales', action: 'create' },
    { module: 'sales', action: 'read' },
    { module: 'sales', action: 'update' },
    { module: 'inventory', action: 'read' }, // Can view inventory
    { module: 'reports', action: 'read' }, // Can view sales reports
  ],
  financeiro: [
    // Financial permissions
    { module: 'products', action: 'read' },
    { module: 'clients', action: 'read' },
    { module: 'sales', action: 'read' },
    { module: 'financial', action: 'create' },
    { module: 'financial', action: 'read' },
    { module: 'financial', action: 'update' },
    { module: 'financial', action: 'delete' },
    { module: 'reports', action: 'read' }, // Can view financial reports
    { module: 'reports', action: 'create' }, // Can generate financial reports
  ],
  estoque: [
    // Inventory permissions
    { module: 'products', action: 'create' },
    { module: 'products', action: 'read' },
    { module: 'products', action: 'update' }, // Can update stock, cost
    { module: 'inventory', action: 'create' },
    { module: 'inventory', action: 'read' },
    { module: 'inventory', action: 'update' },
    { module: 'inventory', action: 'delete' },
    { module: 'reports', action: 'read' }, // Can view inventory reports
  ],
};

export function RoleBasedAccess({ 
  children, 
  roles, 
  permissions, 
  fallback, 
  showWarning = false 
}: RoleBasedAccessProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse">Verificando permissões...</div>;
  }

  if (!profile) {
    return fallback || (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Você precisa estar autenticado para acessar este recurso.
        </AlertDescription>
      </Alert>
    );
  }

  const userRole = profile.role as Role;
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];

  // Check role-based access
  if (roles && roles.length > 0) {
    if (!roles.includes(userRole)) {
      return fallback || (showWarning && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Seu cargo ({userRole}) não tem permissão para acessar este recurso.
          </AlertDescription>
        </Alert>
      ));
    }
  }

  // Check permission-based access
  if (permissions && permissions.length > 0) {
    const hasAllPermissions = permissions.every(requiredPermission =>
      userPermissions.some(userPermission =>
        userPermission.module === requiredPermission.module &&
        userPermission.action === requiredPermission.action
      )
    );

    if (!hasAllPermissions) {
      return fallback || (showWarning && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Você não tem as permissões necessárias para acessar este recurso.
          </AlertDescription>
        </Alert>
      ));
    }
  }

  return <>{children}</>;
}

// Helper hooks for specific permissions
export function usePermissions() {
  const { profile } = useAuth();
  const userRole = profile?.role as Role;
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];

  const hasPermission = (module: string, action: 'create' | 'read' | 'update' | 'delete') => {
    return userPermissions.some(permission =>
      permission.module === module && permission.action === action
    );
  };

  const hasAnyPermission = (permissions: Permission[]) => {
    return permissions.some(requiredPermission =>
      userPermissions.some(userPermission =>
        userPermission.module === requiredPermission.module &&
        userPermission.action === requiredPermission.action
      )
    );
  };

  const hasAllPermissions = (permissions: Permission[]) => {
    return permissions.every(requiredPermission =>
      userPermissions.some(userPermission =>
        userPermission.module === requiredPermission.module &&
        userPermission.action === requiredPermission.action
      )
    );
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: userPermissions,
    role: userRole,
  };
}

// Pre-built permission components
export const CanCreateProducts = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'products', action: 'create' }]}>
    {children}
  </RoleBasedAccess>
);

export const CanReadProducts = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'products', action: 'read' }]}>
    {children}
  </RoleBasedAccess>
);

export const CanUpdateProducts = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'products', action: 'update' }]}>
    {children}
  </RoleBasedAccess>
);

export const CanDeleteProducts = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'products', action: 'delete' }]}>
    {children}
  </RoleBasedAccess>
);

export const CanManageClients = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess 
    permissions={[
      { module: 'clients', action: 'create' },
      { module: 'clients', action: 'update' },
      { module: 'clients', action: 'delete' }
    ]}
  >
    {children}
  </RoleBasedAccess>
);

export const CanManageSales = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess 
    permissions={[
      { module: 'sales', action: 'create' },
      { module: 'sales', action: 'update' }
    ]}
  >
    {children}
  </RoleBasedAccess>
);

export const CanManageInventory = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess 
    permissions={[
      { module: 'inventory', action: 'create' },
      { module: 'inventory', action: 'update' },
      { module: 'inventory', action: 'delete' }
    ]}
  >
    {children}
  </RoleBasedAccess>
);

export const CanManageFinancial = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess 
    permissions={[
      { module: 'financial', action: 'create' },
      { module: 'financial', action: 'update' },
      { module: 'financial', action: 'delete' }
    ]}
  >
    {children}
  </RoleBasedAccess>
);

export const CanViewReports = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'reports', action: 'read' }]}>
    {children}
  </RoleBasedAccess>
);

export const CanManageUsers = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'users', action: 'create' }]}>
    {children}
  </RoleBasedAccess>
);

export const CanAccessSettings = ({ children }: { children: ReactNode }) => (
  <RoleBasedAccess permissions={[{ module: 'settings', action: 'read' }]}>
    {children}
  </RoleBasedAccess>
);

// Utility function to check permissions outside React components
export function checkUserRole(role: Role, requiredRole: Role): boolean {
  if (role === 'admin') return true; // Admin can access everything
  return role === requiredRole;
}

export function checkModulePermission(
  userRole: Role, 
  module: string, 
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.some(permission =>
    permission.module === module && permission.action === action
  );
}
