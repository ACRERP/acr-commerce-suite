import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryService, InventoryMovement } from "@/lib/inventory-service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ArrowUpRight, ArrowDownLeft, Settings2, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StockMovementsTabProps {
    productId?: string;
}

export const StockMovementsTab = ({ productId }: StockMovementsTabProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: movements, isLoading } = useQuery({
        queryKey: ["inventory-movements", productId],
        queryFn: () => productId
            ? inventoryService.getMovementsByProduct(productId)
            : inventoryService.getMovementsByProduct(""), // Get all if none specified (needs backend update)
        // For now, let's assume we fetch all movements if no productId
    });

    const filteredMovements = movements?.filter(m =>
        m.document_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'in':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 flex gap-1 w-fit"><ArrowUpRight className="w-3 h-3" /> Entrada</Badge>;
            case 'out':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 flex gap-1 w-fit"><ArrowDownLeft className="w-3 h-3" /> Saída</Badge>;
            case 'adjustment':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 flex gap-1 w-fit"><Settings2 className="w-3 h-3" /> Ajuste</Badge>;
            case 'production':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 flex gap-1 w-fit"><History className="w-3 h-3" /> Produção</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Buscar por documento ou motivo..."
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50 dark:bg-neutral-900/50">
                        <TableRow>
                            <TableHead className="w-[180px]">Data/Hora</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Ref/Doc</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead className="text-right">Valor Unit.</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Carregando histórico...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredMovements?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-neutral-500">
                                    Nenhuma movimentação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMovements?.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="text-xs font-medium">
                                        {m.created_at && format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        {getTypeBadge(m.type)}
                                    </TableCell>
                                    <TableCell className={`font-bold ${m.type === 'in' || m.type === 'production' ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.type === 'in' || m.type === 'production' ? '+' : '-'}{m.quantity}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{m.document_ref || '-'}</TableCell>
                                    <TableCell className="text-xs">{m.reason || '-'}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {m.price_unit ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.price_unit) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
