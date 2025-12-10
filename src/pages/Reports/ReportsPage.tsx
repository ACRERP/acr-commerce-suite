import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reportsService } from '@/lib/reports/reports-service';
import { Download, FileSpreadsheet, Printer, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ReportType =
    | 'sales-detailed'
    | 'products-sold'
    | 'inventory'
    | 'financial'
    | 'clients'
    | 'cash-flow';

const REPORT_TYPES = [
    { value: 'sales-detailed', label: 'Vendas Detalhadas' },
    { value: 'products-sold', label: 'Produtos Vendidos' },
    { value: 'inventory', label: 'Estoque' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'clients', label: 'Clientes' },
    { value: 'cash-flow', label: 'Fluxo de Caixa' },
];

export default function ReportsPage() {
    const { toast } = useToast();
    const [reportType, setReportType] = useState<ReportType>('sales-detailed');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<any[]>([]);

    // Query baseada no tipo de relatório
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['report', reportType, startDate, endDate],
        queryFn: async () => {
            switch (reportType) {
                case 'sales-detailed':
                    return reportsService.getSalesDetailed();
                case 'products-sold':
                    return reportsService.getProductsSold();
                case 'inventory':
                    return reportsService.getInventory();
                case 'financial':
                    return reportsService.getFinancial();
                case 'clients':
                    return reportsService.getClients(startDate, endDate);
                case 'cash-flow':
                    return reportsService.getCashFlow(startDate, endDate);
                default:
                    return [];
            }
        },
        enabled: false, // Não executar automaticamente
    });

    const handleGenerateReport = async () => {
        const result = await refetch();
        if (result.data) {
            setReportData(result.data);
        }
    };

    const handleExportCSV = () => {
        if (reportData.length === 0) {
            toast({
                title: 'Nenhum dado',
                description: 'Gere um relatório primeiro antes de exportar.',
                variant: 'destructive',
            });
            return;
        }

        const reportName = REPORT_TYPES.find(r => r.value === reportType)?.label || 'relatorio';
        reportsService.exportToCSV(reportData, reportName);

        toast({
            title: 'Exportado!',
            description: 'Relatório exportado para CSV com sucesso.',
        });
    };

    const handleExportExcel = () => {
        if (reportData.length === 0) {
            toast({
                title: 'Nenhum dado',
                description: 'Gere um relatório primeiro antes de exportar.',
                variant: 'destructive',
            });
            return;
        }

        const reportName = REPORT_TYPES.find(r => r.value === reportType)?.label || 'relatorio';
        reportsService.exportToExcel(reportData, reportName);

        toast({
            title: 'Exportado!',
            description: 'Relatório exportado para Excel com sucesso.',
        });
    };

    const handlePrint = () => {
        if (reportData.length === 0) {
            toast({
                title: 'Nenhum dado',
                description: 'Gere um relatório primeiro antes de imprimir.',
                variant: 'destructive',
            });
            return;
        }

        const reportName = REPORT_TYPES.find(r => r.value === reportType)?.label || 'Relatório';
        reportsService.printReport(reportName, reportData);
    };

    const renderTableHeaders = () => {
        if (reportData.length === 0) return null;

        const firstRow = reportData[0];
        return Object.keys(firstRow).map((key) => (
            <TableHead key={key} className="capitalize">
                {key.replace(/_/g, ' ')}
            </TableHead>
        ));
    };

    const renderTableRows = () => {
        return reportData.map((row, index) => (
            <TableRow key={index}>
                {Object.values(row).map((value: any, cellIndex) => (
                    <TableCell key={cellIndex}>
                        {typeof value === 'number' && value % 1 !== 0
                            ? value.toFixed(2)
                            : value?.toString() || '-'}
                    </TableCell>
                ))}
            </TableRow>
        ));
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
                <p className="text-muted-foreground">
                    Gere e exporte relatórios detalhados do seu negócio
                </p>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle>Configurar Relatório</CardTitle>
                    <CardDescription>
                        Selecione o tipo de relatório e o período desejado
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Tipo de Relatório */}
                        <div className="space-y-2">
                            <Label htmlFor="report-type">Tipo de Relatório</Label>
                            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                                <SelectTrigger id="report-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPORT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Data Início */}
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Data Início</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* Data Fim */}
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Data Fim</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Botão Gerar */}
                        <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button
                                onClick={handleGenerateReport}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Gerar Relatório
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ações de Exportação */}
            {reportData.length > 0 && (
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Exportar Excel
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                    <div className="ml-auto text-sm text-muted-foreground">
                        {reportData.length} registro(s) encontrado(s)
                    </div>
                </div>
            )}

            {/* Tabela de Resultados */}
            <Card>
                <CardHeader>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>
                        {reportData.length > 0
                            ? `Exibindo ${reportData.length} registro(s)`
                            : 'Nenhum relatório gerado ainda'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reportData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhum relatório gerado</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Selecione um tipo de relatório, configure o período e clique em "Gerar Relatório"
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-auto max-h-[600px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {renderTableHeaders()}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderTableRows()}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
