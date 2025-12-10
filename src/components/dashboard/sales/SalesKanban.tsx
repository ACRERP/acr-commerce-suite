import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DollarSign, User, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
    id: number;
    client_id: number | null;
    total_amount: number;
    status: string;
    created_at: string;
    client?: {
        name: string;
    };
}

const COLUMNS = [
    { id: 'orcamento', title: 'Orçamento', color: 'bg-blue-500' },
    { id: 'aprovado', title: 'Aprovado', color: 'bg-green-500' },
    { id: 'producao', title: 'Produção', color: 'bg-orange-500' },
    { id: 'entregue', title: 'Entregue', color: 'bg-purple-500' },
];

function SaleCard({ sale }: { sale: Sale }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sale.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all cursor-move border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500">#{sale.id}</span>
                    <Badge variant="outline" className="text-xs">
                        {sale.status}
                    </Badge>
                </div>

                {sale.client && (
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium truncate">{sale.client.name}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-bold">
                    <DollarSign className="h-4 w-4" />
                    {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                    }).format(sale.total_amount)}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(sale.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                    })}
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({ column, sales }: { column: typeof COLUMNS[0]; sales: Sale[] }) {
    return (
        <div className="flex-1 min-w-[280px]">
            <Card className="h-full">
                <CardHeader className={`${column.color} text-white`}>
                    <CardTitle className="flex items-center justify-between text-lg">
                        <span>{column.title}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                            {sales.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 min-h-[500px] max-h-[600px] overflow-y-auto">
                    <SortableContext items={sales.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        {sales.map((sale) => (
                            <SaleCard key={sale.id} sale={sale} />
                        ))}
                    </SortableContext>
                    {sales.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <Package className="h-12 w-12 mb-2" />
                            <p className="text-sm">Nenhuma venda</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export function SalesKanban() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeSale, setActiveSale] = useState<Sale | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Buscar vendas
    const { data: sales = [] } = useQuery({
        queryKey: ['sales-kanban'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales')
                .select(`
          *,
          client:clients(name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Sale[];
        },
    });

    // Mutation para atualizar status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ saleId, newStatus }: { saleId: number; newStatus: string }) => {
            const { error } = await supabase
                .from('sales')
                .update({ status: newStatus })
                .eq('id', saleId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-kanban'] });
            toast({
                title: 'Status atualizado!',
                description: 'Venda movida com sucesso.',
            });
        },
        onError: () => {
            toast({
                title: 'Erro!',
                description: 'Não foi possível atualizar o status.',
                variant: 'destructive',
            });
        },
    });

    const handleDragStart = (event: DragStartEvent) => {
        const sale = sales.find((s) => s.id === event.active.id);
        setActiveSale(sale || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveSale(null);

        if (!over) return;

        const saleId = active.id as number;
        const newStatus = over.id as string;

        const sale = sales.find((s) => s.id === saleId);
        if (sale && sale.status !== newStatus) {
            updateStatusMutation.mutate({ saleId, newStatus });
        }
    };

    // Agrupar vendas por status
    const salesByStatus = COLUMNS.reduce((acc, column) => {
        acc[column.id] = sales.filter((sale) => sale.status === column.id);
        return acc;
    }, {} as Record<string, Sale[]>);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Kanban de Vendas
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Arraste e solte para alterar o status das vendas
                </p>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            sales={salesByStatus[column.id] || []}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeSale ? <SaleCard sale={activeSale} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
