import { AlertCircle } from "lucide-react";
import { StockAlert } from "@/lib/dashboard/dashboard-service";
import { Button } from "@/components/ui/button";

interface LowStockAlertProps {
    alerts: StockAlert[];
}

export function LowStockAlert({ alerts }: LowStockAlertProps) {
    if (alerts.length === 0) return null;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-full shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-neutral-900">Atenção: Produtos com Estoque Baixo</h4>
                    <p className="text-sm text-neutral-500 max-w-2xl">
                        {alerts.length} produtos estão abaixo do estoque mínimo e precisam de reposição urgente.
                        {alerts.length > 0 && (
                            <span className="font-medium text-neutral-700"> (Ex: {alerts[0].name})</span>
                        )}
                    </p>
                </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                Ver Produtos
            </Button>
        </div>
    );
}
