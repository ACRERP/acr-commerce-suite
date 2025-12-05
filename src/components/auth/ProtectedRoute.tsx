import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, getCurrentSession } from '@/lib/supabaseClient';
import { isAdmin, isVendas, isFinanceiro, isEstoque } from '@/lib/supabaseClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'vendas' | 'financeiro' | 'estoque';
  requireAuth?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireAuth = true,
  fallbackPath = '/auth'
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check current session and user
        const { session } = await getCurrentSession();
        const { user: currentUser } = await getCurrentUser();

        if (!session || !currentUser) {
          if (requireAuth) {
            setError('Sessão não encontrada. Por favor, faça login novamente.');
            return;
          }
        }

        setUser(currentUser);

        // Check role requirements
        if (requiredRole && currentUser) {
          let hasRequiredRole = false;

          switch (requiredRole) {
            case 'admin':
              hasRequiredRole = isAdmin(currentUser);
              break;
            case 'vendas':
              hasRequiredRole = isVendas(currentUser);
              break;
            case 'financeiro':
              hasRequiredRole = isFinanceiro(currentUser);
              break;
            case 'estoque':
              hasRequiredRole = isEstoque(currentUser);
              break;
          }

          if (!hasRequiredRole) {
            setError(`Acesso negado. Permissão de "${requiredRole}" é necessária.`);
            return;
          }
        }

      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Erro ao verificar autenticação. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole, requireAuth]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              Acesso Restrito
            </h3>
            <p className="text-gray-600">
              {requireAuth 
                ? 'Você precisa fazer login para acessar esta página.'
                : 'Você não tem permissão para acessar esta página.'
              }
            </p>
            
            <div className="space-y-2">
              {requireAuth && (
                <Button 
                  onClick={() => window.location.href = fallbackPath}
                  className="w-full"
                >
                  Fazer Login
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if authentication is required but user is not logged in
  if (requireAuth && !user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && user) {
    let hasRequiredRole = false;

    switch (requiredRole) {
      case 'admin':
        hasRequiredRole = isAdmin(user);
        break;
      case 'vendas':
        hasRequiredRole = isVendas(user);
        break;
      case 'financeiro':
        hasRequiredRole = isFinanceiro(user);
        break;
      case 'estoque':
        hasRequiredRole = isEstoque(user);
        break;
    }

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Acesso negado. Permissão de "{requiredRole}" é necessária.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-4">
              <Lock className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">
                Permissão Insuficiente
              </h3>
              <p className="text-gray-600">
                Entre em contato com o administrador do sistema para solicitar acesso.
              </p>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Allow access
  return <>{children}</>;
}

// Higher-order component for specific roles
export const withRoleProtection = (requiredRole: 'admin' | 'vendas' | 'financeiro' | 'estoque') => {
  return (WrappedComponent: React.ComponentType<unknown>) => {
    return (props: unknown) => (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...(props as any)} />
      </ProtectedRoute>
    );
  };
};

// Pre-built protected components
export const AdminOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export const VendasOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="vendas">
    {children}
  </ProtectedRoute>
);

export const FinanceiroOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="financeiro">
    {children}
  </ProtectedRoute>
);

export const EstoqueOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="estoque">
    {children}
  </ProtectedRoute>
);

export const AuthOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
);
