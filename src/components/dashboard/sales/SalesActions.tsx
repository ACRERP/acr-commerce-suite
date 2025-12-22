import { ActionSidebar } from "@/components/common/ActionSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Printer, Mail } from "lucide-react";

interface SalesActionsProps {
    onNewQuote: () => void;
}

export function SalesActions({ onNewQuote }: SalesActionsProps) {
    return (
        <ActionSidebar>
            <Button
                onClick={onNewQuote}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-[1.02]"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                Nova Proposta
            </Button>

            <div className="h-px bg-border my-2" />

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
            </Button>

            <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Lista
            </Button>

            <div className="h-px bg-border my-2" />

            <h4 className="text-xs font-semibold text-muted-foreground mb-1 px-1">Comunicação</h4>

            <Button variant="ghost" className="w-full justify-start text-sm h-8 px-2">
                <Mail className="w-3 h-3 mr-2" />
                Email Marketing
            </Button>
        </ActionSidebar>
    );
}
