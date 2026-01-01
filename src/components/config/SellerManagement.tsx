import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService } from '@/lib/rbac-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, UserPlus, DollarSign, Target, Phone, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SellerManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<any>(null);

    // Queries
    const { data: sellers, isLoading: loadingSellers } = useQuery({
        queryKey: ['sellers'],
        queryFn: () => rbacService.listSellers()
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => rbacService.listUsers()
    });

    // Mutations
    const upsertMutation = useMutation({
        mutationFn: (data: any) => rbacService.upsertSeller(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sellers'] });
            toast({ title: "Sucesso", description: "Vendedor salvo com sucesso!" });
            setIsDialogOpen(false);
            setSelectedSeller(null);
        },
        onError: (err) => {
            toast({ title: "Erro", description: "Falha ao salvar vendedor.", variant: "destructive" });
        }
    });

    const handleEdit = (seller: any) => {
        setSelectedSeller(seller);
        setIsDialogOpen(true);
    };

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
            id: selectedSeller?.id || formData.get('user_id'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            commission_rate: parseFloat(formData.get('commission_rate') as string || '0'),
            monthly_goal: parseFloat(formData.get('monthly_goal') as string || '0'),
            is_active: true
        };

        if (!data.id || !data.name) {
            toast({ title: "Erro", description: "Nome e Usuário são obrigatórios.", variant: "destructive" });
            return;
        }

        upsertMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                        <UserPlus className="w-5 h-5 text-primary-500" />
                        Cadastro de Vendedores
                    </h3>
                    <p className="text-sm text-neutral-500">Gerencie a força de vendas, comissões e metas mensais</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="btn-primary gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Vendedor
                </Button>
            </div>

            <div className="card-premium overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-neutral-50 dark:bg-neutral-900/50">
                            <TableHead>Vendedor</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Comissão (%)</TableHead>
                            <TableHead>Meta Mensal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingSellers ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : sellers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-neutral-500 italic">
                                    Nenhum vendedor cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sellers?.map((seller: any) => (
                                <TableRow key={seller.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors">
                                    <TableCell className="font-bold text-neutral-900 dark:text-white uppercase italic tracking-tighter">
                                        {seller.name}
                                    </TableCell>
                                    <TableCell className="text-neutral-500">{seller.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {seller.commission_rate}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-neutral-900 dark:text-neutral-400">
                                        R$ {seller.monthly_goal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={seller.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                            {seller.is_active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(seller)}>
                                            <Edit2 className="w-4 h-4 text-neutral-400 hover:text-primary transition-colors" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(val) => { setIsDialogOpen(val); if (!val) setSelectedSeller(null); }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{selectedSeller ? 'Editar Vendedor' : 'Novo Vendedor'}</DialogTitle>
                        <DialogDescription>Preencha os dados do colaborador para habilitar comissões e metas.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        {!selectedSeller && (
                            <div className="space-y-2">
                                <Label>Vincular a Usuário</Label>
                                <select
                                    name="user_id"
                                    className="w-full flex h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Selecione um usuário do sistema...</option>
                                    {users?.filter((u: any) => !sellers?.some((s: any) => s.id === u.id)).map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.email}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Nome de Exibição</Label>
                            <Input name="name" defaultValue={selectedSeller?.name} placeholder="Ex: JOÃO DA SILVA" required />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Comissão (%)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                                    <Input name="commission_rate" type="number" step="0.1" defaultValue={selectedSeller?.commission_rate || 0} className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Mensal (R$)</Label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                                    <Input name="monthly_goal" type="number" step="100" defaultValue={selectedSeller?.monthly_goal || 0} className="pl-9" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Telefone / WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                                <Input name="phone" defaultValue={selectedSeller?.phone} placeholder="(00) 00000-0000" className="pl-9" />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="btn-primary" disabled={upsertMutation.isPending}>
                                {upsertMutation.isPending ? 'Salvando...' : 'Salvar Vendedor'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
