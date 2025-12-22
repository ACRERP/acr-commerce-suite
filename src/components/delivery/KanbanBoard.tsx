import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bike, Clock, Package, AlertCircle, Truck, CheckCircle, MessageCircle, UserPlus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { toast } from 'sonner';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

// --- Sub-components for DnD ---

function SortableItem({ id, delivery, statusConfig, deliverymen, onAction }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const status = delivery.status;

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!delivery.customer_phone) return;

        const message = `Olá ${delivery.customer_name}! Seu pedido #${delivery.id} está ${statusConfig[status].label} e já deve chegar até você.`;
        const link = deliveryService.getWhatsAppLink(delivery.customer_phone, message);
        window.open(link, '_blank');
    };

    const handleAssign = async (dmId: number) => {
        try {
            await deliveryService.assignDeliveryman(delivery.id, dmId);
            toast.success("Entregador atribuído!");
            onAction?.();
        } catch (error) {
            toast.error("Erro ao atribuir");
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group",
                isDragging && "shadow-xl ring-2 ring-primary-500 rotate-2"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-neutral-500">
                    #{delivery.id}
                </span>
                <div className="flex gap-1">
                    {delivery.customer_phone && (
                        <button
                            onClick={handleWhatsApp}
                            className="p-1 text-green-500 hover:bg-green-50 rounded-md"
                            title="Enviar WhatsApp"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <div className={cn("w-2 h-2 rounded-full mt-1.5",
                        status === 'pending' ? 'bg-neutral-400' :
                            status === 'preparing' ? 'bg-blue-500' :
                                status === 'ready' ? 'bg-amber-500' :
                                    status === 'in_transit' ? 'bg-purple-500' :
                                        status === 'delivered' ? 'bg-success-500' : 'bg-red-500'
                    )} />
                </div>
            </div>

            <p className="font-bold text-sm text-neutral-900 dark:text-white mb-1 line-clamp-1">
                {delivery.customer_name || 'Cliente'}
            </p>

            <div className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{delivery.address}</span>
            </div>

            {delivery.delivery_man_name ? (
                <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700/50 p-1.5 rounded-lg mb-2">
                    <Bike className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="flex-1 truncate">{delivery.delivery_man_name}</span>
                </div>
            ) : status === 'ready' ? (
                <div onPointerDown={e => e.stopPropagation()}>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full h-8 text-[11px] border-dashed border-amber-300 bg-amber-50/30 text-amber-700 hover:bg-amber-50 py-1">
                                <UserPlus className="w-3 h-3 mr-1" /> Atribuir Entregador
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                            <div className="flex flex-col gap-1">
                                {deliverymen?.length === 0 ? (
                                    <p className="text-[10px] p-2 text-center text-neutral-500">Nenhum disponível</p>
                                ) : (
                                    deliverymen?.map((dm: any) => (
                                        <button
                                            key={dm.id}
                                            onClick={() => handleAssign(dm.id)}
                                            className="text-left px-2 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex items-center justify-between"
                                        >
                                            {dm.name}
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            ) : null}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    R$ {delivery.total_amount?.toFixed(2) || '0.00'}
                </span>
                {delivery.estimated_time && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-neutral-200 dark:border-neutral-700 text-neutral-500">
                        {delivery.estimated_time}min
                    </Badge>
                )}
            </div>
        </div>
    );
}

// --- Main Kanban Board ---

interface KanbanBoardProps {
    initialData: any[];
    statusConfig: any;
    onStatusChange?: () => void;
}

export function KanbanBoard({ initialData, statusConfig, onStatusChange }: KanbanBoardProps) {
    const [items, setItems] = useState(initialData);
    const [activeId, setActiveId] = useState<string | null>(null);

    const { data: deliverymen } = useQuery({
        queryKey: ['deliverymen', 'active'],
        queryFn: () => deliveryService.getDeliveryMen('active')
    });

    // Update local items when initialData changes (e.g. from parent re-fetch)
    // We use a useEffect but simplistic approach for now. 
    // Ideally we manage state here and sync only on drop.
    // For this implementation, we assume `items` tracks local state during Drag, but we sync with `initialData` if big changes happen?
    // Actually, better to initialize once or use useEffect. 
    // Let's rely on props update for now, but local state is needed for immediate DnD feedback.
    if (items !== initialData && !activeId) {
        setItems(initialData);
    }

    const columns = ['pending', 'preparing', 'ready', 'in_transit', 'delivered'];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const getDeliveriesByStatus = (status: string) => {
        return items.filter(item => item.status === status);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';

        if (!isActiveTask) return;

        // Dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            // Logic handled in DragEnd usually for simple lists, but for Kanban columns we need live updates?
            // Let's stick to DragEnd for simplicity unless we want complex reordering within columns.
            // For status changes, over.id might be a container.
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id; // Could be a container ID or another item ID

        // Find the item being dragged
        const activeItem = items.find(item => item.id === activeId);
        if (!activeItem) return;

        // Determine new status
        let newStatus = activeItem.status;

        if (columns.includes(overId as string)) {
            // Dropped directly on a column container
            newStatus = overId as string;
        } else {
            // Dropped on another item
            const overItem = items.find(item => item.id === overId);
            if (overItem) {
                newStatus = overItem.status;
            }
        }

        if (newStatus !== activeItem.status) {
            // Optimistic Update
            const updatedItems = items.map(item =>
                item.id === activeId ? { ...item, status: newStatus } : item
            );
            setItems(updatedItems);

            // Server Update
            try {
                await deliveryService.updateDeliveryStatus(activeId, newStatus);
                toast.success(`Status atualizado para ${statusConfig[newStatus]?.label}`);
                onStatusChange?.();
            } catch (error) {
                console.error(error);
                toast.error("Erro ao atualizar status");
                // Revert
                setItems(items);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4 h-full min-h-[600px]">
                {columns.map(status => {
                    const config = statusConfig[status];
                    const columnDeliveries = getDeliveriesByStatus(status);
                    const Icon = config.icon;

                    return (
                        <div key={status} className="flex flex-col w-full">
                            {/* Header */}
                            <div className={cn("p-3 rounded-t-xl border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between", config.bg)}>
                                <div className="flex items-center gap-2 font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                                    <Icon className="w-4 h-4" />
                                    {config.label}
                                </div>
                                <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">{columnDeliveries.length}</Badge>
                            </div>

                            {/* Droppable Area */}
                            <SortableContext
                                id={status}
                                items={columnDeliveries.map(d => d.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="bg-neutral-50/50 dark:bg-neutral-900/30 rounded-b-xl border border-t-0 border-neutral-100 dark:border-neutral-800 p-2 flex-1 flex flex-col gap-3 min-h-[500px]">
                                    {columnDeliveries.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 opacity-60">
                                            <Icon className="w-8 h-8 mb-2" />
                                            <span className="text-xs">Vazio</span>
                                        </div>
                                    ) : (
                                        columnDeliveries.map((delivery) => (
                                            <SortableItem
                                                key={delivery.id}
                                                id={delivery.id}
                                                delivery={delivery}
                                                statusConfig={statusConfig}
                                                deliverymen={deliverymen}
                                                onAction={onStatusChange}
                                            />
                                        ))
                                    )}
                                </div>
                            </SortableContext>
                        </div>
                    );
                })}
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="opacity-90 rotate-2 scale-105">
                        {/* Simplified preview of what's being dragged */}
                        <div className="bg-white dark:bg-neutral-800 p-3 rounded-xl border border-primary-500 shadow-xl w-[260px]">
                            <p className="font-bold text-sm">Movendo item #{activeId}...</p>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
