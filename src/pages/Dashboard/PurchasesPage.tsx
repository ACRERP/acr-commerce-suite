import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { purchaseService, Purchase } from "@/lib/purchases/purchase-service";
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; className: string }> = {
    completed: { label: "Concluída", className: "bg-green-100 text-green-700 border-green-200" },
    pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    draft: { label: "Rascunho", className: "bg-gray-100 text-gray-700 border-gray-200" },
    canceled: { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function PurchasesPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['purchases'],
        queryFn: purchaseService.getPurchases,
    });

    const filteredPurchases = purchases?.filter(p =>
        p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoice_number.includes(searchTerm)
    );

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <MainLayout>
            <div className="container-premium py-8 space-y-8 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight">
                            Compras
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400">
                            Gerencie entradas de notas fiscais e estoque
                        </p>
                    </div>
                    <Button
                        className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="w-4 h-4" /> Nova Compra
                    </Button>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por fornecedor ou nº nota..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" /> Filtros
                    </Button>
                </div>

                <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
                    <CardHeader>
                        <CardTitle>Histórico de Compras</CardTitle>
                        <CardDescription>Todas as movimentações de entrada registradas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : !filteredPurchases?.length ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhuma compra encontrada.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data Emissão</TableHead>
                                        <TableHead>Fornecedor</TableHead>
                                        <TableHead>Nº Nota</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPurchases.map((purchase) => (
                                        <TableRow key={purchase.id} className="hover:bg-muted/50 cursor-pointer">
                                            <TableCell>
                                                {format(new Date(purchase.issue_date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {purchase.supplier?.name || "Fornecedor Desconhecido"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {purchase.invoice_number}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusConfig[purchase.status]?.className || ""}>
                                                    {statusConfig[purchase.status]?.label || purchase.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(purchase.total_amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <CreatePurchaseDialog open={createOpen} onOpenChange={setCreateOpen} />
            </div>
        </MainLayout>
    );
}
