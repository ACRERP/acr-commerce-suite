import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Plus,
    LayoutGrid,
    Users,
    Clock,
    DollarSign,
    MoreHorizontal,
    Search,
    Map,
    Utensils
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, Room, gastronomyService, RestaurantOrder, OrderItem } from "@/lib/gastronomy/table-service";
import { useBusinessProfile } from "@/contexts/BusinessProfileContext";
import { searchProducts, Product } from "@/lib/products";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/features/pdv/hooks/useCart";
import { Loader2 } from "lucide-react";

export default function SalasMesas() {
    const navigate = useNavigate();
    const cart = useCart();
    const { toast } = useToast();
    const { activeProfile } = useBusinessProfile();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Order Modal States
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [activeTable, setActiveTable] = useState<Table | null>(null);
    const [currentOrder, setCurrentOrder] = useState<(RestaurantOrder & { items: OrderItem[] }) | null>(null);
    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedRooms = await gastronomyService.getRooms();
                setRooms(fetchedRooms);
                if (fetchedRooms.length > 0) {
                    setSelectedRoom(fetchedRooms[0].id);
                }
            } catch (error) {
                console.error("Error loading rooms", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (selectedRoom) {
            refreshTables();
        }
    }, [selectedRoom]);

    const refreshTables = async () => {
        const fetchedTables = await gastronomyService.getTables(selectedRoom || undefined);
        setTables(fetchedTables);
    };

    const handleTableClick = async (table: Table) => {
        setActiveTable(table);
        setIsOrderModalOpen(true);

        if (table.status === 'occupied' && table.current_order_id) {
            loadOrder(table.current_order_id);
        } else {
            setCurrentOrder(null);
        }
    };

    const loadOrder = async (orderId: number) => {
        try {
            const order = await gastronomyService.getOrderWithItems(orderId);
            setCurrentOrder(order);
        } catch (error) {
            console.error("Error loading order", error);
        }
    };

    const openTable = async () => {
        if (!activeTable) return;
        setIsPlacingOrder(true);
        try {
            const order = await gastronomyService.createOrder(activeTable.id);
            setCurrentOrder({ ...order, items: [] });
            refreshTables();
            toast({ title: "Mesa Aberta!", description: `Mesa ${activeTable.number} agora está ocupada.` });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível abrir a mesa.", variant: "destructive" });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    useEffect(() => {
        if (productSearch.length > 2) {
            const search = async () => {
                setIsSearching(true);
                const results = await searchProducts(productSearch);
                setSearchResults(results);
                setIsSearching(false);
            };
            const timer = setTimeout(search, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [productSearch]);

    const addItemToOrder = async (product: Product) => {
        if (!currentOrder) return;
        try {
            await gastronomyService.addOrderItem(currentOrder.id, {
                product_id: product.id,
                name: product.name,
                quantity: 1,
                price: product.sale_price
            });
            loadOrder(currentOrder.id);
            toast({ title: "Item Adicionado", description: `${product.name} enviado para a cozinha.` });
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao adicionar item." });
        }
    };

    const handleCloseTable = async () => {
        if (!currentOrder || !activeTable) return;

        try {
            // 1. Change table status to waiting_payment
            await gastronomyService.updateTableStatus(activeTable.id, 'waiting_payment');

            // 2. Map items to cart format
            const cartItems = currentOrder.items.map(item => ({
                product_id: item.product_id,
                name: item.name,
                code: '', // Not strictly needed for billing but part of interface
                unit_price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
                stock_quantity: 999 // Placeholder since it's already "sold" from kitchen perspective
            }));

            // 3. Load into cart and set context
            cart.loadFromTable(activeTable.id, currentOrder.id, cartItems);

            // 4. Redirect to PDV
            navigate('/pdv');

            toast({
                title: "Iniciando Checkout",
                description: `Mesa ${activeTable.number} enviada para o PDV.`
            });
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao fechar mesa.", variant: "destructive" });
        }
    };

    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-700 border-green-200';
            case 'occupied': return 'bg-red-100 text-red-700 border-red-200';
            case 'reserved': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cleaning': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'waiting_payment': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: Table['status']) => {
        switch (status) {
            case 'available': return 'Livre';
            case 'occupied': return 'Ocupada';
            case 'reserved': return 'Reservada';
            case 'cleaning': return 'Limpando';
            case 'waiting_payment': return 'Pagamento';
            default: return status;
        }
    };

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            Salas e Mesas
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Map className="w-5 h-5 text-primary-500" />
                            Mapa de ocupação em tempo real
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="btn-secondary gap-2 hover-lift">
                            <LayoutGrid className="w-4 h-4" />
                            Gerenciar Salas
                        </Button>
                        <Button className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20">
                            <Plus className="w-4 h-4" />
                            Nova Mesa
                        </Button>
                    </div>
                </div>

                {/* Rooms Tabs */}
                <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl w-fit">
                    {rooms.map(room => (
                        <Button
                            key={room.id}
                            variant={selectedRoom === room.id ? 'secondary' : 'ghost'}
                            className={`rounded-xl px-6 ${selectedRoom === room.id ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setSelectedRoom(room.id)}
                        >
                            {room.name}
                        </Button>
                    ))}
                    {rooms.length === 0 && (
                        <Button variant="ghost" className="rounded-xl px-6 opacity-50 italic">Nenhuma sala cadastrada</Button>
                    )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Disponível</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Ocupada</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Reservada</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Limpeza</div>
                </div>

                {/* Tables Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {tables.length === 0 && !isLoading ? (
                        <div className="col-span-full py-20 text-center text-neutral-400 italic bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                            Pressione "Nova Mesa" para começar a organizar sua sala.
                        </div>
                    ) : tables.map(table => (
                        <Card
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            className={`group relative overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${table.status === 'occupied' ? 'border-red-100 dark:border-red-900/30 shadow-red-500/10' :
                                table.status === 'available' ? 'border-green-100 dark:border-green-900/30' : 'border-neutral-100'
                                }`}
                        >
                            <CardContent className="p-6 text-center space-y-4">
                                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner ${table.status === 'occupied' ? 'bg-red-50 text-red-600' :
                                    table.status === 'available' ? 'bg-green-50 text-green-600' : 'bg-neutral-50 text-neutral-400'
                                    }`}>
                                    {table.number}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Mesa {table.number}</h3>
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                                        <Users className="w-3 h-3" />
                                        <span>Até {table.capacity} pessoas</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`capitalize py-1 px-3 border shadow-sm ${getStatusColor(table.status)}`}>
                                    {getStatusLabel(table.status)}
                                </Badge>

                                {table.status === 'occupied' && (
                                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-bold">
                                        <div className="flex items-center gap-1 text-primary-600">
                                            <DollarSign className="w-3 h-3" />
                                            R$ 145,90
                                        </div>
                                        <div className="flex items-center gap-1 text-neutral-400">
                                            <Clock className="w-3 h-3" />
                                            45m
                                        </div>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); /* Future: more options */ }}>
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* COMANDA / ORDER MODAL */}
            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl font-black flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Utensils className="w-6 h-6 text-primary-600" />
                                MESA {activeTable?.number}
                            </span>
                            {currentOrder && (
                                <Badge className="bg-primary-600 text-white animate-pulse">
                                    COMANDA #{currentOrder.id}
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {!currentOrder ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                <Users className="w-10 h-10" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">Mesa Disponível</h3>
                                <p className="text-neutral-500">Deseja abrir uma nova comanda para esta mesa?</p>
                            </div>
                            <Button className="btn-primary px-8 h-12 text-lg font-bold" onClick={openTable} disabled={isPlacingOrder}>
                                {isPlacingOrder && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Abrir Comanda
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Order Items List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Itens Lançados</h4>
                                    {currentOrder.items.length === 0 ? (
                                        <p className="text-sm text-neutral-400 italic py-4">Nenhum item lançado ainda.</p>
                                    ) : (
                                        <div className="divide-y divide-neutral-100">
                                            {currentOrder.items.map((item, idx) => (
                                                <div key={idx} className="py-2 flex justify-between items-center group">
                                                    <div className="flex gap-3">
                                                        <span className="font-bold text-primary-600">{item.quantity}x</span>
                                                        <span className="text-sm font-medium">{item.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-bold">
                                                            {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] h-4 uppercase">{item.status}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Product Search / Add Item */}
                            <div className="p-6 bg-neutral-50 border-t border-neutral-100 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <Input
                                        placeholder="Pesquisar produto ou código..."
                                        className="pl-10 h-12 bg-white"
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-500" />}
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="bg-white rounded-xl border border-neutral-200 shadow-xl max-h-48 overflow-y-auto mb-4">
                                        {searchResults.map(product => (
                                            <div
                                                key={product.id}
                                                className="p-3 hover:bg-neutral-50 cursor-pointer flex justify-between items-center transition-colors border-b last:border-0"
                                                onClick={() => {
                                                    addItemToOrder(product);
                                                    setProductSearch("");
                                                    setSearchResults([]);
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{product.name}</span>
                                                    <span className="text-[10px] text-neutral-400">SKU: {product.sku || product.code}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-primary-600">
                                                        {product.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                    <Plus className="w-4 h-4 text-primary-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Parcial</span>
                                        <span className="text-2xl font-black text-neutral-900">
                                            {currentOrder.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost">Imprimir</Button>
                                        <Button
                                            className="btn-primary px-8 font-bold"
                                            onClick={handleCloseTable}
                                        >
                                            Fechar Mesa
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
