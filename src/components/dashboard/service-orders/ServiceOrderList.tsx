import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ServiceOrder {
  id: number;
  client_id: number;
  user_id: string | null;
  device_type: string;
  device_brand: string | null;
  device_model: string | null;
  serial_number: string | null;
  reported_issue: string;
  technician_notes: string | null;
  accessories_included: string | null;
  power_on: boolean;
  has_password: boolean;
  password_details: string | null;
  network_status: string | null;
  exit_test_ok: boolean | null;
  status: string;
  qr_code_url: string | null;
  client_email: string | null;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
  }[] | null;
}

async function fetchServiceOrders() {
  const { data, error } = await supabase
    .from('service_orders')
    .select(`*, clients (name)`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  aberta: 'secondary',
  em_andamento: 'default',
  aguardando_peca: 'outline',
  concluida: 'default',
  entregue: 'default',
  cancelada: 'destructive',
};

interface ServiceOrderListProps {
  onEditOrder: (order: ServiceOrder) => void;
  onCancelOrder: (order: ServiceOrder) => void;
}

export function ServiceOrderList({ onEditOrder, onCancelOrder }: ServiceOrderListProps) {
  const { data: orders, isLoading, isError, error } = useQuery<ServiceOrder[], Error>({
    queryKey: ['serviceOrders'],
    queryFn: fetchServiceOrders,
  });

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Erro ao carregar ordens de serviço: {error.message}</div>;
  }
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>OS</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Aparelho</TableHead>
            <TableHead>Defeito Relatado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data de Abertura</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
                    {orders?.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id.toString().padStart(4, '0')}</TableCell>
                                          <TableCell>{order.clients && order.clients.length > 0 ? order.clients[0].name : 'Cliente não identificado'}</TableCell>
              <TableCell>{order.device_type} {order.device_model}</TableCell>
              <TableCell>{order.reported_issue}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[order.status]}>{order.status.replace('_', ' ')}</Badge>
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onEditOrder(order)}>Editar / Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCancelOrder(order)} className="text-red-500">Cancelar OS</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
