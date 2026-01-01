
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Plus, Filter } from "lucide-react";
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
import { supplierService } from "@/lib/purchases/supplier-service";
import { CreateSupplierDialog } from "@/components/purchases/CreateSupplierDialog";
import { format } from "date-fns";

export function FornecedoresPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data: suppliersData, isLoading } = useQuery({
        queryKey: ['suppliers', { page: currentPage, limit: itemsPerPage, search: searchTerm }],
        queryFn: () => supplierService.getSuppliers({ page: currentPage, limit: itemsPerPage, search: searchTerm }),
        placeholderData: (previousData) => previousData,
    });

    const suppliers = suppliersData?.data || [];
    const totalCount = suppliersData?.count || 0;
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <MainLayout>
            <div className="flex flex-col h-full bg-slate-50 dark:bg-neutral-950">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-neutral-900 border-b border-border shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Fornecedores</h1>
                        <p className="text-muted-foreground mt-1">Gerencie seus fornecedores para compras</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            className="bg-brand-primary hover:bg-brand-primary/90 text-brand-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 text-base px-6 py-5 rounded-xl font-semibold"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Novo Fornecedor
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-hidden flex flex-col gap-6">
                    {/* Filters */}
                    <div className="flex gap-4 items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-border shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar fornecedor..."
                                className="pl-10 h-11 bg-slate-50 dark:bg-neutral-800 border-transparent focus:bg-white focus:border-brand-primary transition-all"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <Button variant="outline" className="h-11 border-dashed gap-2 text-muted-foreground hover:text-foreground">
                            <Filter className="w-4 h-4" />
                            Filtros
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 bg-white dark:bg-neutral-900 border border-border shadow-sm rounded-xl overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto">
                            {isLoading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                                </div>
                            ) : !suppliers.length ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Nenhum fornecedor encontrado</h3>
                                    <p className="text-muted-foreground max-w-sm mt-2">
                                        Não encontramos registros com os filtros atuais. Tente buscar outro termo ou cadastre um novo fornecedor.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-slate-50/50 dark:bg-neutral-800/50">
                                            <TableHead className="w-[30%]">Razão Social / Fantasia</TableHead>
                                            <TableHead>CNPJ / CPF</TableHead>
                                            <TableHead>Contato</TableHead>
                                            <TableHead>Cidade/UF</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suppliers.map((supplier) => (
                                            <TableRow key={supplier.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{supplier.name}</span>
                                                        {supplier.trade_name && (
                                                            <span className="text-xs text-muted-foreground">{supplier.trade_name}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{supplier.cnpj_cpf || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        {supplier.email && <span>{supplier.email}</span>}
                                                        {(supplier.phone || supplier.whatsapp) && (
                                                            <span className="text-muted-foreground">{supplier.whatsapp || supplier.phone}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {supplier.city && (
                                                        <span>{supplier.city} / {supplier.state}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={supplier.active ? "default" : "secondary"} className={supplier.active ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}>
                                                        {supplier.active ? "Ativo" : "Inativo"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {/* Pagination */}
                        {suppliers.length > 0 && (
                            <div className="flex items-center justify-between p-4 border-t border-border bg-slate-50/30 dark:bg-neutral-900">
                                <span className="text-sm text-muted-foreground">
                                    {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
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
                        )}
                    </div>
                </div>

                <CreateSupplierDialog open={createOpen} onOpenChange={setCreateOpen} />
            </div>
        </MainLayout>
    );
}
