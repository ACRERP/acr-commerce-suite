import { useQuotes, useDeleteQuote, useConvertQuote, useDuplicateQuote, Quote } from '@/hooks/useQuotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, FileText, Smartphone, Printer, Trash2, Clock, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { useToast } from '@/hooks/use-toast';

interface QuoteListProps {
    onCreateNew: () => void;
    onEdit: (quote: Quote) => void;
    hideHeader?: boolean;
}

export function QuoteList({ onCreateNew, onEdit, hideHeader = false }: QuoteListProps) {
    const { data: quotes, isLoading } = useQuotes();
    const deleteQuote = useDeleteQuote();
    const duplicateQuote = useDuplicateQuote();
    const convertQuote = useConvertQuote();
    const { toast } = useToast();

    // ... helpers ...

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-neutral-100 text-neutral-600';
            case 'sent': return 'bg-blue-100 text-blue-600';
            case 'approved': return 'bg-green-100 text-green-600';
            case 'rejected': return 'bg-red-100 text-red-600';
            case 'expired': return 'bg-orange-100 text-orange-600';
            default: return 'bg-neutral-100 text-neutral-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Rascunho';
            case 'sent': return 'Enviado';
            case 'approved': return 'Aprovado';
            case 'rejected': return 'Rejeitado';
            case 'expired': return 'Expirado';
            default: return status;
        }
    };

    // ... handlers ...

    const handlePrint = (e: React.MouseEvent, quoteId: number) => {
        e.stopPropagation();
        window.open(`/print/quote/${quoteId}`, '_blank');
    };

    const handleWhatsApp = (e: React.MouseEvent, quote: any) => {
        e.stopPropagation();

        // Build items list
        let itemsText = '';
        if (quote.quote_items && quote.quote_items.length > 0) {
            itemsText = quote.quote_items.map((i: any) =>
                `- ${i.quantity}x ${i.products?.name || 'Item'} (${formatCurrency(i.total)})`
            ).join('\n');
        }

        const laborText = quote.labor_cost > 0 ? `\nMão de Obra: ${formatCurrency(quote.labor_cost)}` : '';
        const paymentText = quote.payment_terms ? `\nCondições: ${quote.payment_terms}` : '';

        const message = `Olá *${quote.client_name || 'Cliente'}*, segue o orçamento *#${quote.id}*:\n\n` +
            `${itemsText}` +
            `${laborText}` +
            `\n\n*Total: ${formatCurrency(quote.total_amount)}*` +
            `${paymentText}\n\n` +
            `Fico à disposição!`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleDelete = async (e: React.MouseEvent, quoteId: number) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este orçamento?')) {
            await deleteQuote.mutateAsync(quoteId);
        }
    };

    const handleDuplicate = async (e: React.MouseEvent, quoteId: number) => {
        e.stopPropagation();
        if (confirm('Deseja duplicar este orçamento?')) {
            await duplicateQuote.mutateAsync(quoteId);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-neutral-500 animate-pulse">Carregando orçamentos...</div>;
    }

    return (
        <div className="space-y-6">
            {!hideHeader && (
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Orçamentos & Propostas</h2>
                        <p className="text-neutral-500">Gerencie suas cotações comerciais. Clique para editar.</p>
                    </div>
                    <Button onClick={onCreateNew} className="btn-primary gap-2 shadow-lg shadow-primary-500/20">
                        <Plus className="w-4 h-4" />
                        Nova Proposta
                    </Button>
                </div>
            )}

            <div className="grid gap-4">
                {quotes?.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                            <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900">Nenhum orçamento encontrado</h3>
                            <p className="text-neutral-500 mb-4">Crie sua primeira proposta comercial agora mesmo.</p>
                            <Button onClick={onCreateNew} variant="outline">Criar Proposta</Button>
                        </CardContent>
                    </Card>
                ) : (
                    quotes?.map((quote) => (
                        <Card
                            key={quote.id}
                            className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary-500 group relative overflow-hidden"
                            onClick={() => onEdit(quote)}
                        >
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg">#{quote.id}</span>
                                        <Badge className={`${getStatusColor(quote.status)} border-none shadow-none`}>
                                            {getStatusLabel(quote.status)}
                                        </Badge>
                                        <span className="text-neutral-400 hidden sm:inline">•</span>
                                        <span className="font-medium text-neutral-900 line-clamp-1">{quote.client_name || 'Cliente Não Identificado'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                        {quote.valid_until && (
                                            <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs font-medium inline-block w-fit">
                                                Validade: {format(new Date(quote.valid_until), "dd/MM", { locale: ptBR })}
                                            </span>
                                        )}
                                        <span className="hidden sm:inline">Vendedor: {quote.user_name}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-2xl font-bold text-primary-600">
                                            {formatCurrency(quote.total_amount)}
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {quote.payment_terms || 'À Vista'}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-600 hover:text-blue-600 hover:bg-blue-50"
                                            title="Duplicar"
                                            onClick={(e) => handleDuplicate(e, quote.id)}
                                            disabled={duplicateQuote.isPending}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title="Enviar WhatsApp"
                                            onClick={(e) => handleWhatsApp(e, quote)}
                                        >
                                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            title="Gerar PDF"
                                            onClick={(e) => handlePrint(e, quote.id)}
                                        >
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                                            title="Imprimir"
                                            onClick={(e) => handlePrint(e, quote.id)}
                                        >
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                            title="Excluir"
                                            onClick={(e) => handleDelete(e, quote.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-4 pt-4 border-t flex justify-end">
                                        {quote.status !== 'approved' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    convertQuote.mutate(quote.id);
                                                }}
                                                disabled={convertQuote.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                {convertQuote.isPending ? 'Gerando Venda...' : 'Aprovar e Gerar Venda'}
                                            </Button>
                                        )}
                                        {quote.status === 'approved' && (
                                            <div className="flex items-center text-sm text-green-600 font-medium">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Venda Gerada
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
