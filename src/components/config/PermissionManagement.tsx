import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacService } from '@/lib/rbac-service';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save, Loader2, Info } from 'lucide-react';

const APP_MODULES = [
    { id: 'pdv', name: 'PDV / Caixa' },
    { id: 'sales', name: 'Vendas / Pedidos' },
    { id: 'purchases', name: 'Compras' },
    { id: 'inventory', name: 'Estoque / Produtos' },
    { id: 'finance', name: 'Financeiro' },
    { id: 'reports', name: 'Relatórios' },
    { id: 'fiscal', name: 'Fiscal' },
    { id: 'clients', name: 'Clientes / CRM' },
    { id: 'delivery', name: 'Delivery / Motoboy' },
    { id: 'kitchen', name: 'Gastronomia (Mesas/KDS)' },
    { id: 'service_orders', name: 'OS / Serviços' },
    { id: 'scheduling', name: 'Agenda' },
    { id: 'projects', name: 'Projetos' },
    { id: 'fleet', name: 'Frota' },
    { id: 'production', name: 'Produção' },
    { id: 'team', name: 'Equipe' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'academic', name: 'Acadêmico' },
    { id: 'compliance', name: 'Compliance' },
];

const ROLES = ['admin', 'vendas', 'financeiro', 'estoque'];

export function PermissionManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});

    // Queries
    const { data: dbPermissions, isLoading } = useQuery({
        queryKey: ['role-modules'],
        queryFn: () => rbacService.getRoleModules()
    });

    useEffect(() => {
        if (dbPermissions) {
            setLocalPermissions(dbPermissions);
        }
    }, [dbPermissions]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async ({ role, modules }: { role: string, modules: string[] }) => {
            return rbacService.updateRoleModules(role, modules);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role-modules'] });
            toast({ title: "Sucesso", description: "Permissões atualizadas!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao salvar permissões.", variant: "destructive" });
        }
    });

    const handleToggle = (role: string, moduleId: string) => {
        if (role === 'admin') return; // Admin case is handled separately or fixed

        setLocalPermissions(prev => {
            const currentModules = prev[role] || [];
            const newModules = currentModules.includes(moduleId)
                ? currentModules.filter(id => id !== moduleId)
                : [...currentModules, moduleId];

            return { ...prev, [role]: newModules };
        });
    };

    const handleSaveRole = (role: string) => {
        saveMutation.mutate({ role, modules: localPermissions[role] || [] });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                        <Shield className="w-5 h-5 text-primary-500" />
                        Matriz de Permissões (RBAC)
                    </h3>
                    <p className="text-sm text-neutral-500">Escolha quais módulos estão visíveis para cada cargo no sistema.</p>
                </div>
            </div>

            <div className="card-premium overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                            <th className="p-4 text-left border-b border-neutral-100 dark:border-neutral-800">Módulo</th>
                            {ROLES.map(role => (
                                <th key={role} className="p-4 text-center border-b border-neutral-100 dark:border-neutral-800 uppercase text-xs font-bold tracking-widest">
                                    {role}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {APP_MODULES.map(module => (
                            <tr key={module.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                                <td className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{module.name}</span>
                                    <code className="ml-2 py-0.5 px-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] text-neutral-500 uppercase">{module.id}</code>
                                </td>
                                {ROLES.map(role => (
                                    <td key={role} className="p-4 text-center border-b border-neutral-100 dark:border-neutral-800">
                                        {role === 'admin' ? (
                                            <div className="flex justify-center">
                                                <div className="w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-sm bg-green-500" />
                                                </div>
                                            </div>
                                        ) : (
                                            <Checkbox
                                                checked={(localPermissions[role] || []).includes(module.id) || (localPermissions[role] || []).includes('*')}
                                                onCheckedChange={() => handleToggle(role, module.id)}
                                                className="data-[state=checked]:bg-primary tracking-widest"
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="p-4" />
                            {ROLES.map(role => (
                                <td key={role} className="p-4 text-center">
                                    {role !== 'admin' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-2"
                                            onClick={() => handleSaveRole(role)}
                                            disabled={saveMutation.isPending}
                                        >
                                            <Save className="w-3 h-3" />
                                            Salvar {role}
                                        </Button>
                                    )}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>Dica Técnica:</strong> As alterações de permissão afetam apenas a visibilidade na barra lateral e o acesso às rotas principais.
                    Usuários Administradores sempre terão acesso a todos os módulos, independentemente da configuração aqui realizada.
                </div>
            </div>
        </div>
    );
}
