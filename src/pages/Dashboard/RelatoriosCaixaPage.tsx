import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency, PAYMENT_METHODS } from '@/lib/pdv';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Users,
    Package,
    RefreshCw,
} from 'lucide-react';

interface DailyReport {
    date: string;
    total_vendas: number;
    qtd_vendas: number;
    ticket_medio: number;
    total_dinheiro: number;
    total_pix: number;
    total_credito: number;
    total_debito: number;
}

export function RelatoriosCaixaPage() {
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Daily sales report
    const { data: salesReport = [], isLoading, refetch } = useQuery({
        queryKey: ['sales-report', startDate, endDate],
        queryFn: async () => {
            const { data: sales } = await supabase
                .from('sales')
                .select(`
          id,
          total,
          created_at,
          status,
          sale_payments(payment_method, amount)
        `)
                .eq('status', 'completed')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .order('created_at', { ascending: false });

            return sales || [];
        },
    });

    // Cash registers report
    const { data: cashRegisters = [] } = useQuery({
        queryKey: ['cash-registers-report', startDate, endDate],
        queryFn: async () => {
            const { data } = await supabase
                .from('cash_registers')
                .select('*')
                .gte('opened_at', `${startDate}T00:00:00`)
                .lte('opened_at', `${endDate}T23:59:59`)
                .order('opened_at', { ascending: false });

            return data || [];
        },
    });

    // Calculate totals
    const totalVendas = salesReport.reduce((sum, s) => sum + (s.total || 0), 0);
    const qtdVendas = salesReport.length;
    const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

    const paymentTotals = {
        dinheiro: 0,
        pix: 0,
        credito: 0,
        debito: 0,
        crediario: 0,
        outros: 0,
    };

    salesReport.forEach((sale: any) => {
        sale.sale_payments?.forEach((payment: any) => {
            const method = payment.payment_method as keyof typeof paymentTotals;
            if (paymentTotals[method] !== undefined) {
                paymentTotals[method] += payment.amount;
            }
        });
    });

    // Top products
    const { data: topProducts = [] } = useQuery({
        queryKey: ['top-products', startDate, endDate],
        queryFn: async () => {
            const { data } = await supabase
                .from('sale_items')
                .select(`
          product_id,
          product_name,
          quantity,
          subtotal,
          sales!inner(status, created_at)
        `)
                .eq('sales.status', 'completed')
                .gte('sales.created_at', `${startDate}T00:00:00`)
                .lte('sales.created_at', `${endDate}T23:59:59`);

            // Aggregate by product
            const productMap = new Map<number, { name: string; qty: number; total: number }>();
            data?.forEach((item: any) => {
                const existing = productMap.get(item.product_id);
                if (existing) {
                    existing.qty += item.quantity;
                    existing.total += item.subtotal;
                } else {
                    productMap.set(item.product_id, {
                        name: item.product_name,
                        qty: item.quantity,
                        total: item.subtotal,
                    });
                }
            });

            return Array.from(productMap.values())
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 10);
        },
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Relatórios de Caixa</h1>
                    <p className="text-gray-500">Análise de vendas e movimentações</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-40"
                    />
                    <span className="text-gray-400">até</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={() => refetch()} variant="outline">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Total Vendas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalVendas)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4" />
                            Qtd. Vendas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{qtdVendas}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Ticket Médio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {formatCurrency(ticketMedio)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Caixas Abertos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cashRegisters.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Methods Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Vendas por Forma de Pagamento</CardTitle>
                    <CardDescription>Detalhamento por método</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {Object.entries(PAYMENT_METHODS).map(([key, { label, icon }]) => (
                            <div key={key} className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-2xl">{icon}</div>
                                <div className="text-sm text-gray-500 mt-1">{label}</div>
                                <div className="font-bold text-lg mt-1">
                                    {formatCurrency(paymentTotals[key as keyof typeof paymentTotals] || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Últimas Vendas</CardTitle>
                        <CardDescription>Vendas concluídas no período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : salesReport.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma venda no período
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Data/Hora</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesReport.slice(0, 10).map((sale: any) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>#{sale.id}</TableCell>
                                            <TableCell>
                                                {new Date(sale.created_at).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(sale.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Produtos Mais Vendidos
                        </CardTitle>
                        <CardDescription>Top 10 do período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topProducts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhum produto vendido no período
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="text-right">Qtd</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topProducts.map((product: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-right">{product.qty}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(product.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cash Registers */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Caixas</CardTitle>
                    <CardDescription>Caixas abertos/fechados no período</CardDescription>
                </CardHeader>
                <CardContent>
                    {cashRegisters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhum caixa no período
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Operador</TableHead>
                                    <TableHead>Abertura</TableHead>
                                    <TableHead>Fechamento</TableHead>
                                    <TableHead className="text-right">Saldo Inicial</TableHead>
                                    <TableHead className="text-right">Saldo Final</TableHead>
                                    <TableHead className="text-right">Diferença</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashRegisters.map((register: any) => (
                                    <TableRow key={register.id}>
                                        <TableCell>#{register.id}</TableCell>
                                        <TableCell>{register.operator_name}</TableCell>
                                        <TableCell>
                                            {new Date(register.opened_at).toLocaleString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {register.closed_at
                                                ? new Date(register.closed_at).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(register.opening_balance)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {register.closing_balance
                                                ? formatCurrency(register.closing_balance)
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className={`text-right ${register.difference > 0 ? 'text-green-600' :
                                                register.difference < 0 ? 'text-red-600' : ''
                                            }`}>
                                            {register.difference
                                                ? formatCurrency(register.difference)
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={register.status === 'open' ? 'default' : 'secondary'}>
                                                {register.status === 'open' ? 'Aberto' : 'Fechado'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
