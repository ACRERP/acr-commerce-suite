import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ClientList, Client } from '@/components/dashboard/clients/ClientList';
import { ClientForm } from '@/components/dashboard/clients/ClientForm';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';

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

export function ClientsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({ mutationFn: addClient, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast({ title: 'Sucesso!', description: 'Cliente adicionado com sucesso.' }); setIsSheetOpen(false); }, onError: (error) => { toast({ title: 'Erro!', description: `Não foi possível adicionar o cliente. ${error.message}`, variant: 'destructive' }); } });
  const updateMutation = useMutation({ mutationFn: updateClient, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast({ title: 'Sucesso!', description: 'Cliente atualizado com sucesso.' }); setIsSheetOpen(false); }, onError: (error) => { toast({ title: 'Erro!', description: `Não foi possível atualizar o cliente. ${error.message}`, variant: 'destructive' }); } });
  const deleteMutation = useMutation({ mutationFn: deleteClient, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast({ title: 'Sucesso!', description: 'Cliente excluído com sucesso.' }); setIsAlertOpen(false); }, onError: (error) => { toast({ title: 'Erro!', description: `Não foi possível excluir o cliente. ${error.message}`, variant: 'destructive' }); } });

  const handleNewClient = () => { setSelectedClient(null); setIsSheetOpen(true); };
  const handleEditClient = (client: Client) => { setSelectedClient(client); setIsSheetOpen(true); };
  const handleDeleteClient = (client: Client) => { setSelectedClient(client); setIsAlertOpen(true); };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, ...values });
    } else {
      addMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os clientes cadastrados.</p>
        </div>
        <Button onClick={handleNewClient}>Novo Cliente</Button>
      </div>

      <ClientList onEditClient={handleEditClient} onDeleteClient={handleDeleteClient} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ClientForm onSubmit={handleSubmit} isLoading={addMutation.isPending || updateMutation.isPending} client={selectedClient} />
          </div>
        </SheetContent>
      </Sheet>

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
