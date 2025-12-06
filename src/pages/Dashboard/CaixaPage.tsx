import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
    useOpenCashRegister,
    useOpenCash,
    useCloseCash,
    useWithdrawal,
    useCashMovements
} from '@/hooks/usePDV';
import { formatCurrency, CashMovement, PAYMENT_METHODS } from '@/lib/pdv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    FileText,
    Printer,
    RefreshCw,
} from 'lucide-react';

interface CashSummary {
    dinheiro: { entradas: number; saidas: number };
    pix: { entradas: number; saidas: number };
    credito: { entradas: number; saidas: number };
    debito: { entradas: number; saidas: number };
    crediario: { entradas: number; saidas: number };
    outros: { entradas: number; saidas: number };
    total_entradas: number;
    total_saidas: number;
    saldo_esperado: number;
}

export function CaixaPage() {
    const [showOpenCash, setShowOpenCash] = useState(false);
    const [showCloseCash, setShowCloseCash] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showReinforcement, setShowReinforcement] = useState(false);

    const [openingBalance, setOpeningBalance] = useState('');
    const [closingBalance, setClosingBalance] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [withdrawalReason, setWithdrawalReason] = useState('');
    const [reinforcementAmount, setReinforcementAmount] = useState('');
    const [reinforcementNotes, setReinforcementNotes] = useState('');

    // Hooks
    const { data: cashRegister, isLoading: loadingCash, refetch } = useOpenCashRegister();
    const { data: movements = [] } = useCashMovements(cashRegister?.id);
    const openCashMutation = useOpenCash();
    const closeCashMutation = useCloseCash();
    const withdrawalMutation = useWithdrawal();

    // Calculate summary
    const summary: CashSummary = {
        dinheiro: { entradas: 0, saidas: 0 },
        pix: { entradas: 0, saidas: 0 },
        credito: { entradas: 0, saidas: 0 },
        debito: { entradas: 0, saidas: 0 },
        crediario: { entradas: 0, saidas: 0 },
        outros: { entradas: 0, saidas: 0 },
        total_entradas: 0,
        total_saidas: 0,
        saldo_esperado: 0,
    };

    movements.forEach(m => {
        const method = m.payment_method || 'outros';
        if (summary[method as keyof typeof summary] && typeof summary[method as keyof typeof summary] === 'object') {
            if (m.movement_type === 'entrada') {
                (summary[method as keyof CashSummary] as { entradas: number; saidas: number }).entradas += m.amount;
                summary.total_entradas += m.amount;
            } else {
                (summary[method as keyof CashSummary] as { entradas: number; saidas: number }).saidas += m.amount;
                summary.total_saidas += m.amount;
            }
        }
    });

    summary.saldo_esperado = summary.total_entradas - summary.total_saidas;

    // Handlers
    const handleOpenCash = () => {
        const balance = parseFloat(openingBalance) || 0;
        openCashMutation.mutate({ openingBalance: balance }, {
            onSuccess: () => {
                setShowOpenCash(false);
                setOpeningBalance('');
                refetch();
            }
        });
    };

    const handleCloseCash = () => {
        if (!cashRegister) return;
        const balance = parseFloat(closingBalance) || 0;
        closeCashMutation.mutate({
            registerId: cashRegister.id,
            closingBalance: balance,
            notes: closingNotes,
        }, {
            onSuccess: () => {
                setShowCloseCash(false);
                setClosingBalance('');
                setClosingNotes('');
                refetch();
            }
        });
    };

    const handleWithdrawal = () => {
        if (!cashRegister) return;
        const amount = parseFloat(withdrawalAmount) || 0;
        withdrawalMutation.mutate({
            registerId: cashRegister.id,
            amount,
            description: withdrawalReason,
            category: 'sangria',
        }, {
            onSuccess: () => {
                setShowWithdrawal(false);
                setWithdrawalAmount('');
                setWithdrawalReason('');
                refetch();
            }
        });
    };

    const handleReinforcement = async () => {
        if (!cashRegister) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const amount = parseFloat(reinforcementAmount) || 0;
        await supabase.from('cash_movements').insert({
            cash_register_id: cashRegister.id,
            movement_type: 'entrada',
            category: 'reforco',
            payment_method: 'dinheiro',
            amount,
            description: reinforcementNotes || 'Reforço de Caixa',
            operator_id: user.id,
        });

        setShowReinforcement(false);
        setReinforcementAmount('');
        setReinforcementNotes('');
        refetch();
    };

    if (loadingCash) {
        return (
            <div className="h-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Sistema de Caixa</h1>
                    <p className="text-gray-500">Controle financeiro do dia</p>
                </div>
                <div className="flex items-center gap-2">
                    {cashRegister ? (
                        <>
                            <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Caixa #{cashRegister.id} Aberto
                            </Badge>
                            <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(cashRegister.opened_at).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Badge>
                        </>
                    ) : (
                        <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Caixa Fechado
                        </Badge>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {!cashRegister ? (
                    <Button onClick={() => setShowOpenCash(true)}>
                        <Wallet className="h-4 w-4 mr-2" />
                        Abrir Caixa
                    </Button>
                ) : (
                    <>
                        <Button onClick={() => setShowWithdrawal(true)} variant="outline">
                            <ArrowDownCircle className="h-4 w-4 mr-2" />
                            Sangria
                        </Button>
                        <Button onClick={() => setShowReinforcement(true)} variant="outline">
                            <ArrowUpCircle className="h-4 w-4 mr-2" />
                            Reforço
                        </Button>
                        <Button onClick={() => setShowCloseCash(true)} variant="destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Fechar Caixa
                        </Button>
                    </>
                )}
            </div>

            {cashRegister && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Saldo Inicial
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(cashRegister.opening_balance)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    Total Entradas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(summary.total_entradas)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                                    <TrendingDown className="h-4 w-4" />
                                    Total Saídas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(summary.total_saidas)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-primary flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    Saldo Esperado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">
                                    {formatCurrency(summary.saldo_esperado)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary by Payment Method */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo por Forma de Pagamento</CardTitle>
                            <CardDescription>Detalhamento das movimentações por tipo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Forma de Pagamento</TableHead>
                                        <TableHead className="text-right text-green-600">Entradas</TableHead>
                                        <TableHead className="text-right text-red-600">Saídas</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(PAYMENT_METHODS).map(([key, { label, icon }]) => {
                                        const data = summary[key as keyof CashSummary];
                                        if (typeof data !== 'object') return null;
                                        const saldo = data.entradas - data.saidas;
                                        if (data.entradas === 0 && data.saidas === 0) return null;

                                        return (
                                            <TableRow key={key}>
                                                <TableCell>
                                                    <span className="mr-2">{icon}</span>
                                                    {label}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {formatCurrency(data.entradas)}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatCurrency(data.saidas)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(saldo)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow className="bg-gray-50 font-bold">
                                        <TableCell>TOTAL</TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {formatCurrency(summary.total_entradas)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {formatCurrency(summary.total_saidas)}
                                        </TableCell>
                                        <TableCell className="text-right text-primary">
                                            {formatCurrency(summary.saldo_esperado)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Movements History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Movimentações</CardTitle>
                            <CardDescription>Todas as entradas e saídas do caixa atual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {movements.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhuma movimentação registrada</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Horário</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Forma Pgto</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.map((m) => (
                                            <TableRow key={m.id}>
                                                <TableCell className="text-sm text-gray-500">
                                                    {new Date(m.created_at).toLocaleTimeString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={m.movement_type === 'entrada' ? 'default' : 'destructive'}>
                                                        {m.movement_type === 'entrada' ? (
                                                            <TrendingUp className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3 mr-1" />
                                                        )}
                                                        {m.movement_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="capitalize">{m.category}</TableCell>
                                                <TableCell>
                                                    {m.payment_method && PAYMENT_METHODS[m.payment_method as keyof typeof PAYMENT_METHODS]?.icon}
                                                    {' '}
                                                    {m.payment_method || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">{m.description || '-'}</TableCell>
                                                <TableCell className={`text-right font-medium ${m.movement_type === 'entrada' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {m.movement_type === 'entrada' ? '+' : '-'}
                                                    {formatCurrency(m.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Open Cash Modal */}
            <Dialog open={showOpenCash} onOpenChange={setShowOpenCash}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Abrir Caixa</DialogTitle>
                        <DialogDescription>
                            Informe o valor inicial em dinheiro para começar o dia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Valor Inicial (Dinheiro)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOpenCash(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleOpenCash} disabled={openCashMutation.isPending}>
                            <Wallet className="h-4 w-4 mr-2" />
                            Abrir Caixa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close Cash Modal */}
            <Dialog open={showCloseCash} onOpenChange={setShowCloseCash}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Fechar Caixa</DialogTitle>
                        <DialogDescription>
                            Confira os valores e confirme o fechamento do caixa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Summary */}
                        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span>Saldo Inicial:</span>
                                <span>{formatCurrency(cashRegister?.opening_balance || 0)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Total Entradas:</span>
                                <span>+{formatCurrency(summary.total_entradas)}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Total Saídas:</span>
                                <span>-{formatCurrency(summary.total_saidas)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Saldo Esperado:</span>
                                <span className="text-primary">{formatCurrency(summary.saldo_esperado)}</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Valor Conferido (Dinheiro em Caixa)</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={closingBalance}
                                onChange={(e) => setClosingBalance(e.target.value)}
                                autoFocus
                            />
                            {closingBalance && (
                                <div className={`mt-2 p-2 rounded text-sm ${parseFloat(closingBalance) === summary.dinheiro.entradas - summary.dinheiro.saidas
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}>
                                    Diferença: {formatCurrency(
                                        parseFloat(closingBalance) - (summary.dinheiro.entradas - summary.dinheiro.saidas)
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Observações</label>
                            <Textarea
                                placeholder="Observações sobre o fechamento..."
                                value={closingNotes}
                                onChange={(e) => setClosingNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCloseCash(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCloseCash} disabled={closeCashMutation.isPending} variant="destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Fechar Caixa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Withdrawal Modal */}
            <Dialog open={showWithdrawal} onOpenChange={setShowWithdrawal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowDownCircle className="h-5 w-5 text-red-500" />
                            Sangria / Retirada
                        </DialogTitle>
                        <DialogDescription>
                            Registre uma retirada de dinheiro do caixa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Valor</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Motivo</label>
                            <Textarea
                                placeholder="Descreva o motivo da retirada..."
                                value={withdrawalReason}
                                onChange={(e) => setWithdrawalReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowWithdrawal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleWithdrawal}
                            disabled={withdrawalMutation.isPending || !withdrawalAmount}
                            variant="destructive"
                        >
                            Confirmar Sangria
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reinforcement Modal */}
            <Dialog open={showReinforcement} onOpenChange={setShowReinforcement}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowUpCircle className="h-5 w-5 text-green-500" />
                            Reforço de Caixa
                        </DialogTitle>
                        <DialogDescription>
                            Registre uma entrada de dinheiro no caixa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Valor</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={reinforcementAmount}
                                onChange={(e) => setReinforcementAmount(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Observação</label>
                            <Textarea
                                placeholder="Observação sobre o reforço..."
                                value={reinforcementNotes}
                                onChange={(e) => setReinforcementNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReinforcement(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReinforcement}
                            disabled={!reinforcementAmount}
                        >
                            Confirmar Reforço
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
