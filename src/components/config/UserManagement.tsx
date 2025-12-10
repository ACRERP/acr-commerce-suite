import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, getRoles, assignRole, removeRole, type User, type Role } from '@/lib/rbac-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, Plus, Trash2, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function UserManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);

    // Queries
    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['rbac-users'],
        queryFn: getUsers
    });

    const { data: roles = [], isLoading: loadingRoles } = useQuery({
        queryKey: ['rbac-roles'],
        queryFn: getRoles
    });

    // Mutations
    const assignRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) =>
            assignRole(userId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
            toast({
                title: 'Sucesso!',
                description: 'Papel atribuído com sucesso.',
            });
            setSelectedUser(null);
            setSelectedRole(null);
        },
        onError: () => {
            toast({
                title: 'Erro!',
                description: 'Não foi possível atribuir o papel.',
                variant: 'destructive',
            });
        },
    });

    const removeRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) =>
            removeRole(userId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
            toast({
                title: 'Sucesso!',
                description: 'Papel removido com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro!',
                description: 'Não foi possível remover o papel.',
                variant: 'destructive',
            });
        },
    });

    const handleAssignRole = () => {
        if (selectedUser && selectedRole) {
            assignRoleMutation.mutate({ userId: selectedUser, roleId: selectedRole });
        }
    };

    const handleRemoveRole = (userId: string, roleId: number) => {
        if (confirm('Tem certeza que deseja remover este papel?')) {
            removeRoleMutation.mutate({ userId, roleId });
        }
    };

    const getRoleBadgeColor = (roleName: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            gerente: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            operador_pdv: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            caixa: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            entregador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            financeiro: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        };
        return colors[roleName] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    };

    if (loadingUsers || loadingRoles) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Gestão de Usuários e Permissões
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gerencie usuários e atribua papéis com permissões específicas.
                    </p>
                </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuários</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {users.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Papéis Disponíveis</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    {roles.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                                    {users.filter(u => u.roles?.some(r => r.name === 'admin')).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Usuários */}
            <Card>
                <CardHeader>
                    <CardTitle>Usuários do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        Usuário
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        Papéis
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        Criado em
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-wrap gap-2">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <div key={role.id} className="flex items-center gap-1">
                                                            <Badge className={getRoleBadgeColor(role.name)}>
                                                                {role.name}
                                                            </Badge>
                                                            {!role.is_system && (
                                                                <button
                                                                    onClick={() => handleRemoveRole(user.id, role.id)}
                                                                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-500">Sem papéis</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedUser(user.id)}
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Atribuir Papel
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Atribuir Papel */}
            {selectedUser && (
                <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Atribuir Papel</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Selecione o Papel</label>
                                <select
                                    value={selectedRole || ''}
                                    onChange={(e) => setSelectedRole(Number(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                                >
                                    <option value="">Selecione...</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name} - {role.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleAssignRole}
                                    disabled={!selectedRole || assignRoleMutation.isPending}
                                    className="flex-1"
                                >
                                    Atribuir
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setSelectedRole(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
