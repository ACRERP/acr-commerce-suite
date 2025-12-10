import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoles, createRole, updateRole, deleteRole, MODULES, ACTIONS, type Role, type Module, type Action } from '@/lib/rbac-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Edit, Trash2, Save, X } from 'lucide-react';

export function RoleEditor() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');
    const [permissions, setPermissions] = useState<Record<string, any>>({});

    // Query
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['rbac-roles'],
        queryFn: getRoles
    });

    // Mutations
    const createRoleMutation = useMutation({
        mutationFn: createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
            toast({ title: 'Sucesso!', description: 'Papel criado com sucesso.' });
            closeModal();
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Não foi possível criar o papel.', variant: 'destructive' });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: Partial<Role> }) => updateRole(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
            toast({ title: 'Sucesso!', description: 'Papel atualizado com sucesso.' });
            closeModal();
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Não foi possível atualizar o papel.', variant: 'destructive' });
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
            toast({ title: 'Sucesso!', description: 'Papel deletado com sucesso.' });
        },
        onError: (error: any) => {
            toast({ title: 'Erro!', description: error.message || 'Não foi possível deletar o papel.', variant: 'destructive' });
        },
    });

    const openModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setRoleName(role.name);
            setRoleDescription(role.description || '');
            setPermissions(role.permissions || {});
        } else {
            setEditingRole(null);
            setRoleName('');
            setRoleDescription('');
            setPermissions({});
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setRoleName('');
        setRoleDescription('');
        setPermissions({});
    };

    const handleSave = () => {
        const roleData = {
            name: roleName,
            description: roleDescription,
            permissions,
        };

        if (editingRole) {
            updateRoleMutation.mutate({ id: editingRole.id, updates: roleData });
        } else {
            createRoleMutation.mutate(roleData);
        }
    };

    const handleDelete = (role: Role) => {
        if (role.is_system) {
            toast({ title: 'Erro!', description: 'Não é possível deletar papéis do sistema.', variant: 'destructive' });
            return;
        }
        if (confirm(`Tem certeza que deseja deletar o papel "${role.name}"?`)) {
            deleteRoleMutation.mutate(role.id);
        }
    };

    const togglePermission = (module: string, action: string) => {
        setPermissions(prev => ({
            ...prev,
            [module]: {
                ...prev[module],
                [action]: !prev[module]?.[action]
            }
        }));
    };

    if (isLoading) {
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
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Editor de Papéis e Permissões
                        </CardTitle>
                        <Button onClick={() => openModal()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Papel
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Lista de Papéis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                    <Card key={role.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {role.name}
                                        {role.is_system && (
                                            <Badge variant="secondary" className="text-xs">Sistema</Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {role.description}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openModal(role)}
                                    className="flex-1"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                </Button>
                                {!role.is_system && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(role)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal de Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    {editingRole ? 'Editar Papel' : 'Novo Papel'}
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={closeModal}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Informações Básicas */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nome do Papel</Label>
                                    <Input
                                        id="name"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="ex: gerente_vendas"
                                        disabled={editingRole?.is_system}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Descrição</Label>
                                    <Input
                                        id="description"
                                        value={roleDescription}
                                        onChange={(e) => setRoleDescription(e.target.value)}
                                        placeholder="Descreva as responsabilidades deste papel"
                                    />
                                </div>
                            </div>

                            {/* Grid de Permissões */}
                            <div>
                                <h3 className="font-semibold mb-4">Permissões</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2 font-semibold">Módulo</th>
                                                {ACTIONS.map(action => (
                                                    <th key={action} className="text-center p-2 text-xs font-semibold">
                                                        {action}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {MODULES.map(module => (
                                                <tr key={module} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="p-2 font-medium text-sm">{module}</td>
                                                    {ACTIONS.map(action => (
                                                        <td key={action} className="text-center p-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={permissions[module]?.[action] || false}
                                                                onChange={() => togglePermission(module, action)}
                                                                className="w-4 h-4 cursor-pointer"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={closeModal}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!roleName || createRoleMutation.isPending || updateRoleMutation.isPending}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
