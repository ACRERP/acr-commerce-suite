import { createClient } from '@supabase/supabase-js';
import { User, Session, AuthError } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types
interface UserMetadata {
  name?: string;
  role?: 'admin' | 'vendas' | 'financeiro' | 'estoque';
  [key: string]: unknown;
}

interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: AuthError | null;
}

interface SessionResponse {
  session: Session | null;
  error: AuthError | null;
}

interface UserResponse {
  user: User | null;
  error: AuthError | null;
}

interface SimpleResponse {
  data: unknown;
  error: AuthError | null;
}

// Auth helper functions
export const signUp = async (email: string, password: string, metadata?: UserMetadata): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
};

export const getCurrentSession = async (): Promise<SessionResponse> => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

export const resetPassword = async (email: string): Promise<SimpleResponse> => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string): Promise<SimpleResponse> => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

export const updateUserMetadata = async (metadata: UserMetadata): Promise<SimpleResponse> => {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });
  return { data, error };
};

// Permission checking helper
export const hasRole = (user: User | null, role: string): boolean => {
  return user?.user_metadata?.role === role || user?.app_metadata?.role === role;
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin');
};

export const isVendas = (user: User | null): boolean => {
  return hasRole(user, 'vendas') || isAdmin(user);
};

export const isFinanceiro = (user: User | null): boolean => {
  return hasRole(user, 'financeiro') || isAdmin(user);
};

export const isEstoque = (user: User | null): boolean => {
  return hasRole(user, 'estoque') || isAdmin(user);
};

// Error handling helper
export const handleSupabaseError = (error: AuthError | null): string => {
  if (error?.message) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

// Initialize auth state listener
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
