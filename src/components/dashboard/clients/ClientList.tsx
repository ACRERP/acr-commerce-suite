import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, CheckCircle, AlertCircle, User, Building, ShoppingCart, CreditCard, Target } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { validateCPFCNPJ, getDocumentType } from '@/lib/validation';

export interface Client {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  cpf_cnpj: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) throw new Error(error.message);
  return data;
}

interface ClientListProps {
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
  onViewPurchaseHistory?: (client: Client) => void;
  onManageCreditLimit?: (client: Client) => void;
  onViewSegmentation?: (client: Client) => void;
}

export function ClientList({ onEditClient, onDeleteClient, onViewPurchaseHistory, onManageCreditLimit, onViewSegmentation }: ClientListProps) {
  const { data: clients, isLoading, isError, error } = useQuery<Client[], Error>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Erro ao carregar clientes: {error.message}</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients?.map((client) => {
            const documentValidation = client.cpf_cnpj ? validateCPFCNPJ(client.cpf_cnpj) : null;
            const documentType = client.cpf_cnpj ? getDocumentType(client.cpf_cnpj) : null;
            
            return (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.phone || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {client.cpf_cnpj ? (
                      <>
                        <span className="text-sm">{client.cpf_cnpj}</span>
                        {documentValidation && (
                          <div className="flex items-center gap-1">
                            {documentValidation.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            {documentType && (
                              <Badge variant="outline" className="text-xs">
                                {documentType === 'cpf' ? (
                                  <><User className="h-3 w-3 mr-1" />CPF</>
                                ) : (
                                  <><Building className="h-3 w-3 mr-1" />CNPJ</>
                                )}
                              </Badge>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Sem documento</span>
                    )}
                  </div>
                </TableCell>
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
                      <DropdownMenuItem onClick={() => onEditClient(client)}>Editar</DropdownMenuItem>
                      {onViewPurchaseHistory && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onViewPurchaseHistory(client)}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Histórico de Compras
                          </DropdownMenuItem>
                        </>
                      )}
                      {onManageCreditLimit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onManageCreditLimit(client)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Gerenciar Crédito
                          </DropdownMenuItem>
                        </>
                      )}
                      {onViewSegmentation && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onViewSegmentation(client)}>
                            <Target className="h-4 w-4 mr-2" />
                            Segmentação
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDeleteClient(client)} className="text-red-500">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
