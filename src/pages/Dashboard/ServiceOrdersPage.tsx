import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ServiceOrderList, ServiceOrder } from '@/components/dashboard/service-orders/ServiceOrderList';
import { ServiceOrderForm } from '@/components/dashboard/service-orders/ServiceOrderForm';
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
  client_id: z.number().min(1, 'É obrigatório selecionar um cliente.'),
  device_type: z.string().min(1, 'O tipo do aparelho é obrigatório.'),
  device_brand: z.string().optional(),
  device_model: z.string().optional(),
  serial_number: z.string().optional(),
  reported_issue: z.string().min(5, 'Descreva o defeito com mais detalhes.'),
  technician_notes: z.string().optional(),
  accessories_included: z.string().optional(),
  power_on: z.boolean().default(false),
  has_password: z.boolean().default(false),
  password_details: z.string().optional(),
});

async function addServiceOrder(order: z.infer<typeof formSchema>) {
  const { data, error } = await supabase.from('service_orders').insert([order]).select();
  if (error) throw new Error(error.message);
  return data;
}

async function updateServiceOrder({ id, ...order }: { id: number } & z.infer<typeof formSchema>) {
  const { data, error } = await supabase.from('service_orders').update(order).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data;
}

async function cancelServiceOrder(id: number) {
  const { data, error } = await supabase.from('service_orders').update({ status: 'cancelada' }).eq('id', id);
  if (error) throw new Error(error.message);
  return data;
}

export function ServiceOrdersPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: addServiceOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast({ title: 'Sucesso!', description: 'Ordem de Serviço criada com sucesso.' });
      setIsSheetOpen(false);
    },
        onError: (error: Error) => {
      toast({ title: 'Erro!', description: `Não foi possível criar a OS. ${error.message}`, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateServiceOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast({ title: 'Sucesso!', description: 'Ordem de Serviço atualizada com sucesso.' });
      setIsSheetOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro!', description: `Não foi possível atualizar a OS. ${error.message}`, variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelServiceOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast({ title: 'Sucesso!', description: 'Ordem de Serviço cancelada.' });
      setIsAlertOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro!', description: `Não foi possível cancelar a OS. ${error.message}`, variant: 'destructive' });
    },
  });

    const handleNewOrder = () => {
    setSelectedOrder(null);
    setIsSheetOpen(true);
  };

  const handleEditOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  const handleCancelOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsAlertOpen(true);
  };

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedOrder) {
      updateMutation.mutate({ id: selectedOrder.id, ...values });
    } else {
      addMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie todas as ordens de serviço e assistência técnica.
          </p>
        </div>
        <Button onClick={handleNewOrder}>Nova Ordem de Serviço</Button>
      </div>

            <ServiceOrderList onEditOrder={handleEditOrder} onCancelOrder={handleCancelOrder} />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{selectedOrder ? 'Editar Ordem de Serviço' : 'Criar Nova Ordem de Serviço'}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
                        <ServiceOrderForm onSubmit={handleSubmit} isLoading={addMutation.isPending || updateMutation.isPending} serviceOrder={selectedOrder} />
          </div>
        </SheetContent>
            </Sheet>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá cancelar a Ordem de Serviço <span className="font-bold">#{selectedOrder?.id.toString().padStart(4, '0')}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedOrder && cancelMutation.mutate(selectedOrder.id)}>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
