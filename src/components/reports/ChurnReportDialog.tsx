import { useQuery } from '@tanstack/react-query';
import { churnService } from '@/lib/reports/churn-service';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileDown, Phone, Mail } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChurnReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ChurnReportDialog = ({ open, onOpenChange }: ChurnReportDialogProps) => {
    const { data: risks, isLoading } = useQuery({
        queryKey: ['churn-report'],
        queryFn: () => churnService.getChurnRisks(90),
        enabled: open
    });

    const exportCSV = () => {
        if (!risks) return;
        const headers = "Cliente,Email,Telefone,Ultima Compra,Dias Inativo,Total Gasto\n";
        const rows = risks.map(r =>
            `"${r.client_name}","${r.client_email}","${r.client_phone}","${r.last_purchase_date}",${r.days_since_last_purchase},${r.total_spent}`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "churn_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Análise de Churn (Risco de Evasão)
                            </DialogTitle>
                            <DialogDescription>
                                Clientes sem compras há mais de 90 dias com histórico de atividade.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!risks || risks.length === 0}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead className="text-right">Última Compra</TableHead>
                                        <TableHead className="text-right">Inativo há</TableHead>
                                        <TableHead className="text-right">Valor Vitalício (LTV)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {risks?.map((client) => (
                                        <TableRow key={client.client_id}>
                                            <TableCell className="font-medium">
                                                {client.client_name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs text-neutral-500">
                                                    {client.client_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.client_email}</span>}
                                                    {client.client_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.client_phone}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {format(new Date(client.last_purchase_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-500">
                                                {client.days_since_last_purchase} dias
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total_spent)}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {(!risks || risks.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                                                Nenhum cliente em risco de churn encontrado (todos compraram nos últimos 90 dias ou não possuem histórico).
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
