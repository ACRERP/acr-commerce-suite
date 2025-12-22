
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { purchaseService } from "@/lib/purchases/purchase-service";
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog";
import { PurchaseFilters } from "@/components/purchases/PurchaseFilters";
import { PurchaseActions } from "@/components/purchases/PurchaseActions";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
    completed: { label: "Concluída", className: "bg-green-100 text-green-700 border-green-200" },
    pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    draft: { label: "Rascunho", className: "bg-gray-100 text-gray-700 border-gray-200" },
    canceled: { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function PurchasesPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: purchasesData, isLoading } = useQuery({
        queryKey: ['purchases', { page: currentPage, limit: itemsPerPage, search: searchTerm }],
        queryFn: () => purchaseService.getPurchases({ page: currentPage, limit: itemsPerPage, search: searchTerm }),
        placeholderData: (previousData) => previousData,
    });

    const purchases = purchasesData?.data || [];
    const totalCount = purchasesData?.count || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // No client-side filtering
    const filteredPurchases = purchases;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <MainLayout>
            <div className="flex gap-6 h-full p-6">
                {/* 1. Filters */}
                <PurchaseFilters />

                {/* 2. List */}
                <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nº nota..."
                            className="pl-10 bg-white dark:bg-neutral-900 border-border shadow-sm h-11"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border border-border shadow-sm rounded-lg overflow-hidden">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : !purchases.length ? (
                            <div className="text-center py-12 text-muted-foreground">
                                Nenhuma compra encontrada.
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/50 dark:bg-neutral-800/50">
                                                <TableHead>Data Emissão</TableHead>
                                                <TableHead>Fornecedor</TableHead>
                                                <TableHead>Nº Nota</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {purchases.map((purchase) => (
                                                <TableRow key={purchase.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                                                    <TableCell>
                                                        {format(new Date(purchase.issue_date), 'dd/MM/yyyy')}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {purchase.supplier?.name || "Fornecedor Desconhecido"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {purchase.invoice_number}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${statusConfig[purchase.status]?.className || ""} shadow-none border`}>
                                                            {statusConfig[purchase.status]?.label || purchase.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-foreground">
                                                        {formatCurrency(purchase.total_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-white dark:bg-neutral-900">
                                    <div className="text-sm text-muted-foreground w-full sm:w-auto text-center sm:text-left">
                                        Mostrando {(currentPage - 1) * itemsPerPage + 1} até {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} registros
                                    </div>

                                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center sm:justify-end">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">Linhas por página:</span>
                                            <Select
                                                value={itemsPerPage.toString()}
                                                onValueChange={(val) => {
                                                    setItemsPerPage(Number(val));
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-[70px]">
                                                    <SelectValue placeholder={itemsPerPage.toString()} />
                                                </SelectTrigger>
                                                <SelectContent side="top">
                                                    {[10, 30, 50].map(size => (
                                                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <div className="text-sm font-medium w-24 text-center">
                                                Página {currentPage} de {Math.max(1, totalPages)}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage >= totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. Actions */}
                <PurchaseActions onNewPurchase={() => setCreateOpen(true)} />

                {/* Dialogs */}
                <CreatePurchaseDialog open={createOpen} onOpenChange={setCreateOpen} />
            </div>
        </MainLayout>
    );
}
