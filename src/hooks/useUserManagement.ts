import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at?: string;
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data as User[];
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<User> & { id: string }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  return { users, isLoading, updateUser, resetPassword };
}
