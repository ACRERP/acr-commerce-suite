import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';
import { MODULE_REGISTRY } from '@/config/modules';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'admin' | 'vendas' | 'financeiro' | 'estoque';
}

import { Shield, Lock } from 'lucide-react';

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole
}: ProtectedRouteProps) {
  const { user, session, loading, hasRole } = useAuth();
  const { activeProfile } = useBusinessProfile();
  const location = useLocation();

  // CRITICAL: Wait for auth to finish loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Check authentication - use session instead of user for more reliability
  if (requireAuth && !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // CHECK PROFILE-BASED MODULE ACCESS
  const isExcludedPath = ['/', '/dashboard', '/overview', '/configuracoes', '/login', '/provisioning', '/start', '/recovery'].some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  if (activeProfile && !isExcludedPath) {
    const currentPath = location.pathname;
    const moduleEntry = Object.values(MODULE_REGISTRY).find(m =>
      currentPath === m.path || currentPath.startsWith(m.path + '/')
    );

    if (moduleEntry && !activeProfile.modules.includes(moduleEntry.id)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50/50">
          <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-neutral-200 animate-in zoom-in duration-300">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-inner">
                <Shield className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Módulo Indisponível
              </h3>
              <p className="text-neutral-600 mb-8 leading-relaxed">
                O módulo <strong>{moduleEntry.label}</strong> não faz parte do perfil <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-900 font-semibold">{activeProfile.label}</span>.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-all active:scale-95 shadow-lg"
                >
                  Voltar para Segurança
                </button>
                <Link to="/dashboard" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 underline underline-offset-4 mt-2 transition-colors">
                  Ir para o Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600 mb-6">
              Você não tem permissão para acessar esta página.
              <br />
              Perfil necessário: <strong className="text-red-600">{requiredRole}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Pre-built protected components
export const AdminOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export const VendasOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="vendas">{children}</ProtectedRoute>
);

export const FinanceiroOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="financeiro">{children}</ProtectedRoute>
);

export const EstoqueOnly = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="estoque">{children}</ProtectedRoute>
);
