import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  cpf_cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  created_at?: string;
}

export function useClients() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      return data as Client[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('clients').insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  return { clients, isLoading, createClient };
}
