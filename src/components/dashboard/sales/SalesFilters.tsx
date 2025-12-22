import { FilterSidebar } from "@/components/common/FilterSidebar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function SalesFilters() {
    return (
        <FilterSidebar title="Filtros de Vendas" onFilter={() => { }} onClear={() => { }}>
            {/* Status Filter */}
            <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="all">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="sent">Enviado</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
                <Label>Período</Label>
                <div className="flex flex-col gap-2">
                    <Input type="date" className="h-9" />
                    <Input type="date" className="h-9" />
                </div>
            </div>

            {/* Client Search Placeholder */}
            <div className="space-y-2">
                <Label>Cliente</Label>
                <Input placeholder="Nome do cliente..." className="h-9" />
            </div>
        </FilterSidebar>
    );
}
