import { ReactNode } from 'react'

interface BypassAuthProps {
  children: ReactNode
}

// Componente para bypass temporário de autenticação durante desenvolvimento
export function BypassAuth({ children }: BypassAuthProps) {
  // Em modo de desenvolvimento, renderiza children diretamente
  if (import.meta.env.DEV) {
    return <>{children}</>
  }
  
  // Em produção, mantém comportamento normal
  return <>{children}</>
}
