import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useCart, useOpenCashRegister, useCreateSale, useOpenCash } from '@/hooks/usePDV';
import { useProducts } from '@/hooks/useProducts';
import { useClients } from '@/hooks/useClients';
import { formatCurrency, PAYMENT_METHODS, SalePayment, CartItem } from '@/lib/pdv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    ShoppingCart,
    User,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    X,
    CheckCircle,
    AlertCircle,
    Truck,
    Clock,
    Pause,
    Play,
    Percent,
    MapPin,
    Phone,
    UserCheck,
} from 'lucide-react';

export function PDVPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [showOpenCash, setShowOpenCash] = useState(false);
    const [showDelivery, setShowDelivery] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [showClient, setShowClient] = useState(false);
    const [showSuspended, setShowSuspended] = useState(false);
    const [openingBalance, setOpeningBalance] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
    const [clientSearch, setClientSearch] = useState('');
    const [clientOpen, setClientOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Hooks
    const { data: cashRegister, isLoading: loadingCash } = useOpenCashRegister();
    const { data: products = [] } = useProducts();
    const { data: clients = [] } = useClients();
    const openCashMutation = useOpenCash();
    const createSaleMutation = useCreateSale();

    const cart = useCart();

    // Delivery state
    const [deliveryAddress, setDeliveryAddress] = useState({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        reference: '',
        phone: '',
    });
    const [deliveryFeeInput, setDeliveryFeeInput] = useState('');

    // Suspended sales query
    const { data: suspendedSales = [] } = useQuery({
        queryKey: ['suspended-sales'],
        queryFn: async () => {
            const { data } = await supabase
                .from('sales')
                .select('*, sale_items(*)')
                .eq('status', 'suspended')
                .order('created_at', { ascending: false });
            return data || [];
        },
    });

    // Suspend sale mutation
    const suspendSaleMutation = useMutation({
        mutationFn: async (reason: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !cashRegister) throw new Error('Usuário ou caixa não encontrado');

            // Create suspended sale
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    cash_register_id: cashRegister.id,
                    client_id: cart.clientId,
                    operator_id: user.id,
                    subtotal: cart.subtotal,
                    discount_value: cart.discountValue,
                    total: cart.total,
                    status: 'suspended',
                    sale_type: cart.deliveryFee > 0 ? 'delivery' : 'counter',
                    delivery_fee: cart.deliveryFee,
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // Add items
            const items = cart.items.map(item => ({
                sale_id: sale.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
            }));

            await supabase.from('sale_items').insert(items);

            // Add to suspended_sales
            await supabase.from('suspended_sales').insert({
                sale_id: sale.id,
                suspended_by: user.id,
                reason,
            });

            return sale;
        },
        onSuccess: () => {
            toast({ title: 'Venda suspensa com sucesso!' });
            cart.clearCart();
            queryClient.invalidateQueries({ queryKey: ['suspended-sales'] });
        },
    });

    // Resume sale mutation
    const resumeSaleMutation = useMutation({
        mutationFn: async (saleId: number) => {
            const { data: sale } = await supabase
                .from('sales')
                .select('*, sale_items(*)')
                .eq('id', saleId)
                .single();

            if (!sale) throw new Error('Venda não encontrada');

            // Delete suspended sale record
            await supabase.from('suspended_sales').delete().eq('sale_id', saleId);

            // Delete the sale (we'll recreate in cart)
            await supabase.from('sales').delete().eq('id', saleId);

            return sale;
        },
        onSuccess: (sale) => {
            // Add items to cart
            cart.clearCart();
            sale.sale_items?.forEach((item: any) => {
                for (let i = 0; i < item.quantity; i++) {
                    cart.addItem({
                        id: item.product_id,
                        name: item.product_name,
                        code: item.product_code,
                        sale_price: item.unit_price,
                        stock_quantity: 999,
                    });
                }
            });
            if (sale.discount_value) {
                cart.setDiscount(sale.discount_value);
            }
            if (sale.delivery_fee) {
                cart.setDeliveryFee(sale.delivery_fee);
            }
            toast({ title: 'Venda retomada!' });
            setShowSuspended(false);
            queryClient.invalidateQueries({ queryKey: ['suspended-sales'] });
        },
    });

    // Filter products by search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8);

    // Filter clients
    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone?.includes(clientSearch) ||
        c.cpf_cnpj?.includes(clientSearch)
    ).slice(0, 5);

    // Focus search on mount and after adding item
    useEffect(() => {
        searchInputRef.current?.focus();
    }, [cart.items.length]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                setShowClient(true);
            }
            if (e.key === 'F4') {
                e.preventDefault();
                if (cart.items.length > 0) setShowDiscount(true);
            }
            if (e.key === 'F5') {
                e.preventDefault();
                if (cart.items.length > 0) setShowPayment(true);
            }
            if (e.key === 'F6') {
                e.preventDefault();
                if (cart.items.length > 0) setShowDelivery(true);
            }
            if (e.key === 'F7') {
                e.preventDefault();
                setShowSuspended(true);
            }
            if (e.key === 'F8') {
                e.preventDefault();
                if (cart.items.length > 0) {
                    const reason = prompt('Motivo da suspensão:');
                    if (reason) suspendSaleMutation.mutate(reason);
                }
            }
            if (e.key === 'Escape') {
                setShowPayment(false);
                setShowDelivery(false);
                setShowDiscount(false);
                setShowClient(false);
                setSearchTerm('');
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.items.length]);

    // Auto-add product if barcode matches exactly
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        const exactMatch = products.find(p =>
            p.barcode === value || p.code === value
        );
        if (exactMatch) {
            cart.addItem({
                id: exactMatch.id,
                name: exactMatch.name,
                code: exactMatch.code,
                barcode: exactMatch.barcode,
                sale_price: exactMatch.sale_price,
                stock_quantity: exactMatch.stock_quantity,
            });
            setSearchTerm('');
            searchInputRef.current?.focus();
        }
    };

    const handleProductClick = (product: typeof products[0]) => {
        cart.addItem({
            id: product.id,
            name: product.name,
            code: product.code,
            barcode: product.barcode,
            sale_price: product.sale_price,
            stock_quantity: product.stock_quantity,
        });
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const handleOpenCash = () => {
        const balance = parseFloat(openingBalance) || 0;
        openCashMutation.mutate({ openingBalance: balance }, {
            onSuccess: () => {
                setShowOpenCash(false);
                setOpeningBalance('');
            }
        });
    };

    const handleApplyDiscount = () => {
        const value = parseFloat(discountValue) || 0;
        if (discountType === 'percent') {
            cart.setDiscount((cart.subtotal * value) / 100);
        } else {
            cart.setDiscount(value);
        }
        setShowDiscount(false);
        setDiscountValue('');
    };

    const handleApplyDelivery = () => {
        const fee = parseFloat(deliveryFeeInput) || 0;
        cart.setDeliveryFee(fee);
        setShowDelivery(false);
        toast({ title: 'Delivery configurado!' });
    };

    const handleSelectClient = (client: typeof clients[0]) => {
        cart.setClient(client.id, client.name);
        setShowClient(false);
        setClientSearch('');
        toast({ title: `Cliente: ${client.name}` });
    };

    // Check if cash register is open
    if (!loadingCash && !cashRegister) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            Caixa Fechado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600">
                            Para começar a vender, você precisa abrir o caixa primeiro.
                        </p>
                        <Button onClick={() => setShowOpenCash(true)} className="w-full">
                            Abrir Caixa
                        </Button>
                    </CardContent>
                </Card>

                <Dialog open={showOpenCash} onOpenChange={setShowOpenCash}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Abrir Caixa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Valor Inicial em Dinheiro</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowOpenCash(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleOpenCash} disabled={openCashMutation.isPending}>
                                Abrir Caixa
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Top Bar */}
            <div className="h-14 bg-primary text-white flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center gap-4">
                    <ShoppingCart className="h-6 w-6" />
                    <span className="font-bold text-lg">PDV - Frente de Caixa</span>
                    {suspendedSales.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="bg-yellow-500/30 text-yellow-100 cursor-pointer"
                            onClick={() => setShowSuspended(true)}
                        >
                            <Pause className="h-3 w-3 mr-1" />
                            {suspendedSales.length} suspensa(s)
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary" className="bg-white/20">
                        Operador: {cashRegister?.operator_name}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-500/30 text-green-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Caixa #{cashRegister?.id} Aberto
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Products */}
                <div className="flex-1 p-4 flex flex-col gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            ref={searchInputRef}
                            placeholder="🔍 Buscar produto por código, nome ou código de barras..."
                            className="pl-10 h-12 text-lg bg-white"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Product Results */}
                    {searchTerm && (
                        <Card className="flex-1 overflow-auto">
                            <CardContent className="p-2">
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhum produto encontrado
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredProducts.map((product) => (
                                            <button
                                                key={product.id}
                                                onClick={() => handleProductClick(product)}
                                                className="p-3 border rounded-lg text-left hover:bg-primary/5 hover:border-primary transition-colors"
                                            >
                                                <div className="font-medium truncate">{product.name}</div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {product.code || product.barcode}
                                                    </span>
                                                    <span className="font-bold text-primary">
                                                        {formatCurrency(product.sale_price)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Estoque: {product.stock_quantity || 0}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Cart Items */}
                    {!searchTerm && (
                        <Card className="flex-1 overflow-auto">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Itens da Venda ({cart.itemCount})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {cart.items.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Nenhum item adicionado</p>
                                        <p className="text-sm">Busque um produto para começar</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.items.map((item) => (
                                            <div
                                                key={item.product_id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{item.product_name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(item.unit_price)} × {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-24 text-right font-bold text-primary">
                                                        {formatCurrency(item.subtotal)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700"
                                                        onClick={() => cart.removeItem(item.product_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Side - Totals */}
                <div className="w-80 bg-white border-l flex flex-col">
                    {/* Client */}
                    <div
                        className="p-4 border-b cursor-pointer hover:bg-gray-50"
                        onClick={() => setShowClient(true)}
                    >
                        <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{cart.clientName}</span>
                            {cart.clientId && <UserCheck className="h-4 w-4 text-green-500" />}
                        </div>
                    </div>

                    {/* Delivery indicator */}
                    {cart.deliveryFee > 0 && (
                        <div className="px-4 py-2 bg-blue-50 border-b">
                            <div className="flex items-center gap-2 text-blue-600 text-sm">
                                <Truck className="h-4 w-4" />
                                <span>Delivery - {formatCurrency(cart.deliveryFee)}</span>
                            </div>
                        </div>
                    )}

                    {/* Totals */}
                    <div className="flex-1 p-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(cart.subtotal)}</span>
                            </div>
                            {cart.discountValue > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Desconto</span>
                                    <span>-{formatCurrency(cart.discountValue)}</span>
                                </div>
                            )}
                            {cart.deliveryFee > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Frete</span>
                                    <span>{formatCurrency(cart.deliveryFee)}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="flex justify-between text-2xl font-bold">
                            <span>TOTAL</span>
                            <span className="text-primary">{formatCurrency(cart.total)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 space-y-2 border-t">
                        <Button
                            className="w-full h-14 text-lg"
                            disabled={cart.items.length === 0}
                            onClick={() => setShowPayment(true)}
                        >
                            <CreditCard className="mr-2 h-5 w-5" />
                            PAGAMENTO (F5)
                        </Button>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant="outline"
                                disabled={cart.items.length === 0}
                                onClick={() => setShowDelivery(true)}
                            >
                                <Truck className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                disabled={cart.items.length === 0}
                                onClick={() => setShowDiscount(true)}
                            >
                                <Percent className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                disabled={cart.items.length === 0}
                                onClick={() => {
                                    const reason = prompt('Motivo da suspensão:');
                                    if (reason) suspendSaleMutation.mutate(reason);
                                }}
                            >
                                <Pause className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            disabled={cart.items.length === 0}
                            onClick={cart.clearCart}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar Venda
                        </Button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                open={showPayment}
                onOpenChange={setShowPayment}
                total={cart.total}
                onConfirm={(payments) => {
                    createSaleMutation.mutate({
                        items: cart.items,
                        payments,
                        clientId: cart.clientId,
                        discountValue: cart.discountValue,
                        deliveryFee: cart.deliveryFee,
                        cashRegisterId: cashRegister?.id,
                    }, {
                        onSuccess: () => {
                            cart.clearCart();
                            setShowPayment(false);
                            toast({ title: 'Venda finalizada com sucesso!' });
                        }
                    });
                }}
                isLoading={createSaleMutation.isPending}
            />

            {/* Delivery Modal */}
            <Dialog open={showDelivery} onOpenChange={setShowDelivery}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Configurar Delivery
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Rua</label>
                                <Input
                                    value={deliveryAddress.street}
                                    onChange={(e) => setDeliveryAddress(p => ({ ...p, street: e.target.value }))}
                                    placeholder="Nome da rua"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Número</label>
                                <Input
                                    value={deliveryAddress.number}
                                    onChange={(e) => setDeliveryAddress(p => ({ ...p, number: e.target.value }))}
                                    placeholder="Nº"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-sm font-medium">Complemento</label>
                                <Input
                                    value={deliveryAddress.complement}
                                    onChange={(e) => setDeliveryAddress(p => ({ ...p, complement: e.target.value }))}
                                    placeholder="Apto, Bloco..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Bairro</label>
                                <Input
                                    value={deliveryAddress.neighborhood}
                                    onChange={(e) => setDeliveryAddress(p => ({ ...p, neighborhood: e.target.value }))}
                                    placeholder="Bairro"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Referência</label>
                            <Input
                                value={deliveryAddress.reference}
                                onChange={(e) => setDeliveryAddress(p => ({ ...p, reference: e.target.value }))}
                                placeholder="Próximo a..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-sm font-medium">Telefone</label>
                                <Input
                                    value={deliveryAddress.phone}
                                    onChange={(e) => setDeliveryAddress(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="(99) 99999-9999"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Taxa de Entrega</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={deliveryFeeInput}
                                    onChange={(e) => setDeliveryFeeInput(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelivery(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyDelivery}>
                            <Truck className="h-4 w-4 mr-2" />
                            Aplicar Delivery
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discount Modal */}
            <Dialog open={showDiscount} onOpenChange={setShowDiscount}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Percent className="h-5 w-5" />
                            Aplicar Desconto
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Button
                                variant={discountType === 'value' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setDiscountType('value')}
                            >
                                R$ Valor
                            </Button>
                            <Button
                                variant={discountType === 'percent' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => setDiscountType('percent')}
                            >
                                % Percentual
                            </Button>
                        </div>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder={discountType === 'value' ? '0.00' : '0%'}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            autoFocus
                        />
                        {discountValue && (
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                <span className="text-green-700 font-medium">
                                    Desconto: {formatCurrency(
                                        discountType === 'percent'
                                            ? (cart.subtotal * parseFloat(discountValue)) / 100
                                            : parseFloat(discountValue)
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDiscount(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleApplyDiscount}>
                            Aplicar Desconto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Client Modal */}
            <Dialog open={showClient} onOpenChange={setShowClient}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Selecionar Cliente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="Buscar cliente por nome, telefone ou CPF..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="max-h-60 overflow-auto space-y-2">
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    Nenhum cliente encontrado
                                </div>
                            ) : (
                                filteredClients.map((client) => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleSelectClient(client)}
                                        className="w-full p-3 border rounded-lg text-left hover:bg-primary/5 hover:border-primary transition-colors"
                                    >
                                        <div className="font-medium">{client.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {client.phone && <span className="mr-4"><Phone className="h-3 w-3 inline mr-1" />{client.phone}</span>}
                                            {client.cpf_cnpj && <span>{client.cpf_cnpj}</span>}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                cart.setClient(undefined, 'Cliente não identificado');
                                setShowClient(false);
                            }}
                        >
                            Consumidor Final
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspended Sales Modal */}
            <Dialog open={showSuspended} onOpenChange={setShowSuspended}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pause className="h-5 w-5" />
                            Vendas Suspensas
                        </DialogTitle>
                        <DialogDescription>
                            Selecione uma venda para retomar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-80 overflow-auto py-4">
                        {suspendedSales.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma venda suspensa
                            </div>
                        ) : (
                            suspendedSales.map((sale: any) => (
                                <button
                                    key={sale.id}
                                    onClick={() => resumeSaleMutation.mutate(sale.id)}
                                    className="w-full p-4 border rounded-lg text-left hover:bg-primary/5 hover:border-primary transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">Venda #{sale.id}</div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(sale.created_at).toLocaleString('pt-BR')}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {sale.sale_items?.length || 0} itens
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">
                                                {formatCurrency(sale.total)}
                                            </div>
                                            <Badge variant="outline" className="mt-1">
                                                <Play className="h-3 w-3 mr-1" />
                                                Retomar
                                            </Badge>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Footer shortcuts */}
            <div className="h-8 bg-gray-800 text-white/70 flex items-center justify-center gap-6 text-xs">
                <span>F2: Cliente</span>
                <span>F4: Desconto</span>
                <span>F5: Pagamento</span>
                <span>F6: Delivery</span>
                <span>F7: Suspensas</span>
                <span>F8: Suspender</span>
                <span>ESC: Limpar</span>
            </div>
        </div>
    );
}

// Payment Modal Component
function PaymentModal({
    open,
    onOpenChange,
    total,
    onConfirm,
    isLoading,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    onConfirm: (payments: SalePayment[]) => void;
    isLoading: boolean;
}) {
    const [selectedMethod, setSelectedMethod] = useState<string>('dinheiro');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [payments, setPayments] = useState<SalePayment[]>([]);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - totalPaid;
    const change = selectedMethod === 'dinheiro'
        ? Math.max(0, (parseFloat(receivedAmount) || 0) - remaining)
        : 0;

    const handleAddPayment = () => {
        const amount = selectedMethod === 'dinheiro'
            ? Math.min(parseFloat(receivedAmount) || 0, remaining + change)
            : remaining;

        if (amount <= 0) return;

        setPayments(prev => [...prev, {
            payment_method: selectedMethod as SalePayment['payment_method'],
            amount: Math.min(amount, remaining),
            received_amount: selectedMethod === 'dinheiro' ? parseFloat(receivedAmount) : undefined,
            change_amount: change,
        }]);
        setReceivedAmount('');
    };

    const handleConfirm = () => {
        if (payments.length === 0) {
            onConfirm([{
                payment_method: selectedMethod as SalePayment['payment_method'],
                amount: total,
                received_amount: selectedMethod === 'dinheiro' ? parseFloat(receivedAmount) : undefined,
                change_amount: change,
            }]);
        } else if (totalPaid >= total) {
            onConfirm(payments);
        }
    };

    useEffect(() => {
        if (!open) {
            setPayments([]);
            setReceivedAmount('');
            setSelectedMethod('dinheiro');
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Pagamento
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-sm text-gray-500">Total a Pagar</div>
                        <div className="text-3xl font-bold text-primary">{formatCurrency(total)}</div>
                        {payments.length > 0 && (
                            <div className="text-sm text-green-600 mt-1">
                                Pago: {formatCurrency(totalPaid)} | Restante: {formatCurrency(remaining)}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(PAYMENT_METHODS).map(([key, { label, icon }]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedMethod(key)}
                                className={`p-3 border rounded-lg text-center transition-colors ${selectedMethod === key
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="text-xl">{icon}</div>
                                <div className="text-xs mt-1">{label}</div>
                            </button>
                        ))}
                    </div>

                    {selectedMethod === 'dinheiro' && (
                        <div>
                            <label className="text-sm font-medium">Valor Recebido</label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={receivedAmount}
                                onChange={(e) => setReceivedAmount(e.target.value)}
                                className="text-lg h-12"
                                autoFocus
                            />
                            {parseFloat(receivedAmount) > 0 && (
                                <div className="mt-2 p-3 bg-green-50 rounded-lg text-center">
                                    <span className="text-green-700 font-medium">
                                        Troco: {formatCurrency(change)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {payments.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Pagamentos Adicionados:</div>
                            {payments.map((p, i) => (
                                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>{PAYMENT_METHODS[p.payment_method].icon} {PAYMENT_METHODS[p.payment_method].label}</span>
                                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    {remaining > 0 && payments.length > 0 && (
                        <Button variant="secondary" onClick={handleAddPayment}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    )}
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || (payments.length > 0 && totalPaid < total)}
                        className="min-w-[120px]"
                    >
                        {isLoading ? 'Processando...' : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Finalizar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
