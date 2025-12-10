import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    GripVertical,
    MoreHorizontal,
    Clock,
    User,
    MapPin,
    DollarSign,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface KanbanItem {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    status: string;
    priority?: 'normal' | 'urgente';
    createdAt?: string;
    assignee?: string;
    value?: number;
    address?: string;
    metadata?: Record<string, any>;
}

export interface KanbanColumn {
    id: string;
    title: string;
    color: string;
    icon?: React.ReactNode;
    items: KanbanItem[];
}

interface KanbanBoardProps {
    columns: KanbanColumn[];
    onItemClick?: (item: KanbanItem) => void;
    onStatusChange?: (itemId: string, newStatus: string) => void;
    onItemAction?: (action: string, item: KanbanItem) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

interface KanbanCardProps {
    item: KanbanItem;
    onClick?: () => void;
    onAction?: (action: string) => void;
    columnColor: string;
}

const priorityColors = {
    normal: 'bg-gray-100 text-gray-700',
    urgente: 'bg-red-100 text-red-700 animate-pulse',
};

function KanbanCard({ item, onClick, onAction, columnColor }: KanbanCardProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffMinutes < 60) return `${diffMinutes}min`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
        return `${Math.floor(diffMinutes / 1440)}d`;
    };

    return (
        <Card
            className={cn(
                "cursor-pointer hover:shadow-md transition-all duration-200 group",
                "border-l-4",
                item.priority === 'urgente' && "ring-2 ring-red-200"
            )}
            style={{ borderLeftColor: columnColor }}
            onClick={onClick}
        >
            <CardContent className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">{item.title}</h4>
                            {item.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAction?.('view')}>
                                👁️ Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction?.('edit')}>
                                ✏️ Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction?.('cancel')} className="text-red-600">
                                ❌ Cancelar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                    {item.assignee && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{item.assignee}</span>
                        </div>
                    )}

                    {item.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{item.address}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex items-center gap-2">
                        {item.priority && item.priority !== 'normal' && (
                            <Badge className={cn("text-[10px] px-1.5 py-0", priorityColors[item.priority])}>
                                {item.priority === 'urgente' ? '🔥 Urgente' : item.priority}
                            </Badge>
                        )}

                        {item.createdAt && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTime(item.createdAt)}
                            </div>
                        )}
                    </div>

                    {item.value !== undefined && item.value > 0 && (
                        <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(item.value)}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function KanbanBoard({
    columns,
    onItemClick,
    onStatusChange,
    onItemAction,
    isLoading,
    emptyMessage = "Nenhum item encontrado"
}: KanbanBoardProps) {
    const totalItems = useMemo(() =>
        columns.reduce((acc, col) => acc + col.items.length, 0),
        [columns]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4 min-w-max">
                {columns.map((column) => (
                    <div
                        key={column.id}
                        className="w-[300px] flex-shrink-0"
                    >
                        {/* Column Header */}
                        <Card className="mb-2">
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {column.icon}
                                        <CardTitle className="text-sm font-medium">
                                            {column.title}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                        style={{ backgroundColor: `${column.color}20`, color: column.color }}
                                    >
                                        {column.items.length}
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Column Content */}
                        <div
                            className="space-y-2 min-h-[200px] p-2 rounded-lg bg-gray-50/50"
                            style={{ borderTop: `3px solid ${column.color}` }}
                        >
                            {column.items.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                    Vazio
                                </div>
                            ) : (
                                column.items.map((item) => (
                                    <KanbanCard
                                        key={item.id}
                                        item={item}
                                        columnColor={column.color}
                                        onClick={() => onItemClick?.(item)}
                                        onAction={(action) => onItemAction?.(action, item)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}

// Utility function to convert delivery orders to kanban items
export function deliveryOrderToKanbanItem(order: any): KanbanItem {
    return {
        id: order.id,
        title: `#${order.order_number || order.id.slice(0, 8)}`,
        subtitle: order.clients?.name || 'Cliente não identificado',
        status: order.status,
        priority: order.priority || 'normal',
        createdAt: order.created_at,
        assignee: order.drivers?.name,
        value: order.sales?.total_amount || 0,
        address: [order.delivery_neighborhood, order.delivery_city].filter(Boolean).join(', ') || 'Endereço não informado',
        metadata: order,
    };
}

// Utility function to convert service orders to kanban items
export function serviceOrderToKanbanItem(order: any): KanbanItem {
    return {
        id: order.id.toString(),
        title: `OS #${order.id}`,
        subtitle: order.clients?.name || 'Cliente não identificado',
        description: `${order.device_type || ''} ${order.device_brand || ''} ${order.device_model || ''}`.trim(),
        status: order.status,
        priority: order.priority || 'normal',
        createdAt: order.created_at,
        value: order.total_value || 0,
        metadata: order,
    };
}

// Predefined column configurations
export const deliveryColumns = [
    { id: 'aguardando_preparo', title: 'Aguardando Preparo', color: '#F59E0B', icon: '⏳' },
    { id: 'em_preparo', title: 'Em Preparo', color: '#3B82F6', icon: '👨‍🍳' },
    { id: 'aguardando_entregador', title: 'Aguard. Entregador', color: '#8B5CF6', icon: '📦' },
    { id: 'em_rota', title: 'Em Rota', color: '#10B981', icon: '🚚' },
    { id: 'entregue', title: 'Entregue', color: '#22C55E', icon: '✅' },
];

export const serviceOrderColumns = [
    { id: 'aberta', title: 'Aberta', color: '#6B7280', icon: '📋' },
    { id: 'em_analise', title: 'Em Análise', color: '#3B82F6', icon: '🔍' },
    { id: 'aguardando_aprovacao', title: 'Aguard. Aprovação', color: '#F59E0B', icon: '⏳' },
    { id: 'em_execucao', title: 'Em Execução', color: '#8B5CF6', icon: '🔧' },
    { id: 'aguardando_peca', title: 'Aguard. Peça', color: '#EF4444', icon: '📦' },
    { id: 'concluida', title: 'Concluída', color: '#10B981', icon: '✅' },
    { id: 'entregue', title: 'Entregue', color: '#22C55E', icon: '🎉' },
];
