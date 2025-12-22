import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceOrder } from "@/lib/os/os-service";
import { Wrench, Clock, CheckCircle, AlertCircle, TrendingUp, DollarSign } from "lucide-react";

interface OSStatsCardsProps {
    data: ServiceOrder[];
}

export function OSStatsCards({ data }: OSStatsCardsProps) {
    const total = data.length;
    const emAndamento = data.filter((os) => os.status === "em_andamento" || os.status === "aguardando_peca").length;
    const concluidas = data.filter((os) => os.status === "concluida" || os.status === "entregue").length;

    // Revenue Calculation (Only for concluded/delivered or approved)
    // Assuming valor_final acts as the final revenue
    const revenue = data
        .filter(os => ["concluida", "entregue"].includes(os.status))
        .reduce((acc, os) => acc + (os.valor_final || 0), 0);

    const ticketMedio = concluidas > 0 ? revenue / concluidas : 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de OSs</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{total}</div>
                    <p className="text-xs text-muted-foreground">Registradas no período</p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
                    <p className="text-xs text-muted-foreground">Sendo trabalhadas agora</p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Faturamento Estimado</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">OSs Concluídas/Entregues</p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
                    </div>
                    <p className="text-xs text-muted-foreground">Por serviço concluído</p>
                </CardContent>
            </Card>
        </div>
    );
}
