import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClients, 
  getClientById, 
  createClient, 
  updateClient, 
  deleteClient, 
  searchClients,
  Client,
  CreateClientData,
  UpdateClientData
} from '@/lib/clients';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters?: string) => [...clientKeys.lists(), { filters }] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
  search: (query: string) => [...clientKeys.all, 'search', query] as const,
};

// Get all clients
export function useClients(organizationId?: string) {
  return useQuery({
    queryKey: [...clientKeys.lists(), { organizationId }],
    queryFn: () => getClients(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get client by ID
export function useClient(id: number) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => getClientById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Search clients
export function useClientSearch(query: string, organizationId?: string) {
  return useQuery({
    queryKey: [...clientKeys.search(query), { organizationId }],
    queryFn: () => searchClients(query, organizationId),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create client mutation
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ client, organizationId }: { client: CreateClientData, organizationId?: string }) => createClient(client, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast({
        title: 'Sucesso',
        description: 'Cliente criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar cliente. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error creating client:', error);
    },
  });
}

// Update client mutation
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (client: UpdateClientData) => updateClient(client),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(data.client.id) });
      toast({
        title: 'Sucesso',
        description: 'Cliente atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar cliente. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error updating client:', error);
    },
  });
}

// Delete client mutation
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast({
        title: 'Sucesso',
        description: 'Cliente excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir cliente. Tente novamente.',
        variant: 'destructive',
      });
      console.error('Error deleting client:', error);
    },
  });
}
