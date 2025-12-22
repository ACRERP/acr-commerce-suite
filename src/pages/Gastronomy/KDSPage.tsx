import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    ChefHat,
    Timer,
    ChevronRight,
    UtensilsCrossed
} from "lucide-react";
import { RestaurantOrder, gastronomyService } from "@/lib/gastronomy/table-service";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function KDSPage() {
    const [orders, setOrders] = useState<RestaurantOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await gastronomyService.getKDSOrders();
                setOrders(data);
            } catch (error) {
                console.error("Error fetching KDS orders", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
        // Setup polling or real-time subscription here
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Placeholder data for demonstration if empty
    const demoOrders: RestaurantOrder[] = [
        {
            id: 1,
            table_id: 5,
            status: 'preparing',
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            total_amount: 85.50,
            items: [
                { id: 101, product_id: 1, name: "Hambúrguer Gourmet", quantity: 2, price: 35.00, status: 'preparing', notes: "Sem cebola" },
                { id: 102, product_id: 2, name: "Batata Frita G", quantity: 1, price: 15.50, status: 'ready' }
            ]
        },
        {
            id: 2,
            table_id: 12,
            status: 'open',
            created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            total_amount: 42.00,
            items: [
                { id: 103, product_id: 3, name: "Pizza Calabresa M", quantity: 1, price: 42.00, status: 'pending' }
            ]
        }
    ];

    const displayOrders = orders.length > 0 ? orders : demoOrders;

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header KDS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 tracking-tight mb-2">
                            KDS - Cozinha
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-orange-500" />
                            Gerenciamento de pedidos em tempo real
                        </p>
                    </div>
                    <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                        <Badge variant="outline" className="bg-white dark:bg-neutral-900 px-4 py-2 border-none shadow-sm gap-2">
                            <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                            <span className="font-bold">{displayOrders.length} Pedidos Ativos</span>
                        </Badge>
                    </div>
                </div>

                {/* KDS Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayOrders.map(order => (
                        <Card key={order.id} className="border-none shadow-xl bg-white dark:bg-gray-900 flex flex-col h-[500px] overflow-hidden group">
                            <CardHeader className={`py-4 px-6 flex flex-row items-center justify-between ${order.status === 'preparing' ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-neutral-50 dark:bg-neutral-800'
                                }`}>
                                <div>
                                    <CardTitle className="text-lg font-black italic">MESA {order.table_id}</CardTitle>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                                    </div>
                                </div>
                                <Badge className={`${order.status === 'preparing' ? 'bg-orange-500' : 'bg-blue-500'
                                    } text-white border-none shadow-lg animate-pulse`}>
                                    {order.status === 'preparing' ? 'PREPARANDO' : 'PENDENTE'}
                                </Badge>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {order.items.map(item => (
                                        <li key={item.id} className={`p-4 space-y-1 transition-colors ${item.status === 'ready' ? 'bg-green-50/50 dark:bg-green-900/10 opacity-60' : ''
                                            }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-3">
                                                    <span className="font-black text-xl text-primary-600 dark:text-primary-400">{item.quantity}x</span>
                                                    <div className="space-y-0.5">
                                                        <p className={`font-bold text-base ${item.status === 'ready' ? 'line-through' : ''}`}>
                                                            {item.name}
                                                        </p>
                                                        {item.notes && (
                                                            <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md inline-block">
                                                                OBS: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.status === 'ready' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800">
                                <Button className="w-full btn-primary h-12 text-base font-black uppercase tracking-widest gap-2 shadow-lg group-hover:scale-[1.02] transition-transform">
                                    {order.items.every(i => i.status === 'ready') ? (
                                        <>Finalizar Pedido <ChevronRight className="w-5 h-5" /></>
                                    ) : (
                                        <>Pronto / Chamar Garçom <CheckCircle2 className="w-5 h-5" /></>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
