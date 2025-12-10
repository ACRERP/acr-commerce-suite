import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { osService } from '@/lib/os/os-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Filter,
    Search,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Package,
    TrendingUp,
    Users
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OSForm } from '@/components/os/OSForm';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function OSPage() {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Queries
    const { data: dashboard, isLoading: loadingDashboard } = useQuery({
        queryKey: ['os-dashboard'],
        queryFn: () => osService.getDashboard(),
    });

    const { data: osKanban, isLoading: loadingKanban } = useQuery({
        queryKey: ['os-kanban'],
        queryFn: () => osService.getOSKanban(),
    });

    const { data: productivity, isLoading: loadingProductivity } = useQuery({
        queryKey: ['technician-productivity'],
        queryFn: () => osService.getTechnicianProductivity(),
    });

    // Filtros
    const filteredOS = osKanban?.filter(os => {
        if (selectedStatus !== 'all' && os.status !== selectedStatus) return false;
        if (selectedPriority !== 'all' && os.prioridade !== selectedPriority) return false;
        if (searchTerm && !os.numero?.includes(searchTerm) && !os.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    // Agrupar por status para Kanban
    const kanbanColumns = {
        'aberta': filteredOS?.filter(os => os.status === 'aberta') || [],
        'em_andamento': filteredOS?.filter(os => os.status === 'em_andamento') || [],
        'aguardando_peca': filteredOS?.filter(os => os.status === 'aguardando_peca') || [],
        'concluida': filteredOS?.filter(os => os.status === 'concluida') || [],
        'entregue': filteredOS?.filter(os => os.status === 'entregue') || [],
    };

    const statusLabels = {
        'aberta': 'Recebidas',
        'em_andamento': 'Em Reparo',
        'aguardando_peca': 'Aguardando Peça',
        'concluida': 'Concluídas',
        'entregue': 'Entregues',
    };

    const statusColors = {
        'aberta': 'bg-gray-100 border-gray-300',
        'em_andamento': 'bg-blue-50 border-blue-300',
        'aguardando_peca': 'bg-yellow-50 border-yellow-300',
        'concluida': 'bg-green-50 border-green-300',
        'entregue': 'bg-green-100 border-green-400',
    };

    const getPriorityBadge = (prioridade: string) => {
        const variants: Record<string, any> = {
            'urgente': { variant: 'error', label: '🔥 Urgente' },
            'alta': { variant: 'warning', label: '⚠️ Alta' },
            'media': { variant: 'info', label: 'Média' },
            'baixa': { variant: 'default', label: 'Baixa' },
        };
        return variants[prioridade] || variants.media;
    };

    const getPrazoBadge = (status_prazo: string, dias_restantes: number) => {
        if (status_prazo === 'vencida') return { color: 'text-red-600', icon: AlertCircle, label: 'Vencida' };
        if (status_prazo === 'vencendo') return { color: 'text-orange-600', icon: Clock, label: `${dias_restantes}d` };
        if (status_prazo === 'no_limite') return { color: 'text-yellow-600', icon: Clock, label: `${dias_restantes}d` };
        return { color: 'text-green-600', icon: CheckCircle, label: `${dias_restantes}d` };
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="glass rounded-xl p-6 animate-slide-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 text-gray-900 dark:text-white mb-2">
                            Ordens de Serviço
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gestão completa de assistência técnica
                        </p>
                    </div>
                    <Button className="hover:scale-105 transition-transform" onClick={() => setIsFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova OS
                    </Button>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total OS */}
                <Card className="card-hover animate-fade-in animation-delay-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {loadingDashboard ? '...' : dashboard?.total_os || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.os_abertas || 0} abertas
                        </p>
                    </CardContent>
                </Card>

                {/* OS Vencidas */}
                <Card className="card-hover animate-fade-in animation-delay-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-red-600">
                            {loadingDashboard ? '...' : dashboard?.os_vencidas || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.os_vencendo || 0} vencendo
                        </p>
                    </CardContent>
                </Card>

                {/* Taxa de Aprovação */}
                <Card className="card-hover animate-fade-in animation-delay-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Taxa Aprovação</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono text-green-600">
                            {loadingDashboard ? '...' : `${dashboard?.taxa_aprovacao_geral || 0}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboard?.os_concluidas || 0} concluídas
                        </p>
                    </CardContent>
                </Card>

                {/* Faturamento Mês */}
                <Card className="card-hover animate-fade-in animation-delay-400">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Faturamento Mês</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {loadingDashboard ? '...' : `R$ ${(dashboard?.faturamento_mes || 0).toLocaleString('pt-BR')}`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ticket: R$ {(dashboard?.ticket_medio || 0).toLocaleString('pt-BR')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Busca */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por número ou cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Filtro Prioridade */}
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas Prioridades</option>
                            <option value="urgente">🔥 Urgente</option>
                            <option value="alta">⚠️ Alta</option>
                            <option value="media">Média</option>
                            <option value="baixa">Baixa</option>
                        </select>

                        {/* Filtro Status */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos Status</option>
                            <option value="aberta">Recebidas</option>
                            <option value="em_andamento">Em Reparo</option>
                            <option value="aguardando_peca">Aguardando Peça</option>
                            <option value="concluida">Concluídas</option>
                            <option value="entregue">Entregues</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Kanban Board */}
            <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-max pb-4">
                    {Object.entries(kanbanColumns).map(([status, osList]) => (
                        <div key={status} className="flex-shrink-0 w-80">
                            <div className={`rounded-lg border-2 ${statusColors[status as keyof typeof statusColors]} p-4`}>
                                {/* Header da Coluna */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">
                                        {statusLabels[status as keyof typeof statusLabels]}
                                    </h3>
                                    <Badge variant="secondary">
                                        {osList.length}
                                    </Badge>
                                </div>

                                {/* Cards de OS */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {osList.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Nenhuma OS</p>
                                        </div>
                                    ) : (
                                        osList.map((os: any) => {
                                            const priority = getPriorityBadge(os.prioridade);
                                            const prazo = os.prazo_entrega ? getPrazoBadge(os.status_prazo, os.dias_restantes) : null;
                                            const PrazoIcon = prazo?.icon;

                                            return (
                                                <Card
                                                    key={os.id}
                                                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                                                >
                                                    <CardContent className="p-4">
                                                        {/* Número e Prioridade */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-mono text-sm font-semibold text-blue-600">
                                                                #{os.numero}
                                                            </span>
                                                            <Badge variant={priority.variant} size="sm">
                                                                {priority.label}
                                                            </Badge>
                                                        </div>

                                                        {/* Cliente */}
                                                        <p className="font-medium text-gray-900 mb-1">
                                                            {os.cliente_nome}
                                                        </p>

                                                        {/* Equipamento */}
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {os.device_type} {os.device_brand} {os.device_model}
                                                        </p>

                                                        {/* Defeito */}
                                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                                            {os.reported_issue}
                                                        </p>

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between pt-2 border-t">
                                                            {/* Técnico */}
                                                            <span className="text-xs text-gray-500">
                                                                {os.tecnico_nome ? `👤 ${os.tecnico_nome.split('@')[0]}` : '👤 Sem técnico'}
                                                            </span>

                                                            {/* Prazo */}
                                                            {prazo && PrazoIcon && (
                                                                <div className={`flex items-center gap-1 ${prazo.color}`}>
                                                                    <PrazoIcon className="w-3 h-3" />
                                                                    <span className="text-xs font-medium">{prazo.label}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Valor */}
                                                        {os.valor_final > 0 && (
                                                            <div className="mt-2 pt-2 border-t">
                                                                <span className="text-sm font-semibold text-green-600 font-mono">
                                                                    R$ {os.valor_final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Produtividade dos Técnicos */}
            {productivity && productivity.length > 0 && (
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Produtividade dos Técnicos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {productivity.slice(0, 5).map((tech: any) => (
                                <div key={tech.tecnico_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{tech.nome.split('@')[0]}</p>
                                        <p className="text-sm text-gray-500">
                                            {tech.os_concluidas} OS concluídas • {tech.os_em_andamento} em andamento
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-600 font-mono">
                                            R$ {(tech.faturamento_total || 0).toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Taxa: {tech.taxa_aprovacao}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dialog de Nova OS */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nova Ordem de Serviço</DialogTitle>
                    </DialogHeader>
                    <OSForm
                        onClose={() => setIsFormOpen(false)}
                        onSuccess={() => {
                            setIsFormOpen(false);
                            // Recarregar dados
                            window.location.reload();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
