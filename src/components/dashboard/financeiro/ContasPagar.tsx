import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountsPayable {
    id: number;
    description: string;
    category: string;
    amount: number;
    due_date: string;
    payment_date: string | null;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    payment_method: string | null;
    supplier_id: string | null;
    notes: string | null;
}

export function ContasPagar() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch accounts payable
    const { data: accountsPayable, isLoading } = useQuery({
        queryKey: ['accounts-payable', filterStatus],
        queryFn: async () => {
            let query = supabase
                .from('accounts_payable')
                .select('*')
                .order('due_date', { ascending: true });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as AccountsPayable[];
        },
    });

    // Create account payable mutation
    const createMutation = useMutation({
        mutationFn: async (newAccount: Partial<AccountsPayable>) => {
            const { data, error } = await supabase
                .from('accounts_payable')
                .insert([newAccount])
                .select();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
            toast({ title: 'Sucesso!', description: 'Conta a pagar criada com sucesso.' });
            setIsDialogOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro!',
                description: `Não foi possível criar a conta: ${error.message}`,
                variant: 'destructive',
            });
        },
    });

    // Pay account mutation
    const payMutation = useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from('accounts_payable')
                .update({ status: 'paid', payment_date: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
            toast({ title: 'Sucesso!', description: 'Conta marcada como paga.' });
        },
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'overdue':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-gray-600" />;
            default:
                return <Clock className="h-4 w-4 text-yellow-600" />;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            pending: 'Pendente',
            paid: 'Paga',
            overdue: 'Atrasada',
            cancelled: 'Cancelada',
        };
        return labels[status as keyof typeof labels] || status;
    };

    const filteredAccounts = accountsPayable?.filter((account) =>
        account.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPending = accountsPayable
        ?.filter((a) => a.status === 'pending' || a.status === 'overdue')
        .reduce((sum, a) => sum + a.amount, 0) || 0;

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Total a Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                        R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-500">Contas pendentes e atrasadas</p>
                </CardContent>
            </Card>

            {/* Filters and Actions */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por descrição..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="overdue">Atrasadas</SelectItem>
                            <SelectItem value="paid">Pagas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Conta a Pagar
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredAccounts?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500">
                                        Nenhuma conta a pagar encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAccounts?.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(account.status)}
                                                <span className="text-sm">{getStatusLabel(account.status)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{account.description}</TableCell>
                                        <TableCell>{account.category || '-'}</TableCell>
                                        <TableCell className="font-semibold">
                                            R$ {account.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            {account.status === 'pending' || account.status === 'overdue' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => payMutation.mutate(account.id)}
                                                >
                                                    Baixar
                                                </Button>
                                            ) : (
                                                <span className="text-sm text-gray-500">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Nova Conta a Pagar</DialogTitle>
                        <DialogDescription>
                            Cadastre uma nova conta a pagar no sistema
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createMutation.mutate({
                                description: formData.get('description') as string,
                                category: formData.get('category') as string,
                                amount: parseFloat(formData.get('amount') as string),
                                due_date: formData.get('due_date') as string,
                                payment_method: formData.get('payment_method') as string,
                                notes: formData.get('notes') as string,
                                status: 'pending',
                            });
                        }}
                    >
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição *</Label>
                                    <Input id="description" name="description" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoria</Label>
                                    <Input id="category" name="category" placeholder="Ex: Aluguel, Luz, etc" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Valor *</Label>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Vencimento *</Label>
                                    <Input id="due_date" name="due_date" type="date" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                                <Select name="payment_method">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                        <SelectItem value="cartao">Cartão</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea id="notes" name="notes" rows={3} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
