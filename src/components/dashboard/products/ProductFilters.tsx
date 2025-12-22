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
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFiltersProps {
    // Add props as needed for state management
}

export function ProductFilters({ }: ProductFiltersProps) {
    return (
        <FilterSidebar onFilter={() => console.log('apply filters')} onClear={() => console.log('clear')}>
            {/* Status Filter */}
            <div className="space-y-2">
                <Label>Situação</Label>
                <Select defaultValue="active">
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                        <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
                <Label>Categoria</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="electronics">Eletrônicos</SelectItem>
                        <SelectItem value="clothing">Roupas</SelectItem>
                        <SelectItem value="home">Casa & Decoração</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
                <Label>Preço</Label>
                <div className="flex items-center gap-2">
                    <Input placeholder="Min" type="number" className="h-8" />
                    <span className="text-muted-foreground">-</span>
                    <Input placeholder="Max" type="number" className="h-8" />
                </div>
            </div>

            {/* Stock Options */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="stock_positive" />
                    <Label htmlFor="stock_positive" className="font-normal">Com Estoque</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="stock_negative" />
                    <Label htmlFor="stock_negative" className="font-normal">Estoque Negativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="reserva" />
                    <Label htmlFor="reserva" className="font-normal">Com Reserva</Label>
                </div>
            </div>
        </FilterSidebar>
    );
}
