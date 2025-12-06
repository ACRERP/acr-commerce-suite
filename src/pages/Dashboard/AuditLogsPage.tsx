import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryAuditLogs, ACTION_LABELS, ENTITY_LABELS, AuditAction, EntityType, AuditLog } from '@/lib/auditLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    FileText,
    RefreshCw,
    Calendar,
    User,
    Eye,
    ShoppingCart,
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    LogIn,
    LogOut,
    XCircle,
    Pause,
    Play,
    Percent,
    Plus,
    Minus,
    CreditCard,
} from 'lucide-react';

const ACTION_ICONS: Record<AuditAction, React.ReactNode> = {
    cash_open: <Wallet className="h-4 w-4 text-green-500" />,
    cash_close: <XCircle className="h-4 w-4 text-red-500" />,
    sale_create: <ShoppingCart className="h-4 w-4 text-blue-500" />,
    sale_cancel: <XCircle className="h-4 w-4 text-red-500" />,
    sale_suspend: <Pause className="h-4 w-4 text-yellow-500" />,
    sale_resume: <Play className="h-4 w-4 text-green-500" />,
    withdrawal: <ArrowDownCircle className="h-4 w-4 text-red-500" />,
    reinforcement: <ArrowUpCircle className="h-4 w-4 text-green-500" />,
    discount_apply: <Percent className="h-4 w-4 text-purple-500" />,
    item_add: <Plus className="h-4 w-4 text-green-500" />,
    item_remove: <Minus className="h-4 w-4 text-red-500" />,
    payment_add: <CreditCard className="h-4 w-4 text-blue-500" />,
    login: <LogIn className="h-4 w-4 text-green-500" />,
    logout: <LogOut className="h-4 w-4 text-gray-500" />,
};

export function AuditLogsPage() {
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [selectedEntity, setSelectedEntity] = useState<string>('all');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const { data: logs = [], isLoading, refetch } = useQuery({
        queryKey: ['audit-logs', startDate, endDate, selectedAction, selectedEntity],
        queryFn: async () => {
            return queryAuditLogs({
                startDate,
                endDate,
                action: selectedAction !== 'all' ? selectedAction as AuditAction : undefined,
                entityType: selectedEntity !== 'all' ? selectedEntity as EntityType : undefined,
                limit: 100,
            });
        },
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
                    <p className="text-gray-500">Histórico de todas as operações do PDV</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                            <span className="text-gray-400">até</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>

                        <Select value={selectedAction} onValueChange={setSelectedAction}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Tipo de Ação" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Ações</SelectItem>
                                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Entidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button onClick={() => refetch()} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Atualizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Registros ({logs.length})
                    </CardTitle>
                    <CardDescription>
                        Clique em um registro para ver detalhes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum registro encontrado</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Entidade</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Caixa</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id} className="cursor-pointer hover:bg-gray-50">
                                        <TableCell className="text-sm">
                                            {new Date(log.created_at).toLocaleString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {ACTION_ICONS[log.action]}
                                                <span>{ACTION_LABELS[log.action]}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {ENTITY_LABELS[log.entity_type]}
                                                {log.entity_id && ` #${log.entity_id}`}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3 text-gray-400" />
                                                <span className="text-sm">{log.user_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {log.cash_register_id ? `#${log.cash_register_id}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Log Detail Modal */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedLog && ACTION_ICONS[selectedLog.action]}
                            Detalhes do Log
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">ID:</span>
                                    <span className="ml-2 font-medium">#{selectedLog.id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Data:</span>
                                    <span className="ml-2">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Ação:</span>
                                    <span className="ml-2">{ACTION_LABELS[selectedLog.action]}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Entidade:</span>
                                    <span className="ml-2">{ENTITY_LABELS[selectedLog.entity_type]} #{selectedLog.entity_id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Usuário:</span>
                                    <span className="ml-2">{selectedLog.user_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Caixa:</span>
                                    <span className="ml-2">{selectedLog.cash_register_id ? `#${selectedLog.cash_register_id}` : '-'}</span>
                                </div>
                            </div>

                            {selectedLog.notes && (
                                <div>
                                    <span className="text-gray-500 text-sm">Notas:</span>
                                    <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{selectedLog.notes}</p>
                                </div>
                            )}

                            {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                                <div>
                                    <span className="text-gray-500 text-sm">Valores Anteriores:</span>
                                    <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-auto">
                                        {JSON.stringify(selectedLog.old_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                                <div>
                                    <span className="text-gray-500 text-sm">Novos Valores:</span>
                                    <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-auto">
                                        {JSON.stringify(selectedLog.new_values, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="pt-2 border-t text-xs text-gray-400">
                                <div>IP: {selectedLog.ip_address || 'N/A'}</div>
                                <div className="truncate">User Agent: {selectedLog.user_agent || 'N/A'}</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
