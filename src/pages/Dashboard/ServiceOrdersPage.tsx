import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ServiceOrdersKanban } from '@/components/dashboard/service-orders/ServiceOrdersKanban';
import { ServiceOrder } from '@/components/dashboard/service-orders/ServiceOrderList'; // Keep interface for now
import { ServiceOrderForm } from '@/components/dashboard/service-orders/ServiceOrderForm';
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
import { PlusCircle, Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Enhanced Schema to match 2.0 requirements
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
  condition: z.string().optional(),
  payment_method: z.string().optional(),
  status: z.enum(['aberta', 'em_analise', 'aguardando_aprovacao', 'em_execucao', 'aguardando_peca', 'concluida', 'entregue', 'cancelada']).default('aberta'),
});

async function fetchServiceOrders() {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`*, clients (id, name, cpf_cnpj, phone)`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ServiceOrder[];
}

async function addServiceOrder(dataWithItems: any) {
  const { items, ...orderData } = dataWithItems;

  // 1. Create the Service Order
  const { data: order, error: orderError } = await supabase.from('service_orders').insert([orderData]).select().single();
  if (orderError) throw new Error(orderError.message);

  // 2. Create Items if any
  if (items && items.length > 0) {
    const itemsToInsert = items.map((item: any) => ({
      service_order_id: order.id,
      item_type: item.item_type,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));

    const { error: itemsError } = await supabase.from('service_order_items').insert(itemsToInsert);
    if (itemsError) console.error("Error saving items:", itemsError);
  }

  return order;
}

async function updateServiceOrder({ id, ...dataWithItems }: { id: number } & any) {
  const { items, ...orderData } = dataWithItems;

  const { data, error } = await supabase.from('service_orders').update(orderData).eq('id', id).select();
  if (error) throw new Error(error.message);

  // For simplicity in this MVP, we delete all old items and re-insert (not efficient for huge data, but fine here)
  await supabase.from('service_order_items').delete().eq('service_order_id', id);

  if (items && items.length > 0) {
    const itemsToInsert = items.map((item: any) => ({
      service_order_id: id,
      item_type: item.item_type,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));
    const { error: itemsError } = await supabase.from('service_order_items').insert(itemsToInsert);
    if (itemsError) console.error("Error saving items:", itemsError);
  }

  return data;
}

async function updateServiceOrderStatus({ id, status }: { id: number; status: string }) {
  const { data, error } = await supabase.from('service_orders').update({ status }).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data;
}

interface ServiceOrdersPageProps {
  openForm?: boolean;
}

export function ServiceOrdersPage({ openForm = false }: ServiceOrdersPageProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(openForm);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: serviceOrders = [], isLoading } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: fetchServiceOrders,
  });

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

  const statusMutation = useMutation({
    mutationFn: updateServiceOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast({ title: 'Status Atualizado', description: 'A ordem de serviço foi movida com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao mover', description: error.message, variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => updateServiceOrderStatus({ id, status: 'cancelada' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast({ title: 'Cancelada', description: 'Ordem de Serviço cancelada.' });
      setIsAlertOpen(false);
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

  const handleStatusChange = (orderId: number, newStatus: string) => {
    statusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedOrder) {
      updateMutation.mutate({ id: selectedOrder.id, ...values });
    } else {
      addMutation.mutate(values);
    }
  };

  // Filter orders
  const filteredOrders = serviceOrders.filter(order =>
    order.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm) ||
    order.device_model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Top Bar Horizontal Menu */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-bold border-r pr-4 mr-2">Ordens de Serviço</h1>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente, OS ou aparelho..."
              className="pl-9 bg-gray-50 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="outline" size="icon" title="Filtros Avançados">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={handleNewOrder} className="bg-primary hover:bg-primary/90 ml-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Ordem de Serviço
        </Button>
      </div>

      {/* Horizontal Collapsible Form */}
      <Collapsible open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <CollapsibleContent className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedOrder ? `✏️ Editar OS #${selectedOrder.id}` : '➕ Nova Ordem de Serviço'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsSheetOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            <ServiceOrderForm
              onSubmit={handleSubmit}
              isLoading={addMutation.isPending || updateMutation.isPending}
              serviceOrder={selectedOrder}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">Carregando quadro...</div>
        ) : (
          <ServiceOrdersKanban
            orders={filteredOrders}
            onEditOrder={handleEditOrder}
            onCancelOrder={(order) => {
              setSelectedOrder(order);
              setIsAlertOpen(true);
            }}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>



      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar OS #{selectedOrder?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará a ordem de serviço como cancelada. O histórico será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedOrder && cancelMutation.mutate(selectedOrder.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
