import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuote } from '@/hooks/useQuotes';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '@/lib/config-service';

export function QuotePrintable() {
    const { id } = useParams();
    const quoteId = Number(id);
    const { data: quote, isLoading, error } = useQuote(quoteId);

    // Fetch Company Config
    const { data: companyConfig } = useQuery({
        queryKey: ['config', 'company'],
        queryFn: () => getConfig('company')
    });

    useEffect(() => {
        if (quote && !isLoading) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [quote, isLoading]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
                <span className="ml-2 text-neutral-500">Carregando orçamento...</span>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="flex items-center justify-center h-screen text-red-500">
                Erro ao carregar orçamento. Verifique o ID.
            </div>
        );
    }

    const itemsTotal = quote.items?.reduce((acc, item) => acc + item.total, 0) || 0;
    // If total_amount > itemsTotal, the difference is likely Labor Cost or other fees if not explicitly separated in backend yet.
    // But we have labor_cost in Quote object now.
    const laborCost = quote.labor_cost || 0;

    // Assuming 'ACR ERP' or user Company Name. Ideally fetched from System Config.
    const companyName = companyConfig?.razao_social || "Empresa Não Configurada";
    const companySub = "Soluções e Serviços"; // Generic fallback
    const companyCnpj = companyConfig?.cnpj || "00.000.000/0000-00";
    const companyPhone = companyConfig?.telefone || "(00) 0000-0000";

    return (
        <div className="bg-white min-h-screen text-neutral-900 font-sans p-8 print:p-0">
            <div className="max-w-4xl mx-auto border print:border-none p-8 print:p-0 bg-white shadow-lg print:shadow-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">{companyName}</h1>
                        <p className="text-sm text-neutral-500 mt-1">{companySub}</p>
                        <p className="text-sm text-neutral-500">CNPJ: {companyCnpj}</p>
                        <p className="text-sm text-neutral-500">Tel: {companyPhone}</p>
                        {companyConfig?.endereco && <p className="text-sm text-neutral-500">{companyConfig.endereco}</p>}
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-primary-700">ORÇAMENTO</h2>
                        <p className="text-lg font-mono text-neutral-600">#{quote.id}</p>
                        <p className="text-sm text-neutral-500 mt-2">
                            Data: {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        {quote.valid_until && (
                            <p className="text-sm text-orange-600 font-medium">
                                Válido até: {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                        )}
                    </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-2">Cliente</h3>
                        <p className="font-bold text-lg">{quote.client_name || 'Cliente Balcão'}</p>
                        {/* Add more client details if available in object */}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-2">Vendedor</h3>
                        <p className="font-medium text-neutral-800">{quote.user_name || 'Vendedor'}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-neutral-800">
                                <th className="py-2 text-sm font-bold uppercase">Descrição</th>
                                <th className="py-2 text-sm font-bold uppercase text-right w-24">Qtd</th>
                                <th className="py-2 text-sm font-bold uppercase text-right w-32">Unitário</th>
                                <th className="py-2 text-sm font-bold uppercase text-right w-32">Desc.</th>
                                <th className="py-2 text-sm font-bold uppercase text-right w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {quote.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-3">
                                        <span className="font-medium block">{item.product_name}</span>
                                        <span className="text-xs text-neutral-500">{item.product_code}</span>
                                    </td>
                                    <td className="py-3 text-right">{item.quantity}</td>
                                    <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="py-3 text-right text-red-600">
                                        {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '-'}
                                    </td>
                                    <td className="py-3 text-right font-bold text-neutral-900">
                                        {formatCurrency(item.total)}
                                    </td>
                                </tr>
                            ))}
                            {(!quote.items || quote.items.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-neutral-500 italic">
                                        Nenhum produto incluído.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mt-6 border-t pt-4">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-neutral-600">
                            <span>Subtotal Produtos:</span>
                            <span>{formatCurrency(itemsTotal)}</span>
                        </div>
                        {laborCost > 0 && (
                            <div className="flex justify-between text-neutral-800 font-medium">
                                <span>Mão de Obra:</span>
                                <span>{formatCurrency(laborCost)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-neutral-900 border-t border-neutral-300 pt-2 mt-2">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(quote.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer / Notes */}
                <div className="mt-12 pt-8 border-t border-neutral-200 text-sm text-neutral-500">
                    {quote.payment_terms && (
                        <p className="mb-2"><span className="font-bold text-neutral-700">Condições de Pagamento:</span> {quote.payment_terms}</p>
                    )}

                    {companyConfig?.quote_terms && (
                        <div className="mt-4 text-xs text-neutral-500 border-t border-dashed pt-2">
                            <p className="font-bold mb-1">Termos e Condições:</p>
                            <p>{companyConfig.quote_terms}</p>
                        </div>
                    )}

                    {quote.notes && (
                        <div className="mt-4 p-4 bg-neutral-50 rounded border border-neutral-100">
                            <p className="font-bold text-neutral-700 mb-1">Observações:</p>
                            <p className="whitespace-pre-wrap">{quote.notes}</p>
                        </div>
                    )}
                    <p className="mt-8 text-center text-xs text-neutral-400">
                        Impresso em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} via ACR Sales Module.
                        {companyConfig?.footer_message && <span className="block mt-1 font-medium">{companyConfig.footer_message}</span>}
                    </p>
                </div>

                {/* Actions (Hidden in Print) */}
                <div className="fixed bottom-8 right-8 print:hidden flex gap-4">
                    <button
                        onClick={() => {
                            // @ts-ignore
                            import('html2pdf.js').then(html2pdf => {
                                const element = document.querySelector('.max-w-4xl'); // Select the content container
                                const opt = {
                                    margin: 10,
                                    filename: `Orcamento-${quote.id}.pdf`,
                                    image: { type: 'jpeg', quality: 0.98 },
                                    html2canvas: { scale: 2 },
                                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                };
                                html2pdf.default().from(element).set(opt).save();
                            });
                        }}
                        className="bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-red-700 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <span className="text-xl">📄</span> Salvar PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-neutral-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-neutral-800 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <span className="text-xl">🖨️</span> Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
}
