import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { osService } from '@/lib/os/os-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
    Users,
    Wrench,
    Calendar,
    ArrowRight,
    MoreVertical,
    Smartphone,
    Laptop,
    Tablet
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { OSForm } from '@/components/os/OSForm';
import { OSDetailsModal } from '@/components/os/OSDetailsModal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { MainLayout } from "@/components/layout/MainLayout";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OSStatusChart } from '@/components/os/dashboard/OSStatusChart';
import { RevenueByTechnicianChart } from '@/components/os/dashboard/RevenueByTechnicianChart';

export default function OSPage() {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const queryClient = useQueryClient();

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

    // Cancel Mutation
    const cancelOSMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
            return osService.updateOS(id, {
                status: 'cancelada',
                technician_notes: reason ? `Cancelada: ${reason}` : 'Cancelada'
            });
        },
        onSuccess: () => {
            toast.success('OS cancelada com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['os-kanban'] });
            queryClient.invalidateQueries({ queryKey: ['os-dashboard'] });
            queryClient.refetchQueries({ queryKey: ['os-kanban'] });
            queryClient.refetchQueries({ queryKey: ['os-dashboard'] });
            setIsCancelDialogOpen(false);
            setSelectedOS(null);
            setCancelReason('');
        },
    });

    // Status Change Mutation
    // Status Change Mutation
    const changeStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: number, newStatus: string }) => {
            return osService.updateOS(id, { status: newStatus as any });
        },
        onSuccess: () => {
            toast.success('Status atualizado com sucesso!');
            queryClient.refetchQueries({ queryKey: ['os-kanban'] });
            queryClient.refetchQueries({ queryKey: ['os-dashboard'] });
        },
    });

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        // Se o status não mudou, não faz nada
        if (newStatus === result.source.droppableId) return;

        changeStatusMutation.mutate({
            id: Number(draggableId),
            newStatus
        });
    };

    // Filtros
    const filteredOS = osKanban?.filter(os => {
        // Não mostrar canceladas na visualização geral
        if (selectedStatus === 'all' && os.status === 'cancelada') return false;

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
        'cancelada': filteredOS?.filter(os => os.status === 'cancelada') || [],
    };

    const statusConfig = {
        'aberta': { label: 'Recebidas', color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Package },
        'em_andamento': { label: 'Em Reparo', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Wrench },
        'aguardando_peca': { label: 'Aguardando Peça', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
        'concluida': { label: 'Concluídas', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
        'entregue': { label: 'Entregues', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
        'cancelada': { label: 'Canceladas', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    };

    const getPriorityBadge = (prioridade: string) => {
        const variants: Record<string, any> = {
            'urgente': { className: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200', label: '🔥 Urgente' },
            'alta': { className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200', label: '⚠️ Alta' },
            'media': { className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', label: 'Média' },
            'baixa': { className: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-200', label: 'Baixa' },
        };
        return variants[prioridade] || variants.media;
    };

    const getDeviceIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('celular') || lowerType.includes('iphone') || lowerType.includes('android')) return Smartphone;
        if (lowerType.includes('notebook') || lowerType.includes('laptop') || lowerType.includes('macbook')) return Laptop;
        if (lowerType.includes('tablet') || lowerType.includes('ipad')) return Tablet;
        return Package;
    };

    const getPrazoBadge = (status_prazo: string, dias_restantes: number) => {
        if (status_prazo === 'vencida') return { className: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle, label: 'Vencida' };
        if (status_prazo === 'vencendo') return { className: 'text-orange-600 bg-orange-50 border-orange-200', icon: Clock, label: `${dias_restantes}d` };
        if (status_prazo === 'no_limite') return { className: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock, label: `${dias_restantes}d` };
        return { className: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle, label: `${dias_restantes}d` };
    };

    return (
        <MainLayout>
            <div className="container-premium py-8 space-y-8 animate-fade-in-up">
                {/* Header Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            Ordens de Serviço
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Wrench className="w-5 h-5" />
                            Gestão de assistência técnica e reparos
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setSelectedOS(null);
                            setIsFormOpen(true);
                        }}
                        className="btn-primary hover-lift flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Nova OS
                    </Button>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total OS */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total de OS</p>
                                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                    {dashboard?.total_os || 0}
                                </h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500 font-medium">
                                    <Package className="w-3 h-3" />
                                    <span>{dashboard?.os_abertas || 0} em aberto</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                <Package className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Vencidas */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Status Crítico</p>
                                <h3 className="text-3xl font-bold text-red-600 tracking-tight">
                                    {dashboard?.os_vencidas || 0}
                                </h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-red-500 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{dashboard?.os_vencendo || 0} vencendo hoje</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 transition-transform duration-300 group-hover:scale-110">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Taxa Aprovação */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Aprovação</p>
                                <h3 className="text-3xl font-bold text-green-600 tracking-tight">
                                    {dashboard?.taxa_aprovacao_geral || 0}%
                                </h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{dashboard?.os_concluidas || 0} concluídas</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 transition-transform duration-300 group-hover:scale-110">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Faturamento */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Faturamento (Mês)</p>
                                <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dashboard?.faturamento_mes || 0)}
                                </h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 font-medium">
                                    <Users className="w-3 h-3" />
                                    <span>Ticket: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dashboard?.ticket_medio || 0)}</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 transition-transform duration-300 group-hover:scale-110">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <OSStatusChart data={osKanban || []} />
                    </div>
                    <div className="lg:col-span-2">
                        <RevenueByTechnicianChart
                            data={productivity?.map((p: any) => ({
                                name: (p.nome || 'Técnico').split('@')[0], // Shorten name
                                value: p.faturamento_total || 0,
                                count: p.os_concluidas || 0
                            })) || []}
                        />
                    </div>
                </div>

                {/* Filters - Premium Expandido */}
                <div className="card-premium p-6">
                    <div className="space-y-4">
                        {/* Busca Principal - Expandida */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Buscar por número da OS, nome do cliente, equipamento, marca, modelo..."
                                className="pl-10 pr-4 h-14 text-base w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filtros em Grid - Mais Opções */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Prioridade */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Prioridade</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {(['all', 'urgente', 'alta', 'media', 'baixa'] as const).map(p => (
                                        <Button
                                            key={p}
                                            variant={selectedPriority === p ? "default" : "outline"}
                                            onClick={() => setSelectedPriority(p)}
                                            size="sm"
                                            className={`h-8 px-3 rounded-full text-xs font-medium capitalize ${selectedPriority === p ? 'bg-neutral-900 text-white shadow-md' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                                        >
                                            {p === 'all' ? 'Todas' : p}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Status</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {(['all', 'aberta', 'em_andamento', 'concluida', 'cancelada'] as const).map(s => (
                                        <Button
                                            key={s}
                                            variant={selectedStatus === s ? "default" : "outline"}
                                            onClick={() => setSelectedStatus(s)}
                                            size="sm"
                                            className={`h-8 px-3 rounded-full text-xs font-medium capitalize ${selectedStatus === s ? 'bg-neutral-900 text-white shadow-md' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                                        >
                                            {s === 'all' ? 'Todos' : s.replace('_', ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Resumo de Resultados */}
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Resultados</label>
                                <div className="flex items-center gap-2 h-8">
                                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                                        {filteredOS?.length || 0} OS encontradas
                                    </Badge>
                                    {(selectedStatus !== 'all' || selectedPriority !== 'all' || searchTerm) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedStatus('all');
                                                setSelectedPriority('all');
                                                setSearchTerm('');
                                            }}
                                            className="h-8 text-xs text-neutral-500 hover:text-neutral-900"
                                        >
                                            Limpar filtros
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanban Board Premium - Responsivo sem Scroll Horizontal */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="w-full">
                        {/* Mobile: Horizontal Scroll | Desktop: Grid */}
                        <div className="flex lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory lg:snap-none lg:overflow-visible pb-4 px-1 scrollbar-hide">
                            {Object.entries(kanbanColumns).map(([status, osList]) => {
                                const config = statusConfig[status as keyof typeof statusConfig];
                                const Icon = config.icon;

                                return (
                                    <div key={status} className="flex flex-col min-h-[500px] min-w-[85vw] sm:min-w-[320px] lg:min-w-0 snap-center first:pl-1">
                                        {/* Column Header */}
                                        <div className={`p-3 rounded-t-xl bg-white dark:bg-neutral-800 border-b-2 ${config.color.split(' ')[2]} flex items-center justify-between sticky top-0 z-10 shadow-sm mb-3`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{config.label}</span>
                                            </div>
                                            <Badge variant="secondary" className="font-mono text-xs">{osList.length}</Badge>
                                        </div>

                                        {/* Cards Stack - Com altura máxima e scroll e DROP AREA */}
                                        <Droppable droppableId={status}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent flex-1 transition-colors rounded-xl p-2 ${snapshot.isDraggingOver ? 'bg-neutral-100/50 dark:bg-neutral-800/50 border-2 border-dashed border-primary-500/30' : ''
                                                        }`}
                                                >
                                                    {osList.length === 0 && !snapshot.isDraggingOver ? (
                                                        <div className="text-center py-12 bg-neutral-50/50 dark:bg-neutral-900/20 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                                            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Icon className="w-5 h-5 text-neutral-400" />
                                                            </div>
                                                            <p className="text-sm text-neutral-400 font-medium">Nenhuma OS</p>
                                                        </div>
                                                    ) : (
                                                        osList.map((os: any, index: number) => {
                                                            const priority = getPriorityBadge(os.prioridade);
                                                            const prazo = os.prazo_entrega ? getPrazoBadge(os.status_prazo, os.dias_restantes) : null;

                                                            return (
                                                                <Draggable key={os.id} draggableId={String(os.id)} index={index}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            ref={provided.innerRef}
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            className={`card-premium p-3 cursor-pointer border-l-4 group relative transition-all duration-200 ${snapshot.isDragging
                                                                                ? 'shadow-2xl scale-105 rotate-2 z-50 ring-2 ring-primary-500/50 opacity-90'
                                                                                : 'hover-lift'
                                                                                }`}
                                                                            style={{
                                                                                borderLeftColor: priority.label.includes('Urgente') ? '#ef4444' : priority.label.includes('Alta') ? '#f97316' : 'transparent',
                                                                                ...provided.draggableProps.style
                                                                            }}
                                                                        >
                                                                            {/* Header Card */}
                                                                            <div className="flex items-start justify-between mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                                                                        #{os.numero}
                                                                                    </span>
                                                                                    {priority.label !== 'Média' && priority.label !== 'Baixa' && (
                                                                                        <Badge variant="outline" className={`text-[10px] h-5 px-1 ${priority.className} border-0`}>
                                                                                            {priority.label}
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <MoreVertical className="w-3 h-3 text-neutral-400" />
                                                                                        </Button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="end">
                                                                                        <DropdownMenuItem onClick={() => {
                                                                                            setSelectedOS(os);
                                                                                            setIsDetailsOpen(true);
                                                                                        }}>
                                                                                            Ver Detalhes
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem onClick={() => {
                                                                                            setSelectedOS(os);
                                                                                            setIsFormOpen(true);
                                                                                        }}>
                                                                                            Editar
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuLabel>Mover para</DropdownMenuLabel>
                                                                                        {os.status !== 'aberta' && (
                                                                                            <DropdownMenuItem onClick={() => changeStatusMutation.mutate({ id: os.id, newStatus: 'aberta' })}>
                                                                                                📥 Recebidas
                                                                                            </DropdownMenuItem>
                                                                                        )}
                                                                                        {os.status !== 'em_andamento' && (
                                                                                            <DropdownMenuItem onClick={() => changeStatusMutation.mutate({ id: os.id, newStatus: 'em_andamento' })}>
                                                                                                🔧 Em Reparo
                                                                                            </DropdownMenuItem>
                                                                                        )}
                                                                                        {os.status !== 'aguardando_peca' && (
                                                                                            <DropdownMenuItem onClick={() => changeStatusMutation.mutate({ id: os.id, newStatus: 'aguardando_peca' })}>
                                                                                                ⏳ Aguardando Peça
                                                                                            </DropdownMenuItem>
                                                                                        )}
                                                                                        {os.status !== 'concluida' && (
                                                                                            <DropdownMenuItem onClick={() => changeStatusMutation.mutate({ id: os.id, newStatus: 'concluida' })}>
                                                                                                ✅ Concluída
                                                                                            </DropdownMenuItem>
                                                                                        )}
                                                                                        {os.status !== 'entregue' && (
                                                                                            <DropdownMenuItem onClick={() => changeStatusMutation.mutate({ id: os.id, newStatus: 'entregue' })}>
                                                                                                🎉 Entregue
                                                                                            </DropdownMenuItem>
                                                                                        )}
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem
                                                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                                            onClick={() => {
                                                                                                setSelectedOS(os);
                                                                                                setIsCancelDialogOpen(true);
                                                                                            }}
                                                                                        >
                                                                                            Cancelar OS
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>

                                                                            {/* Content */}
                                                                            <div>
                                                                                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 mb-1" title={os.clients?.name}>
                                                                                    {os.clients?.name || 'Cliente sem nome'}
                                                                                </h4>
                                                                                <p className="text-xs text-neutral-500 line-clamp-2 mb-2 h-8">
                                                                                    {os.reported_issue}
                                                                                </p>

                                                                                <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-2 mt-2">
                                                                                    <div className="flex items-center gap-1">
                                                                                        {/* <DeviceIcon className="w-3 h-3" /> */}
                                                                                        <span>{os.device_brand} {os.device_model}</span>
                                                                                    </div>
                                                                                    {prazo && (
                                                                                        <div className={`flex items-center gap-1 ${prazo.className} px-1.5 py-0.5 rounded-full`}>
                                                                                            <prazo.icon className="w-3 h-3" />
                                                                                            <span className="font-medium">{prazo.label}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })
                                                    )}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </DragDropContext>


                {/* Productivity Section */}
                {
                    productivity && productivity.length > 0 && (
                        <div className="card-premium overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-primary-500" />
                                <h3 className="font-bold text-neutral-900 dark:text-white">Produtividade Técnica</h3>
                            </div>
                            <div className="p-0">
                                {productivity.slice(0, 5).map((tech: any, index: number) => (
                                    <div key={tech.tecnico_id} className={`flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${index !== productivity.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300">
                                                {(tech.nome || 'T').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-neutral-900 dark:text-white">{(tech.nome || 'Técnico').split('@')[0]}</p>
                                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                    <Badge variant="secondary" className="h-5 px-1.5 bg-green-100 text-green-700 border-0">{tech.os_concluidas} Concluídas</Badge>
                                                    <span>•</span>
                                                    <span className="text-blue-600 font-medium">{tech.os_em_andamento} Em andamento</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="font-mono font-bold text-green-600">
                                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tech.faturamento_total || 0)}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                Aprovação: <span className="font-bold text-neutral-900 dark:text-white">{tech.taxa_aprovacao}%</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Modal Premium Nova OS */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl p-0 gap-0 rounded-2xl">
                        <DialogHeader className="p-6 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white sticky top-0 z-50">
                            <DialogTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                    <Wrench className="w-6 h-6 text-white" />
                                </div>
                                Nova Ordem de Serviço
                            </DialogTitle>
                            <p className="text-neutral-400 mt-1">Preencha os dados para abrir um novo chamado técnico</p>
                        </DialogHeader>
                        <div className="p-6 bg-neutral-50 dark:bg-neutral-900">
                            <OSForm
                                osId={selectedOS?.id}
                                onClose={() => {
                                    setIsFormOpen(false);
                                    setSelectedOS(null);
                                }}
                                onSuccess={() => {
                                    setIsFormOpen(false);
                                    setSelectedOS(null);
                                    queryClient.invalidateQueries({ queryKey: ['os-kanban'] });
                                    queryClient.invalidateQueries({ queryKey: ['os-dashboard'] });
                                    queryClient.invalidateQueries({ queryKey: ['technician-productivity'] });
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Cancel Dialog */}
                <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="w-5 h-5" />
                                Cancelar Ordem de Serviço
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-neutral-600">
                                Tem certeza que deseja cancelar a OS <span className="font-mono font-bold">#{selectedOS?.numero}</span>?
                            </p>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Motivo do cancelamento (opcional)</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg resize-none"
                                    rows={3}
                                    placeholder="Descreva o motivo..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsCancelDialogOpen(false);
                                        setSelectedOS(null);
                                        setCancelReason('');
                                    }}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (selectedOS?.id) {
                                            cancelOSMutation.mutate({ id: selectedOS.id, reason: cancelReason });
                                        }
                                    }}
                                    disabled={cancelOSMutation.isPending}
                                >
                                    {cancelOSMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* OS Details Modal */}
                <OSDetailsModal
                    osId={selectedOS?.id || null}
                    open={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                />
            </div >
        </MainLayout >
    );
}
