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
import { Separator } from "@/components/ui/separator";

export function PurchaseFilters() {
    return (
        <FilterSidebar title="Filtros de Compras" onFilter={() => { }} onClear={() => { }}>
            {/* Status */}
            <div className="space-y-2">
                <Label>Situação</Label>
                <Select defaultValue="all">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-2">
                <Label>Emissão</Label>
                <div className="flex flex-col gap-2">
                    <Input type="date" className="text-xs" />
                    <Input type="date" className="text-xs" />
                </div>
            </div>

            <Separator />

            {/* Supplier */}
            <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Input placeholder="Nome ou CNPJ" className="h-9" />
            </div>

            {/* Invoice */}
            <div className="space-y-2">
                <Label>Nº Nota Fiscal</Label>
                <Input placeholder="000.000" className="h-9" />
            </div>
        </FilterSidebar>
    );
}
