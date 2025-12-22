import { ActionSidebar } from "@/components/common/ActionSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download, RefreshCw, Printer, Tag } from "lucide-react";

interface ProductActionsProps {
    onNewProduct: () => void;
    onImport: () => void;
}

export function ProductActions({ onNewProduct, onImport }: ProductActionsProps) {
    return (
        <ActionSidebar>
            <Button
                onClick={onNewProduct}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:scale-[1.02]"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                Novo Produto
            </Button>

            <div className="h-px bg-border my-2" />

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={onImport}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
            </Button>

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <Download className="w-4 h-4 mr-2" />
                Exportar Lista
            </Button>

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Loja
            </Button>

            <div className="h-px bg-border my-2" />

            <h4 className="text-xs font-semibold text-muted-foreground mb-1 px-1">Ferramentas</h4>

            <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                <Printer className="w-3 h-3 mr-2" />
                Imprimir Etiquetas
            </Button>

            <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                <Tag className="w-3 h-3 mr-2" />
                Gerenciar Tags
            </Button>
        </ActionSidebar>
    );
}
