import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface FilterSidebarProps {
    children: ReactNode;
    onFilter?: () => void;
    onClear?: () => void;
    title?: string;
}

export function FilterSidebar({ children, onFilter, onClear, title = "Filtros" }: FilterSidebarProps) {
    return (
        <aside className="w-[250px] flex-shrink-0 bg-white dark:bg-neutral-900 border border-border shadow-sm rounded-lg flex flex-col h-[calc(100vh-8rem)] sticky top-24">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Filter className="w-4 h-4" />
                    <h3>{title}</h3>
                </div>
                {onClear && (
                    <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
                        Limpar
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {children}
                </div>
            </ScrollArea>

            {onFilter && (
                <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-neutral-900/50">
                    <Button className="w-full" onClick={onFilter}>
                        Filtrar Resultados
                    </Button>
                </div>
            )}
        </aside>
    );
}
