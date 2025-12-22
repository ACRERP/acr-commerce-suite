import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '@/lib/delivery/delivery-service';
import { useClients } from '@/hooks/useClients';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Truck, Search, User, MapPin, Check } from 'lucide-react';
import { toast } from 'sonner';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DeliveryFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function DeliveryForm({ open, onClose, onSuccess }: DeliveryFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openClientCombo, setOpenClientCombo] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            customer_name: '',
            customer_phone: '',
            address: '',
            total_amount: '',
            delivery_fee: '5.00',
            payment_method: 'dinheiro',
            observations: '',
            priority: 'normal' as 'normal' | 'urgent' | 'high',
            delivery_man_id: 'auto'
        }
    });

    const { data: clients } = useClients();

    const { data: deliverymen } = useQuery({
        queryKey: ['deliverymen_active'],
        queryFn: () => deliveryService.getDeliveryMen('active')
    });

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            await deliveryService.createDelivery({
                customer_name: data.customer_name,
                customer_phone: data.customer_phone,
                address: data.address,
                total_amount: parseFloat(data.total_amount),
                delivery_fee: parseFloat(data.delivery_fee),
                payment_method: data.payment_method,
                payment_status: 'pending',
                observations: data.observations,
                priority: data.priority,
                status: 'pending',
                delivery_man_id: data.delivery_man_id === 'auto' ? undefined : parseInt(data.delivery_man_id)
            });

            toast.success('Entrega criada com sucesso!');
            reset();
            setSelectedClient(null);
            onClose();
            onSuccess?.();
        } catch (error: any) {
            console.error('Erro ao criar entrega:', error);
            toast.error('Erro ao criar entrega: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectClient = (clientName: string) => {
        const client = clients?.find(c => c.name === clientName);
        if (client) {
            setSelectedClient(client);
            setValue('customer_name', client.name);
            setValue('customer_phone', client.phone || client.whatsapp || '');

            // Construct address
            const fullAddress = [
                client.address,
                client.address_number,
                client.neighborhood,
                client.city
            ].filter(Boolean).join(', ');

            setValue('address', fullAddress || client.address || '');
            setOpenClientCombo(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-neutral-800 to-neutral-900 text-white">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        Nova Solicitação de Entrega
                    </DialogTitle>
                    <DialogDescription className="text-neutral-300">
                        Preencha os dados da entrega ou selecione um cliente cadastrado.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-neutral-900 p-6 space-y-6">

                    {/* User Search */}
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Buscar Cliente Cadastrado</Label>
                        <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openClientCombo}
                                    className="w-full justify-between h-11 bg-white border-neutral-200"
                                >
                                    {selectedClient ? selectedClient.name : "Buscar cliente..."}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar por nome..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {clients?.map((client) => (
                                                <CommandItem
                                                    key={client.id}
                                                    value={client.name}
                                                    onSelect={handleSelectClient}
                                                >
                                                    <User className="mr-2 h-4 w-4 text-neutral-500" />
                                                    <div className="flex flex-col">
                                                        <span>{client.name}</span>
                                                        <span className="text-xs text-neutral-400">{client.phone}</span>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "ml-auto h-4 w-4",
                                                            selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coluna Esquerda: Dados do Cliente e Endereço */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
                                <User className="w-4 h-4 text-primary-500" />
                                Dados do Destinatário
                            </h4>

                            <div className="space-y-2">
                                <Label htmlFor="customer_name" className="text-xs font-bold uppercase text-neutral-500">Nome *</Label>
                                <Input id="customer_name" {...register('customer_name', { required: true })} className="h-10 bg-neutral-50" />
                                {errors.customer_name && <span className="text-xs text-red-500">Obrigatório</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customer_phone" className="text-xs font-bold uppercase text-neutral-500">Telefone *</Label>
                                <Input id="customer_phone" {...register('customer_phone', { required: true })} className="h-10 bg-neutral-50" />
                                {errors.customer_phone && <span className="text-xs text-red-500">Obrigatório</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs font-bold uppercase text-neutral-500">Endereço Completo *</Label>
                                <Textarea
                                    id="address"
                                    {...register('address', { required: true })}
                                    className="bg-neutral-50 min-h-[80px] resize-none"
                                    placeholder="Rua, Número, Bairro, Cidade..."
                                />
                                {errors.address && <span className="text-xs text-red-500">Obrigatório</span>}
                            </div>
                        </div>

                        {/* Coluna Direita: Detalhes da Entrega */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-neutral-900">
                                <MapPin className="w-4 h-4 text-primary-500" />
                                Detalhes do Pedido
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="total_amount" className="text-xs font-bold uppercase text-neutral-500">Valor Pedido *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">R$</span>
                                        <Input id="total_amount" type="number" step="0.01" {...register('total_amount', { required: true })} className="h-10 pl-8 bg-neutral-50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="delivery_fee" className="text-xs font-bold uppercase text-neutral-500">Taxa Entrega</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">R$</span>
                                        <Input id="delivery_fee" type="number" step="0.01" {...register('delivery_fee')} className="h-10 pl-8 bg-neutral-50" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="delivery_man" className="text-xs font-bold uppercase text-neutral-500">Entregador</Label>
                                    <Select onValueChange={(v) => setValue('delivery_man_id', v)} defaultValue="auto">
                                        <SelectTrigger className="h-10 bg-neutral-50">
                                            <SelectValue placeholder="Automático" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Automático / Pendente</SelectItem>
                                            {deliverymen?.map((dm: any) => (
                                                <SelectItem key={dm.id} value={dm.id.toString()}>{dm.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_method" className="text-xs font-bold uppercase text-neutral-500">Pagamento</Label>
                                    <Select onValueChange={(v) => setValue('payment_method', v)} defaultValue="dinheiro">
                                        <SelectTrigger className="h-10 bg-neutral-50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                            <SelectItem value="cartao">Cartão</SelectItem>
                                            <SelectItem value="pix">PIX</SelectItem>
                                            <SelectItem value="loja">Pago na Loja</SelectItem>
                                            <SelectItem value="online">Online</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority" className="text-xs font-bold uppercase text-neutral-500">Prioridade</Label>
                                <Select onValueChange={(v: any) => setValue('priority', v)} defaultValue="normal">
                                    <SelectTrigger className="h-10 bg-neutral-50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                        <SelectItem value="high">Alta Prioridade</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="observations" className="text-xs font-bold uppercase text-neutral-500">Observações</Label>
                                <Textarea
                                    id="observations"
                                    {...register('observations')}
                                    className="bg-neutral-50 resize-none h-[74px]"
                                    placeholder="Referência, troco para, etc..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-11 px-6 border-neutral-200"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="h-11 px-8 btn-primary hover-lift shadow-lg shadow-primary-500/20">
                            {isSubmitting ? 'Processando...' : (
                                <span className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Confirmar Entrega
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
