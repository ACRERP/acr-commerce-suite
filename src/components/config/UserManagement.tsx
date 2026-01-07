import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserRole, updateUserStatus } from '@/lib/rbac-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { User, Shield, Key, Mail, MoreVertical, Edit2, Trash2, Plus, Users, PauseCircle, PlayCircle, Loader2, CheckCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabaseClient';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UserManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // States for forms
    const [newRole, setNewRole] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('vendas');
    const [invitePassword, setInvitePassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });

    // Mutation: Update Role
    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            updateUserRole(userId, role as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso!', description: 'Permissão atualizada.' });
            setIsEditRoleOpen(false);
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Falha ao atualizar permissão.', variant: 'destructive' });
        },
    });

    // Mutation: Toggle Active Status
    const toggleStatusMutation = useMutation({
        mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
            updateUserStatus(userId, isActive ? 'active' : 'inactive'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: 'Sucesso!', description: 'Status do usuário atualizado.' });
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Falha ao alterar status.', variant: 'destructive' });
        },
    });

    // Mutation: Invite User via Edge Function
    const inviteUserMutation = useMutation({
        mutationFn: async (data: any) => {
            const { data: resData, error } = await supabase.functions.invoke('invite-user', {
                body: { email: data.email, role: data.role }
            });

            if (error) {
                console.error("Function error:", error);
                throw error;
            }

            // Invoke returns 200 even for app-level errors sometimes, but usually throws if 4xx/5xx if not handled?
            // Supabase functions client throws on network error, but if function returns 400 with json error, it might be in `error` or data.
            // Let's rely on my function returning 400 status which `invoke` should catch or let's check resData.
            if (resData?.error) {
                throw new Error(resData.error);
            }

            return resData;
        },
        onSuccess: () => {
            toast({
                title: 'Convite Enviado!',
                description: `O email foi enviado para ${inviteEmail}. O usuário receberá um link para definir a senha.`,
                variant: 'default'
            });
            setIsInviteOpen(false);
            setInviteEmail('');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao criar usuário',
                description: error.message || 'Verifique se você tem permissão ou se o email é válido.',
                variant: 'destructive'
            });
        }
    });

    // Mutation: Delete User
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { data: resData, error } = await supabase.functions.invoke('delete-user', {
                body: { userId }
            });
            if (error) throw error;
            if (resData?.error) throw new Error(resData.error);
            return resData;
        },
        onSuccess: () => {
            toast({ title: 'Usuário excluído', description: 'O usuário foi removido permanentemente.', variant: 'default' });
            setIsDeleteConfirmOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
        }
    });

    const handleEditRole = (user: any) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsEditRoleOpen(true);
    };

    const handleToggleStatus = (user: any) => {
        toggleStatusMutation.mutate({
            userId: user.id,
            isActive: !user.is_active
        });
    };

    const handleSaveRole = () => {
        if (selectedUser && newRole) {
            updateRoleMutation.mutate({
                userId: selectedUser.id,
                role: newRole,
            });
        }
    };

    const handleInviteUser = () => {
        inviteUserMutation.mutate({
            email: inviteEmail,
            role: inviteRole,
        });
    };

    const roleColors: Record<string, string> = {
        admin: 'bg-red-100 text-red-700 border-red-200',
        manager: 'bg-purple-100 text-purple-700 border-purple-200',
        vendas: 'bg-blue-100 text-blue-700 border-blue-200',
        stock: 'bg-orange-100 text-orange-700 border-orange-200',
        financial: 'bg-green-100 text-green-700 border-green-200',
        estoque: 'bg-orange-100 text-orange-700 border-orange-200', // alias for stock
    };

    const roleLabels: Record<string, string> = {
        admin: 'Administrador',
        manager: 'Gerente',
        vendas: 'Vendedor',
        stock: 'Estoquista',
        financial: 'Financeiro',
        estoque: 'Estoque',
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
                <Button onClick={() => setIsInviteOpen(true)} className="btn-primary hover-lift gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Usuário
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
                        <div key={user.id} className={`card-premium group relative hover-lift p-6 border-l-4 ${user.is_active === false ? 'border-l-neutral-400 opacity-75 grayscale' : 'border-l-primary-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${user.is_active === false ? 'bg-neutral-200 text-neutral-500' : 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700'}`}>
                                    {user.email?.charAt(0).toUpperCase() || '?'}
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
                                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsPasswordResetOpen(true); }}>
                                            <Key className="w-4 h-4 mr-2" />
                                            Redefinir Senha
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />

                                        {/* Aprovar / Ativar */}
                                        {user.is_active === false && (
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user)} className="text-green-600 focus:text-green-700 focus:bg-green-50">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Aprovar Acesso (Ativar)
                                            </DropdownMenuItem>
                                        )}

                                        {/* Pausar / Desativar */}
                                        {user.is_active !== false && (
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user)} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                                <PauseCircle className="w-4 h-4 mr-2" />
                                                Pausar Acesso
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />
                                        {/* Excluir */}
                                        <DropdownMenuItem
                                            onClick={() => { setSelectedUser(user); setIsDeleteConfirmOpen(true); }}
                                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Excluir Usuário
                                        </DropdownMenuItem>

                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-bold text-neutral-900 dark:text-white truncate" title={user.email}>
                                    {user.email?.split('@')[0] || 'Usuário'}
                                </h4>
                                <span className="text-xs text-neutral-500 truncate block">{user.email}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <Badge variant="outline" className={`${roleColors[user.role] || 'bg-neutral-100 text-neutral-600'} border-0 px-2 py-1`}>
                                    <Shield className="w-3 h-3 mr-1" />
                                    {roleLabels[user.role] || user.role}
                                </Badge>
                                <div className={`text-xs font-medium ${user.is_active === false ? 'text-neutral-400' : 'text-green-600 flex items-center gap-1'}`}>
                                    {user.is_active === false ? 'Inativo' : (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Ativo
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dialog Edit Role */}
            <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Permissão</DialogTitle>
                        <DialogDescription>
                            Alterar o nível de acesso de <span className="font-bold">{selectedUser?.email}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Função / Cargo</label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione uma função" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador (Total)</SelectItem>
                                    <SelectItem value="manager">Gerente (Supervisão)</SelectItem>
                                    <SelectItem value="vendas">Vendedor (PDV + Clientes)</SelectItem>
                                    <SelectItem value="stock">Estoquista (Produtos + Estoque)</SelectItem>
                                    <SelectItem value="financial">Financeiro (Fluxo de Caixa)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>Cancelar</Button>
                        <Button className="btn-primary" onClick={handleSaveRole} disabled={updateRoleMutation.isPending}>
                            {updateRoleMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Invite User */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Usuário</DialogTitle>
                        <DialogDescription>
                            Envie um convite por email para um novo colaborador.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                placeholder="usuario@acr.com.br"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Função Inicial</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="vendas">Vendedor</SelectItem>
                                    <SelectItem value="financial">Financeiro</SelectItem>
                                    <SelectItem value="stock">Estoque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
                        <Button className="btn-primary" onClick={handleInviteUser} disabled={inviteUserMutation.isPending}>
                            {inviteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Acesso'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Password Reset */}
            <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Redefinir Senha</DialogTitle>
                        <DialogDescription>
                            Defina uma nova senha para <span className="font-bold">{selectedUser?.email}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordResetOpen(false)}>Cancelar</Button>
                        <Button className="btn-primary" onClick={() => {
                            toast({ title: "Simulação", description: "Em produção, isso chamaria a API de reset de senha." });
                            setIsPasswordResetOpen(false);
                        }}>
                            Salvar Senha
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Delete Confirmation */}
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{selectedUser?.email}</strong>?
                            <br /><br />
                            Esta ação é irreversível e removerá o acesso imediatamente. O histórico de logs será mantido (System Policy).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            disabled={deleteUserMutation.isPending}
                        >
                            {deleteUserMutation.isPending ? 'Excluindo...' : 'Sim, Excluir Permanentemente'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
