import { ActionSidebar } from "@/components/common/ActionSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Download } from "lucide-react";

interface PurchaseActionsProps {
    onNewPurchase: () => void;
}

export function PurchaseActions({ onNewPurchase }: PurchaseActionsProps) {
    return (
        <ActionSidebar title="Ações de Compra">
            <Button
                onClick={onNewPurchase}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.02]"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                Nova Compra
            </Button>

            <div className="h-px bg-border my-2" />

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <Download className="w-4 h-4 mr-2" />
                Relatório XML
            </Button>

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Espelho de Entrada
            </Button>
        </ActionSidebar>
    );
}
