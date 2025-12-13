import { useState, useRef } from 'react';
import { useCart } from './hooks/useCart';
import { usePDVHotkeys } from './hooks/useHotkeys';
import { ProductSearch } from './components/ProductSearch';
import { ShoppingCart } from './components/ShoppingCart';
import { SaleShortcuts } from './components/SaleShortcuts';
import { PaymentModal } from './components/PaymentModal';
import { CashRegisterControl } from './components/CashRegisterControl';
import { useClients } from '@/hooks/useClients';

import { useCreateSale, useOpenCashRegister } from '@/hooks/usePDV';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Trash2, User, ShoppingBag, Terminal, ChevronDown, Percent, Truck, MoreVertical, LogOut, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/pdv';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function PDVFeature() {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [searchFocusTrigger, setSearchFocusTrigger] = useState(0);
    const [openClientCombo, setOpenClientCombo] = useState(false);
    const { toast } = useToast();

    // Hooks
    const cart = useCart();
    const { data: cashRegister } = useOpenCashRegister();
    const { data: clients } = useClients();
    const createSaleMutation = useCreateSale();

    // Hotkeys config
    usePDVHotkeys({
        onSearchFocus: () => setSearchFocusTrigger(prev => prev + 1),
        onPayment: () => {
            if (cart.items.length > 0) setIsPaymentOpen(true);
        },
        onDiscount: () => document.getElementById('discount-input')?.focus(),
        onDelivery: () => document.getElementById('delivery-input')?.focus(),
        onClient: () => setOpenClientCombo(true),
        onCancel: () => {
            if (confirm("Limpar carrinho?")) cart.clearCart();
        }
    });

    const handleFinalizeSale = (payments: any[]) => {
        if (!cashRegister) {
            toast({ title: "Erro: Caixa fechado!", variant: "destructive" });
            return;
        }

        createSaleMutation.mutate({
            items: cart.items.map(i => ({
                product_id: i.product_id,
                product_name: i.name,
                product_code: i.code,
                quantity: i.quantity,
                unit_price: i.unit_price,
                subtotal: i.subtotal,
                discount_value: i.discount_value || 0,
                discount_percent: i.discount_percent || 0
            })),
            payments,
            clientId: cart.clientId ? Number(cart.clientId) : undefined,
            discountValue: cart.discountValue,
            deliveryFee: cart.deliveryFee,
            cashRegisterId: cashRegister.id,
        }, {
            onSuccess: () => {
                cart.clearCart();
                setIsPaymentOpen(false);
                toast({
                    title: "Venda Finalizada! 🎉",
                    description: `Total: ${formatCurrency(cart.total())}`,
                    className: "bg-green-600 text-white border-none"
                });
            },
            onError: (error) => {
                toast({ title: "Erro ao finalizar venda", description: error.message, variant: "destructive" });
            }
        });
    };

    const isLoading = false;

    if (!cashRegister && !isLoading) {
        return <CashRegisterControl />;
    }

    return (
        <div className="h-screen flex flex-col bg-neutral-100 overflow-hidden font-sans">
            {/* Top Bar - Branding & Status */}
            <div className="bg-neutral-900 text-white px-6 py-3 flex justify-between items-center shadow-md z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <Terminal className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Frente de Caixa</h1>
                        <p className="text-xs text-neutral-400">Operador: {createSaleMutation.isPending ? '...' : 'Logado'}</p>
                    </div>
                    <Badge variant="outline" className="ml-4 border-green-500/50 text-green-400 bg-green-900/20">
                        Caixa #{cashRegister?.id} Aberto
                    </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full">
                        <User className="h-4 w-4 text-neutral-300" />
                        <span className="font-medium">{cart.clientName}</span>
                    </div>
                    <div className="text-neutral-400">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Zone: Cart & List */}
                <div className="flex-1 flex flex-col p-6 pr-3 gap-4 max-w-[65%] w-full">
                    {/* Header do Carrinho */}
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-neutral-700 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Itens da Venda
                        </h2>
                        <Badge variant="secondary" className="text-base px-3">
                            {cart.itemCount()} Itens
                        </Badge>
                    </div>

                    {/* Lista de Produtos (Carrinho Visual) */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col min-h-0 relative">
                        {cart.itemCount() === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 gap-4">
                                <ShoppingBag className="h-24 w-24 opacity-20" />
                                <p className="text-xl font-medium">Carrinho vazio</p>
                                <p className="text-sm">Bipe um produto para começar</p>
                            </div>
                        ) : (
                            <ShoppingCart />
                        )}

                        {/* Overlay Gradient for Scroll hint */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                    </div>
                </div>

                {/* Right Zone: Input & Pay */}
                <div className="w-[35%] bg-white border-l border-neutral-200 shadow-2xl flex flex-col h-full z-10 relative">

                    {/* 1. Área de Busca */}
                    <div className="p-6 pb-2 bg-neutral-50/50 space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                Produto (F2)
                            </Label>
                            <ProductSearch onFocus={() => { }} />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                Cliente (F4)
                            </Label>
                            <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openClientCombo}
                                        className="w-full justify-between h-12 text-base"
                                    >
                                        {cart.clientId
                                            ? clients?.find((client) => client.id === cart.clientId)?.name || cart.clientName
                                            : "Selecionar Cliente..."}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar cliente..." />
                                        <CommandList>
                                            <CommandEmpty>Cliente não encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="consumidor"
                                                    onSelect={() => {
                                                        cart.setClient(undefined, "Consumidor");
                                                        setOpenClientCombo(false);
                                                    }}
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    Consumidor Final
                                                </CommandItem>
                                                {clients?.map((client) => (
                                                    <CommandItem
                                                        key={client.id}
                                                        value={client.name}
                                                        onSelect={() => {
                                                            cart.setClient(client.id, client.name);
                                                            setOpenClientCombo(false);
                                                        }}
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        {client.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                    Desconto - R$ (F8)
                                </Label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="discount-input"
                                        type="number"
                                        className="pl-9 h-11"
                                        placeholder="0,00"
                                        min="0"
                                        step="0.01"
                                        value={cart.discountValue || ''}
                                        onChange={(e) => cart.setDiscountValue(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                    Entrega - R$ (F9)
                                </Label>
                                <div className="relative">
                                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="delivery-input"
                                        type="number"
                                        className="pl-9 h-11"
                                        placeholder="0,00"
                                        min="0"
                                        step="0.01"
                                        value={cart.deliveryFee || ''}
                                        onChange={(e) => cart.setDeliveryFee(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* 2. Resumo da Venda */}
                    <div className="flex-1 p-6 space-y-6 overflow-auto bg-neutral-50/30">
                        <div className="space-y-4 p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                            <div className="flex justify-between text-neutral-500 text-lg">
                                <span>Subtotal</span>
                                <span>{formatCurrency(cart.subtotal())}</span>
                            </div>

                            {cart.discountValue > 0 && (
                                <div className="flex justify-between text-red-600 font-medium animate-in fade-in slide-in-from-right-4">
                                    <span>Descontos</span>
                                    <span>-{formatCurrency(cart.discountValue)}</span>
                                </div>
                            )}

                            {cart.deliveryFee > 0 && (
                                <div className="flex justify-between text-blue-600 font-medium animate-in fade-in slide-in-from-right-4">
                                    <span>Entrega</span>
                                    <span>+{formatCurrency(cart.deliveryFee)}</span>
                                </div>
                            )}

                            <Separator className="bg-neutral-200 my-4" />

                            <div className="flex justify-between items-end">
                                <span className="text-neutral-600 font-bold text-xl">TOTAL</span>
                                <span className="text-5xl font-black text-primary tracking-tighter">
                                    {formatCurrency(cart.total())}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Ações Principais (Botões Gigantes) */}
                    <div className="p-6 bg-white border-t border-neutral-100 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <Button
                            size="lg"
                            className="w-full h-20 text-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between px-8"
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={cart.itemCount() === 0}
                        >
                            <span className="flex items-center gap-3">
                                <CreditCard className="h-8 w-8" />
                                Finalizar Venda
                            </span>
                            <span className="bg-white/20 px-3 py-1 rounded text-sm font-medium backdrop-blur-sm">
                                F5
                            </span>
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-12 border-neutral-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                onClick={() => cart.clearCart()}
                                disabled={cart.itemCount() === 0}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 border-neutral-200">
                                        <MoreVertical className="mr-2 h-4 w-4" />
                                        Outras Funções
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Operações de Caixa</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => toast({ title: "Sangria", description: "Funcionalidade será implementada no próximo passo." })}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sangria / Retirada</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast({ title: "Reforço", description: "Funcionalidade será implementada no próximo passo." })}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        <span>Reforço / Suprimento</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => toast({ title: "Fechar Caixa", description: "Use o painel 'Meu Caixa' para fechar." })}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Fechar Caixa</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Shortcuts */}
            <div className="bg-white border-t border-neutral-200 px-6 h-12 flex items-center justify-between text-xs text-neutral-400">
                <SaleShortcuts />
                <div>
                    ACR Commerce Suite v1.0 • Conectado
                </div>
            </div>

            <PaymentModal
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                total={cart.total()}
                onConfirm={handleFinalizeSale}
                isLoading={createSaleMutation.isPending}
            />
        </div>
    );
}
