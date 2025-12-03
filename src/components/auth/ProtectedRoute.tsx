import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredModule?: string
  requiredAction?: string
}

// BYPASS TOTAL DE AUTENTICAÇÃO DURANTE DESENVOLVIMENTO
export function ProtectedRoute({ 
  children, 
  requiredModule, 
  requiredAction 
}: ProtectedRouteProps) {
  // Em desenvolvimento, permite acesso direto a todas as rotas
  if (import.meta.env.DEV) {
    return <>{children}</>
  }

  // Em produção, mantém lógica normal (implementar depois)
  console.warn('ProtectedRoute: Autenticação desativada em produção - implementar lógica')
  return <>{children}</>
}
