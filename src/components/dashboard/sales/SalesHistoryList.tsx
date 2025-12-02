import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { MoreHorizontal, Eye, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Sale {
  id: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
  status: 'concluida' | 'cancelada' | 'pendente';
  clients: { name: string }[] | null;
  sale_items?: {
    quantity: number;
    price: number;
    products: { name: string }[];
  }[];
}

async function fetchSalesHistory() {
  const { data, error } = await supabase
    .from('sales')
    .select(`id, created_at, total_amount, payment_method, status, clients (name), sale_items (quantity, price, products (name))`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

async function cancelSale(saleId: number) {
  // 1. Buscar itens da venda para estornar estoque
  const { data: saleItems, error: itemsError } = await supabase
    .from('sale_items')
    .select('product_id, quantity')
    .eq('sale_id', saleId);

  if (itemsError) throw itemsError;

  // 2. Estornar estoque de cada produto
  for (const item of saleItems || []) {
    const { error: stockError } = await supabase.rpc('increment_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (stockError) throw new Error(`Erro ao estornar estoque: ${stockError.message}`);
  }

  // 3. Atualizar status da venda
  const { error: updateError } = await supabase
    .from('sales')
    .update({ status: 'cancelada' })
    .eq('id', saleId);

  if (updateError) throw updateError;

  return true;
}

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  concluida: 'default',
  pendente: 'secondary',
  cancelada: 'destructive',
};

export function SalesHistoryList() {
  const [saleToCancel, setSaleToCancel] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: sales, isLoading, isError, error } = useQuery<Sale[], Error>({
    queryKey: ['salesHistory'],
    queryFn: fetchSalesHistory,
  });

  const cancelSaleMutation = useMutation({
    mutationFn: cancelSale,
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Venda cancelada e estoque estornado.' });
      queryClient.invalidateQueries({ queryKey: ['salesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSaleToCancel(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Erro!', description: error.message, variant: 'destructive' });
    },
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
    return <div className="text-red-500">Erro ao carregar o histórico: {error.message}</div>;
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Venda</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales?.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">#{sale.id}</TableCell>
                <TableCell>{new Date(sale.created_at).toLocaleString('pt-BR')}</TableCell>
                <TableCell>{sale.clients && sale.clients.length > 0 ? sale.clients[0].name : 'N/A'}</TableCell>
                <TableCell>R$ {sale.total_amount.toFixed(2)}</TableCell>
                <TableCell>{sale.payment_method.replace('_', ' ')}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[sale.status]}>{sale.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-500"
                        onClick={() => setSaleToCancel(sale.id)}
                        disabled={sale.status === 'cancelada'}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar Venda
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={saleToCancel !== null} onOpenChange={() => setSaleToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta venda? O estoque dos produtos será estornado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saleToCancel && cancelSaleMutation.mutate(saleToCancel)}
              disabled={cancelSaleMutation.isPending}
            >
              {cancelSaleMutation.isPending ? 'Cancelando...' : 'Sim, cancelar venda'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
