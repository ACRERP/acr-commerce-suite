import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserRole } from '@/lib/rbac-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Key, Mail, MoreVertical, Edit2, Trash2, Plus, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            updateUserRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso!', description: 'Permissão atualizada.' });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Erro!',
                description: 'Falha ao atualizar permissão.',
                variant: 'destructive',
            });
        },
    });

    const handleEditRole = (user: any) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsDialogOpen(true);
    };

    const handleSaveRole = () => {
        if (selectedUser && newRole) {
            updateRoleMutation.mutate({
                userId: selectedUser.id,
                role: newRole,
            });
        }
    };

    const roleColors: Record<string, string> = {
        admin: 'bg-red-100 text-red-700 border-red-200',
        manager: 'bg-purple-100 text-purple-700 border-purple-200',
        sales: 'bg-blue-100 text-blue-700 border-blue-200',
        stock: 'bg-orange-100 text-orange-700 border-orange-200',
        financial: 'bg-green-100 text-green-700 border-green-200',
    };

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        manager: 'Gerente',
        sales: 'Vendedor',
        stock: 'Estoquista',
        financial: 'Financeiro',
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" />
                        Gestão de Acesso
                    </h3>
                    <p className="text-sm text-neutral-500">Controle quem tem acesso ao sistema e suas permissões</p>
                </div>
                <Button className="btn-primary hover-lift gap-2">
                    <Plus className="w-4 h-4" />
                    Convidar Usuário
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users?.map((user: any) => (
                        <div key={user.id} className="card-premium group relative hover-lift p-6 border-l-4 border-l-primary-500">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-lg">
                                    {user.email.charAt(0).toUpperCase()}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4 text-neutral-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditRole(user)}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Editar Permissões
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remover Acesso
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-bold text-neutral-900 dark:text-white truncate" title={user.email}>
                                    {user.email.split('@')[0]}
                                </h4>
                                <span className="text-xs text-neutral-500 truncate block">{user.email}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <Badge variant="outline" className={`${roleColors[user.role] || 'bg-neutral-100 text-neutral-600'} border-0 px-2 py-1`}>
                                    <Shield className="w-3 h-3 mr-1" />
                                    {roleLabels[user.role] || user.role}
                                </Badge>
                                <div className="text-xs text-neutral-400 font-medium">
                                    Ativo agora
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialog Edição de Role */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Permissão</DialogTitle>
                        <DialogDescription>
                            Alterar o nível de acesso do usuário <span className="font-bold text-neutral-900">{selectedUser?.email}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                <div className="flex gap-3">
                                    <Shield className="w-5 h-5 text-yellow-600" />
                                    <div>
                                        <h4 className="font-bold text-sm text-yellow-800">Cuidado com permissões</h4>
                                        <p className="text-xs text-yellow-700 mt-1">Administradores têm acesso total ao sistema, incluindo configurações financeiras.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Função / Cargo</label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione uma função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador (Total)</SelectItem>
                                        <SelectItem value="manager">Gerente (Supervisão)</SelectItem>
                                        <SelectItem value="sales">Vendedor (PDV + Clientes)</SelectItem>
                                        <SelectItem value="stock">Estoquista (Produtos + Estoque)</SelectItem>
                                        <SelectItem value="financial">Financeiro (Fluxo de Caixa)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="btn-primary"
                            onClick={handleSaveRole}
                            disabled={updateRoleMutation.isPending}
                        >
                            {updateRoleMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
