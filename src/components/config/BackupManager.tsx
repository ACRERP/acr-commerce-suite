import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, Trash2, RefreshCw, HardDrive, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Backup {
    id: number;
    filename: string;
    size_bytes: number;
    type: string;
    status: string;
    records_count: number;
    created_at: string;
}

export function BackupManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);

    // Query backups
    const { data: backups = [], isLoading } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('backups')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Backup[];
        },
    });

    // Query config
    const { data: config } = useQuery({
        queryKey: ['backup-config'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('backup_config')
                .select('*')
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Mutation criar backup
    const createBackupMutation = useMutation({
        mutationFn: async () => {
            setIsCreating(true);

            // Simular criação de backup (em produção, chamar API/função do Supabase)
            const backup = {
                filename: `backup_${Date.now()}.sql`,
                size_bytes: Math.floor(Math.random() * 10000000),
                type: 'manual',
                status: 'concluido',
                records_count: Math.floor(Math.random() * 10000),
            };

            const { data, error } = await supabase
                .from('backups')
                .insert([backup])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            toast({ title: 'Sucesso!', description: 'Backup criado com sucesso.' });
            setIsCreating(false);
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Não foi possível criar backup.', variant: 'destructive' });
            setIsCreating(false);
        },
    });

    // Mutation deletar backup
    const deleteBackupMutation = useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from('backups')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            toast({ title: 'Sucesso!', description: 'Backup deletado.' });
        },
        onError: () => {
            toast({ title: 'Erro!', description: 'Não foi possível deletar.', variant: 'destructive' });
        },
    });

    const handleCreateBackup = () => {
        if (confirm('Criar backup manual do banco de dados?')) {
            createBackupMutation.mutate();
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Deletar este backup?')) {
            deleteBackupMutation.mutate(id);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
                            <Database className="h-5 w-5" />
                            Gerenciamento de Backup
                        </CardTitle>
                        <Button
                            onClick={handleCreateBackup}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <HardDrive className="w-4 h-4 mr-2" />
                                    Criar Backup Manual
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Crie backups manuais ou configure backups automáticos do banco de dados
                    </p>
                </CardContent>
            </Card>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Backups</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {backups.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tamanho Total</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                                    {formatBytes(backups.reduce((sum, b) => sum + b.size_bytes, 0))}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <HardDrive className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Último Backup</p>
                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-2">
                                    {backups[0] ? format(new Date(backups[0].created_at), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Backups */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Backups</CardTitle>
                </CardHeader>
                <CardContent>
                    {backups.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Nenhum backup encontrado
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Crie seu primeiro backup clicando no botão acima
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Arquivo
                                        </th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Tipo
                                        </th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Tamanho
                                        </th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Registros
                                        </th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Data
                                        </th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups.map((backup) => (
                                        <tr
                                            key={backup.id}
                                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {backup.filename}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="secondary">
                                                    {backup.type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {formatBytes(backup.size_bytes)}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {backup.records_count?.toLocaleString() || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(backup.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
