
import { ServiceOrder } from './ServiceOrderList';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Clock, User, MessageSquare, FileText, Send } from 'lucide-react';
import { generateServiceOrderPDF, openWhatsAppWithMessage } from '@/lib/pdf/serviceOrderPDF';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ServiceOrdersKanbanProps {
    orders: ServiceOrder[];
    onEditOrder: (order: ServiceOrder) => void;
    onCancelOrder: (order: ServiceOrder) => void;
    onStatusChange: (orderId: number, newStatus: string) => void;
}

const columns = [
    { id: 'aberta', title: 'Aberta', color: 'bg-blue-100 text-blue-800' },
    { id: 'em_analise', title: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'aguardando_aprovacao', title: 'Aguardando Aprovação', color: 'bg-orange-100 text-orange-800' },
    { id: 'em_execucao', title: 'Em Execução', color: 'bg-purple-100 text-purple-800' },
    { id: 'aguardando_peca', title: 'Aguardando Peça', color: 'bg-red-100 text-red-800' },
    { id: 'concluida', title: 'Finalizada', color: 'bg-green-100 text-green-800' },
    { id: 'entregue', title: 'Entregue', color: 'bg-gray-100 text-gray-800' },
];

export function ServiceOrdersKanban({ orders, onEditOrder, onCancelOrder, onStatusChange }: ServiceOrdersKanbanProps) {
    const { toast } = useToast();

    const getOrdersByStatus = (status: string) => {
        return orders.filter((order) => order.status === status);
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;
        // Call parent to update DB
        onStatusChange(parseInt(draggableId), newStatus);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
                {columns.map((column) => (
                    <div key={column.id} className="flex-shrink-0 w-80 bg-gray-50/50 rounded-xl flex flex-col h-full border border-gray-100">
                        <div className={`p-3 rounded-t-xl font-semibold flex justify-between items-center ${column.color.replace('text-', 'bg-').replace('100', '50')} border-b border-gray-100`}>
                            <span className={column.color.split(' ')[1]}>{column.title}</span>
                            <Badge variant="secondary" className="bg-white/50 text-xs">
                                {getOrdersByStatus(column.id).length}
                            </Badge>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="p-3 flex-1 overflow-y-auto space-y-3"
                                >
                                    {getOrdersByStatus(column.id).map((order, index) => (
                                        <Draggable key={order.id} draggableId={order.id.toString()} index={index}>
                                            {(provided) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-gray-200"
                                                >
                                                    <CardContent className="p-3 space-y-3">
                                                        {/* Header: ID + Client */}
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-xs font-mono text-gray-500">#{order.id.toString().padStart(4, '0')}</span>
                                                                <h4 className="font-semibold text-sm truncate w-40" title={order.clients?.name}>
                                                                    {order.clients?.name}
                                                                </h4>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100">
                                                                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => onEditOrder(order)}>
                                                                        Editar / Ver Detalhes
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={async () => {
                                                                        // Fetch items for this order
                                                                        const { data: items } = await supabase
                                                                            .from('service_order_items')
                                                                            .select('*')
                                                                            .eq('service_order_id', order.id);
                                                                        await generateServiceOrderPDF(order, items || []);
                                                                    }}>
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        Exportar PDF
                                                                    </DropdownMenuItem>
                                                                    {order.clients?.phone && (
                                                                        <DropdownMenuItem onClick={() => {
                                                                            openWhatsAppWithMessage(order.clients!.phone!, order.id);
                                                                        }}>
                                                                            <Send className="mr-2 h-4 w-4" />
                                                                            Enviar WhatsApp
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem className="text-red-600" onClick={() => onCancelOrder(order)}>
                                                                        Cancelar OS
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        {/* Device Info */}
                                                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                                                            <span className="font-medium">{order.device_type}</span>
                                                            {order.device_brand && ` - ${order.device_brand}`}
                                                            <div className="truncate mt-1 text-gray-500">{order.device_model}</div>
                                                        </div>

                                                        {/* Issue Preview */}
                                                        <p className="text-xs text-gray-600 line-clamp-2 italic">
                                                            "{order.reported_issue}"
                                                        </p>

                                                        {/* Footer: Date + Tech */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                            <div className="flex items-center text-xs text-gray-400" title="Data de Entrada">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {format(new Date(order.created_at), 'dd/MM', { locale: ptBR })}
                                                            </div>
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                    <User className="h-3 w-3" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
