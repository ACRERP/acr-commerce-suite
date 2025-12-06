import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ClientList, Client } from '@/components/dashboard/clients/ClientList';
import { ClientForm } from '@/components/dashboard/clients/ClientForm';
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
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import { PlusCircle, Search, X } from 'lucide-react';

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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: addClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Top Bar Horizontal Menu */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-bold border-r pr-4 mr-2">Clientes</h1>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, telefone..."
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleNewClient} className="bg-primary hover:bg-primary/90 ml-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Horizontal Collapsible Form */}
      <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
        <CollapsibleContent className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedClient ? `✏️ Editar Cliente: ${selectedClient.name}` : '➕ Novo Cliente'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <ClientForm
              onSubmit={handleSubmit}
              isLoading={addMutation.isPending || updateMutation.isPending}
              client={selectedClient}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Client List */}
      <div className="flex-1 overflow-auto">
        <ClientList
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          searchTerm={searchTerm}
        />
      </div>

      {/* Delete Alert Dialog */}
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
    </div>
  );
}
