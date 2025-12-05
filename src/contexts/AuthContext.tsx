import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { 
  getCurrentUser, 
  getCurrentSession, 
  signIn as signInClient, 
  signUp as signUpClient, 
  signOut as signOutClient,
  onAuthStateChange,
  isAdmin,
  isVendas,
  isFinanceiro,
  isEstoque
} from '@/lib/supabaseClient'

interface Profile {
  id: string
  email: string
  name?: string
  role: 'admin' | 'vendas' | 'financeiro' | 'estoque'
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  hasRole: (role: 'admin' | 'vendas' | 'financeiro' | 'estoque') => boolean
  isAdmin: () => boolean
  isVendas: () => boolean
  isFinanceiro: () => boolean
  isEstoque: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        
        // Get current session and user
        const sessionResponse = await getCurrentSession()
        const userResponse = await getCurrentUser()

        setSession(sessionResponse.session)
        setUser(userResponse.user)

        if (userResponse.user && sessionResponse.session) {
          // Create profile from user metadata
          const userProfile: Profile = {
            id: userResponse.user.id,
            email: userResponse.user.email || '',
            name: userResponse.user.user_metadata?.name || userResponse.user.user_metadata?.full_name,
            role: userResponse.user.user_metadata?.role || userResponse.user.app_metadata?.role || 'vendas',
            created_at: userResponse.user.created_at
          }
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const userProfile: Profile = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role || session.user.app_metadata?.role || 'vendas',
          created_at: session.user.created_at
        }
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await signInClient(email, password)
    return { error }
  }

  async function signUp(email: string, password: string, name: string, role: 'admin' | 'vendas' | 'financeiro' | 'estoque' = 'vendas') {
    const { error } = await signUpClient(email, password, { name, role })
    return { error }
  }

  async function signOut() {
    const { error } = await signOutClient()
    return { error }
  }

  function hasRole(role: 'admin' | 'vendas' | 'financeiro' | 'estoque'): boolean {
    if (!user) return false
    
    switch (role) {
      case 'admin':
        return isAdmin(user)
      case 'vendas':
        return isVendas(user)
      case 'financeiro':
        return isFinanceiro(user)
      case 'estoque':
        return isEstoque(user)
      default:
        return false
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin: () => hasRole('admin'),
    isVendas: () => hasRole('vendas'),
    isFinanceiro: () => hasRole('financeiro'),
    isEstoque: () => hasRole('estoque'),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
