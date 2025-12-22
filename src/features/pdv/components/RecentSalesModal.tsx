import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSalesHistory, useCancelSale, useResetAllData } from '@/hooks/usePDV';
import { formatCurrency } from '@/lib/pdv';
import { Trash2, AlertTriangle, Clock, Ban, AlertOctagon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentSalesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    registerId: number;
}

export function RecentSalesModal({ open, onOpenChange, registerId }: RecentSalesModalProps) {
    const { data: sales, isLoading } = useSalesHistory(registerId);
    const cancelMutation = useCancelSale();
    const resetMutation = useResetAllData();
    const [confirmId, setConfirmId] = useState<number | null>(null);

    const handleCancel = async (id: number) => {
        await cancelMutation.mutateAsync({ saleId: id, reason: 'Solicitado pelo operador via PDV' });
        setConfirmId(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Últimas Vendas</DialogTitle>
                    <DialogDescription>
                        Histórico recente desta sessão de caixa.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-10 text-muted-foreground">Carregando...</div>
                        ) : sales?.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">Nenhuma venda registrada nesta sessão.</div>
                        ) : (
                            sales?.map((sale: any) => (
                                <div
                                    key={sale.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${sale.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-75' : 'bg-white border-neutral-100'}`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">#{sale.id}</span>
                                            {sale.status === 'cancelled' && (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <Ban className="h-3 w-3" /> Cancelado
                                                </Badge>
                                            )}
                                            {sale.status === 'concluida' && (
                                                <Badge variant="outline" className="text-green-600 border-green-200">
                                                    Concluída
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(sale.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                            <span>•</span>
                                            <span className="capitalize">{sale.payment_method}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`font-bold text-lg ${sale.status === 'cancelled' ? 'line-through text-neutral-400' : 'text-primary'}`}>
                                                {formatCurrency(sale.total)}
                                            </div>
                                        </div>

                                        {sale.status !== 'cancelled' && (
                                            confirmId === sale.id ? (
                                                <div className="flex gap-2 animate-in fade-in slide-in-from-right-5">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setConfirmId(null)}
                                                    >
                                                        Voltar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleCancel(sale.id)}
                                                        disabled={cancelMutation.isPending}
                                                    >
                                                        {cancelMutation.isPending ? '...' : 'Confirmar'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setConfirmId(sale.id)}
                                                    title="Estornar / Cancelar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
