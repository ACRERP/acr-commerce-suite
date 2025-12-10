import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClientList, Client } from '@/components/dashboard/clients/ClientList';
import { ClientForm } from '@/components/dashboard/clients/ClientForm';
import { ClientHistoryModal } from '@/components/dashboard/clients/ClientHistoryModal';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import { PlusCircle, Search, X, Users, UserPlus, TrendingUp, DollarSign } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  cpf_cnpj: z.string().optional(),
});

// API Functions
async function addClient(client: z.infer<typeof formSchema>) {
  const { data, error } = await supabase.from('clients').insert([client]).select();
  if (error) throw new Error(error.message);
  return data;
}

async function updateClient({ id, ...client }: { id: number } & z.infer<typeof formSchema>) {
  const { data, error } = await supabase.from('clients').update(client).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteClient(id: number) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

interface ClientsPageProps {
  openForm?: boolean;
}

export function ClientsPage({ openForm = false }: ClientsPageProps) {
  const [isFormOpen, setIsFormOpen] = useState(openForm);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, created_at');

      const total = clients?.length || 0;

      // Clientes novos (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newClients = clients?.filter(c =>
        new Date(c.created_at) >= thirtyDaysAgo
      ).length || 0;

      return {
        total,
        newClients,
        active: Math.floor(total * 0.7), // Placeholder
        avgTicket: 259 // Placeholder
      };
    }
  });

  const addMutation = useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
      toast({ title: 'Sucesso!', description: 'Cliente adicionado com sucesso.' });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erro!', description: `Não foi possível adicionar o cliente. ${error.message}`, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Sucesso!', description: 'Cliente atualizado com sucesso.' });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erro!', description: `Não foi possível atualizar o cliente. ${error.message}`, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
      toast({ title: 'Sucesso!', description: 'Cliente excluído com sucesso.' });
      setIsAlertOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Erro!', description: `Não foi possível excluir o cliente. ${error.message}`, variant: 'destructive' });
    }
  });

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsAlertOpen(true);
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, ...values });
    } else {
      addMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie sua base de clientes
          </p>
        </div>
        <Button onClick={handleNewClient} className="hover:scale-105 transition-transform">
          <PlusCircle className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Dashboard - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Clientes
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats?.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Clientes Ativos
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats?.active || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Novos este Mês
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {stats?.newClients || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ticket Médio
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  R$ {stats?.avgTicket || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, telefone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário em Dialog/Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? `Editar Cliente: ${selectedClient.name}` : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={handleSubmit}
            isLoading={addMutation.isPending || updateMutation.isPending}
            client={selectedClient}
          />
        </DialogContent>
      </Dialog>

      {/* Lista de Clientes */}
      <ClientList
        onEditClient={handleEditClient}
        onDeleteClient={handleDeleteClient}
        onViewPurchaseHistory={(client) => {
          setHistoryClient(client);
          setIsHistoryOpen(true);
        }}
        searchTerm={searchTerm}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente <span className="font-bold">{selectedClient?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedClient && deleteMutation.mutate(selectedClient.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Histórico */}
      <ClientHistoryModal
        client={historyClient}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryClient(null);
        }}
      />
    </div>
  );
}
