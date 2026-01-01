import { useQuery } from '@tanstack/react-query';
import { dreService } from '@/lib/reports/dre-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DRETab = () => {
    const { data: dreData, isLoading, error } = useQuery({
        queryKey: ['dre-report'],
        queryFn: dreService.getDREReport
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    if (isLoading) {
        return <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Erro ao carregar o DRE. Tente novamente mais tarde.</div>;
    }

    // Calculate totals/averages for the summary cards (based on the most recent month)
    const currentMonth = dreData?.[0]; // Assumes desc order

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        Demonstrativo de Resultados (DRE)
                    </h2>
                    <p className="text-neutral-500">Análise detalhada de lucro e prejuízo por competência.</p>
                </div>
                <Button onClick={() => dreService.exportDREToPDF()} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar PDF
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-neutral-900 border-green-100 dark:border-green-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Receita Bruta (Mês Atual)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(currentMonth?.gross_revenue || 0)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-neutral-900 border-orange-100 dark:border-orange-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">CMV Estimado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(currentMonth?.cogs || 0)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-neutral-900 border-blue-100 dark:border-blue-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Lucro Bruto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {formatCurrency(currentMonth?.gross_profit || 0)}
                            <span className="text-xs font-normal text-neutral-500 bg-white/50 px-2 py-1 rounded-full">
                                {formatPercent(currentMonth?.gross_margin_percent || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 border-neutral-200 dark:border-neutral-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Lucro Líquido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold flex items-center gap-2 ${currentMonth?.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(currentMonth?.net_profit || 0)}
                            <span className="text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                                {formatPercent(currentMonth?.net_margin_percent || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento Mensal</CardTitle>
                    <CardDescription>Valores em Reais (R$)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Competência</TableHead>
                                    <TableHead className="text-right text-green-600">(+) Receita Bruta</TableHead>
                                    <TableHead className="text-right text-orange-600">(-) CMV</TableHead>
                                    <TableHead className="text-right font-bold">(=) Lucro Bruto</TableHead>
                                    <TableHead className="text-right text-red-600">(-) Despesas Op.</TableHead>
                                    <TableHead className="text-right font-bold bg-neutral-50 dark:bg-neutral-800/50">(=) Lucro Líquido</TableHead>
                                    <TableHead className="text-right text-xs text-neutral-500">Margem Líq.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dreData?.map((item) => (
                                    <TableRow key={item.month}>
                                        <TableCell className="font-medium capitalize">
                                            {format(new Date(item.month), 'MMMM yyyy', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {formatCurrency(item.gross_revenue)}
                                        </TableCell>
                                        <TableCell className="text-right text-orange-600">
                                            {formatCurrency(item.cogs)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold bg-blue-50/50 dark:bg-blue-900/10">
                                            {formatCurrency(item.gross_profit)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {formatCurrency(item.operational_expenses)}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold bg-neutral-50 dark:bg-neutral-800/50 ${item.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(item.net_profit)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-neutral-500">
                                            {formatPercent(item.net_margin_percent)}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {(!dreData || dreData.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Nenhum dado financeiro encontrado para gerar o DRE.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
