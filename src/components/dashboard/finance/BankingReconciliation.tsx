import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBankAccounts,
    getBankStatementEntries,
    getFinancialTransactions,
    reconcileTransaction,
    BankAccount,
    BankStatementEntry,
    FinancialTransaction
} from '@/lib/financial';
import { parseStatementFile } from '@/lib/financial-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Upload,
    RefreshCcw,
    CheckCircle2,
    ArrowRightLeft,
    Banknote,
    AlertCircle,
    FileUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function BankingReconciliation() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Queries
    const { data: accounts } = useQuery({
        queryKey: ['bank_accounts'],
        queryFn: getBankAccounts
    });

    const { data: entries } = useQuery({
        queryKey: ['bank_statement_entries', selectedAccountId],
        queryFn: () => getBankStatementEntries(selectedAccountId!),
        enabled: !!selectedAccountId
    });

    const { data: transactions } = useQuery({
        queryKey: ['financial_transactions', { status: 'pending' }],
        queryFn: () => getFinancialTransactions({ status: 'pending' })
    });

    // Reconcile Mutation
    const reconcileMutation = useMutation({
        mutationFn: ({ entryId, txId }: { entryId: string, txId: string }) =>
            reconcileTransaction(entryId, txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank_statement_entries'] });
            queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financial_summary'] });
            toast({ title: 'Sucesso', description: 'Transação conciliada com sucesso!' });
        }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAccountId) return;

        setIsUploading(true);
        try {
            const parsed = await parseStatementFile(file);
            // In a real app, we would send these to the backend/supabase
            // For now, let's simulate the success
            toast({
                title: 'Extrato Importado',
                description: `${parsed.length} lançamentos encontrados. (Simulação)`
            });
            // Mocking data update if needed or just showing what was found
        } catch (error) {
            toast({ title: 'Erro', description: 'Erro ao processar arquivo.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Account Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts?.map((account) => (
                    <Card
                        key={account.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md border-2",
                            selectedAccountId === account.id ? "border-primary-500 bg-primary-500/5" : "border-transparent"
                        )}
                        onClick={() => setSelectedAccountId(account.id)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{account.bank_name || 'Carteira'}</p>
                                <h4 className="text-lg font-black">{account.name}</h4>
                                <p className="text-sm font-bold text-primary-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                                </p>
                            </div>
                            <Banknote className={cn("w-8 h-8", selectedAccountId === account.id ? "text-primary-500" : "text-neutral-200")} />
                        </CardContent>
                    </Card>
                ))}

                <label className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 transition-colors">
                    <PlusCircle className="w-6 h-6 text-neutral-400" />
                    <span className="text-xs font-bold uppercase text-neutral-500">Adicionar Conta</span>
                </label>
            </div>

            {!selectedAccountId ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100">
                    <ArrowRightLeft className="w-12 h-12 mb-2 opacity-20" />
                    <p className="font-bold">Selecione uma conta para conciliar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bank Statement Entries */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <RefreshCcw className="w-5 h-5 text-primary-500" />
                                Lançamentos do Banco
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    id="stmt-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".ofx,.csv"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('stmt-upload')?.click()}
                                    disabled={isUploading}
                                >
                                    <FileUp className="w-4 h-4 mr-2" />
                                    Importar Extrato
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                            {entries?.map((entry) => (
                                <Card key={entry.id} className={cn(
                                    "transition-all",
                                    entry.reconciled ? "bg-success-50/50 border-success-200 opacity-60" : "hover:border-primary-200"
                                )}>
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                entry.type === 'credit' ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"
                                            )}>
                                                {entry.type === 'credit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{entry.description}</p>
                                                <p className="text-[10px] text-neutral-500">{format(new Date(entry.date), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black",
                                                entry.type === 'credit' ? "text-success-600" : "text-danger-600"
                                            )}>
                                                {entry.type === 'credit' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                                            </p>
                                            {entry.reconciled && <Badge className="bg-success-500 hover:bg-success-600 text-[8px] h-4">Conciliado</Badge>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {(!entries || entries.length === 0) && (
                                <div className="py-12 text-center text-neutral-400">
                                    <Upload className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                    <p className="text-sm">Nenhum lançamento no banco</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* System Transactions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                            Lançamentos no Sistema
                        </h3>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                            {transactions?.map((tx) => (
                                <Card key={tx.id} className="hover:border-primary-200 transition-all cursor-move">
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                tx.type === 'receivable' ? "bg-success-100 text-success-600" : "bg-danger-100 text-danger-600"
                                            )}>
                                                {tx.type === 'receivable' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{tx.description}</p>
                                                <p className="text-[10px] text-neutral-500">Venc: {format(new Date(tx.due_date), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <p className={cn(
                                                "font-black",
                                                tx.type === 'receivable' ? "text-success-600" : "text-danger-600"
                                            )}>
                                                {tx.type === 'receivable' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                            </p>
                                            <Button size="sm" variant="ghost" className="h-6 text-[8px] uppercase font-black hover:bg-primary-50 hover:text-primary-600">
                                                Conciliar com Banco
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Icons
import { Plus, Minus, PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
