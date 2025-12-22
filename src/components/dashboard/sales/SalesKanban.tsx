import { useState, useMemo } from 'react';
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
    KeyboardSensor,
    useSensor,
    useSensors,
    useDroppable,
    closestCorners
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DollarSign, User, Calendar, Package, FileText, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Types
type KanbanItemType = 'quote' | 'sale';

interface KanbanItem {
    id: string; // Unique ID for DND (e.g. "quote-1", "sale-5")
    originalId: number;
    type: KanbanItemType;
    clientName: string;
    totalAmount: number;
    status: string; // 'orcamento', 'aprovado', 'producao', 'entregue'
    createdAt: string;
    displayId: number;
}

const COLUMNS = [
    { id: 'orcamento', title: 'Orçamento', color: 'bg-blue-500' },
    { id: 'aprovado', title: 'Aprovado / OS', color: 'bg-green-500' },
    { id: 'producao', title: 'Em Produção', color: 'bg-orange-500' },
    { id: 'entregue', title: 'Entregue', color: 'bg-purple-500' },
];

function KanbanCard({ item }: { item: KanbanItem }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none' // Critical for PointerSensor
    };

    const isQuote = item.type === 'quote';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move border-l-4 
                ${isQuote ? 'border-l-blue-400' : 'border-l-green-400'}
                border-y border-r border-gray-200 dark:border-gray-700
            `}
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isQuote ? <FileText className="w-4 h-4 text-blue-500" /> : <Wrench className="w-4 h-4 text-green-500" />}
                        <span className="text-sm font-bold text-gray-700">#{item.displayId}</span>
                    </div>
                    {isQuote && <Badge variant="secondary" className="text-[10px] h-5">Prop.</Badge>}
                    {!isQuote && <Badge variant="outline" className="text-[10px] h-5">OS</Badge>}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{item.clientName}</span>
                </div>

                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                    <DollarSign className="h-3 w-3" />
                    {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                    }).format(item.totalAmount)}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.createdAt), "dd/MM", { locale: ptBR })}
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({ column, items }: { column: typeof COLUMNS[0]; items: KanbanItem[] }) {
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div className="flex-1 min-w-[280px] bg-neutral-50/50 rounded-xl p-2 h-full flex flex-col">
            <div className={`p-3 rounded-lg text-white mb-3 shadow-sm ${column.color}`}>
                <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                        {column.title}
                    </span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                        {items.length}
                    </span>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 space-y-3 overflow-y-auto px-1 min-h-[500px]">
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                        <KanbanCard key={item.id} item={item} />
                    ))}
                </SortableContext>
                {items.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <span className="text-xs">Vazio</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function SalesKanban() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch Quotes (Active only)
    const { data: quotes = [] } = useQuery({
        queryKey: ['quotes-kanban'],
        queryFn: async () => {
            const { data } = await supabase
                .from('quotes')
                .select('*, client:clients(name)')
                .in('status', ['draft', 'sent']) // Only allow moving if draft/sent
                .order('created_at', { ascending: false });
            return data || [];
        }
    });

    // Fetch Sales
    const { data: sales = [] } = useQuery({
        queryKey: ['sales-kanban'],
        queryFn: async () => {
            const { data } = await supabase
                .from('sales')
                .select('*, client:clients(name)')
                .order('created_at', { ascending: false });
            return data || [];
        }
    });

    // Merge Data
    const items: KanbanItem[] = useMemo(() => {
        const kanbanQuotes: KanbanItem[] = quotes.map((q: any) => ({
            id: `quote-${q.id}`,
            originalId: q.id,
            type: 'quote',
            clientName: q.client_name || q.client?.name || 'Cliente',
            totalAmount: q.total_amount,
            status: 'orcamento', // Force mapping
            createdAt: q.created_at,
            displayId: q.id
        }));

        const kanbanSales: KanbanItem[] = sales.map((s: any) => ({
            id: `sale-${s.id}`,
            originalId: s.id,
            type: 'sale',
            clientName: s.client?.name || 'Cliente',
            totalAmount: s.total_amount,
            status: ['producao', 'entregue'].includes(s.status) ? s.status : 'aprovado',
            createdAt: s.created_at,
            displayId: s.id
        }));

        return [...kanbanQuotes, ...kanbanSales];
    }, [quotes, sales]);

    // Mutations
    const convertQuoteMutation = useMutation({
        mutationFn: async (quoteId: number) => {
            const { data, error } = await supabase.rpc('convert_quote_to_sale', { p_quote_id: quoteId });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes-kanban'] });
            queryClient.invalidateQueries({ queryKey: ['sales-kanban'] });
            toast({ title: 'Orçamento Aprovado', description: 'Venda criada com sucesso!' });
        },
        onError: (err: any) => {
            console.error("Conversion Error:", err);
            toast({ title: 'Erro na conversão', description: err.message || 'Verifique o console.', variant: 'destructive' });
        }
    });

    const updateSaleStatusMutation = useMutation({
        mutationFn: async ({ saleId, newStatus }: { saleId: number, newStatus: string }) => {
            const { error } = await supabase.from('sales').update({ status: newStatus }).eq('id', saleId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-kanban'] });
        },
        onError: (err: any) => {
            toast({ title: 'Erro ao mover', description: err.message, variant: 'destructive' });
        }
    });

    const handleDragStart = (e: DragStartEvent) => {
        const item = items.find(i => i.id === e.active.id);
        setActiveItem(item || null);
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        setActiveItem(null);

        if (!over) return;
        if (active.id === over.id) return;

        const item = items.find(i => i.id === active.id);
        if (!item) return;

        const containerId = over.id as string;

        let newStatus = containerId;
        // If dropped onto a card
        if (!COLUMNS.find(c => c.id === newStatus)) {
            const overItem = items.find(i => i.id === newStatus);
            if (overItem) newStatus = overItem.status;
            else return;
        }

        if (item.status === newStatus) return; // No change

        // Logic
        if (item.type === 'quote') {
            if (newStatus === 'aprovado' || newStatus === 'producao' || newStatus === 'entregue') {
                if (confirm(`Aprovar Orçamento #${item.displayId} e transformar em Venda?`)) {
                    convertQuoteMutation.mutate(item.originalId);
                }
            }
        } else if (item.type === 'sale') {
            if (newStatus === 'orcamento') {
                toast({ title: 'Ação Bloqueada', description: 'Não é possível voltar uma Venda para Orçamento.', variant: 'destructive' });
                return;
            }
            updateSaleStatusMutation.mutate({ saleId: item.originalId, newStatus });
        }
    };

    const itemsByStatus = useMemo(() => {
        const grouped: Record<string, KanbanItem[]> = {};
        COLUMNS.forEach(c => grouped[c.id] = []);
        items.forEach(i => {
            if (grouped[i.status]) grouped[i.status].push(i);
            else if (i.type === 'sale') grouped['aprovado'].push(i);
            else grouped['orcamento'].push(i);
        });
        return grouped;
    }, [items]);

    return (
        <div className="space-y-6 h-[calc(100vh-200px)]">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        Ciclo de Vendas (CRM)
                    </h2>
                    <p className="text-sm text-neutral-500">
                        Arraste orçamentos para Aprovar e gerenciar a Produção/Entrega.
                    </p>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            items={itemsByStatus[col.id]}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeItem ? <KanbanCard item={activeItem} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
