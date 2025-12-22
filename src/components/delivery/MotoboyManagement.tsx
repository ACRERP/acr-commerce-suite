import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService, DeliveryMan } from '@/lib/delivery/delivery-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Search,
    Bike,
    Edit2,
    UserX,
    CheckCircle2,
    TrendingUp,
    DollarSign,
    Phone,
    BadgeCheck,
    MoreHorizontal,
    PhoneCall
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MotoboyManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMotoboy, setEditingMotoboy] = useState<Partial<DeliveryMan> | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: motoboys = [], isLoading } = useQuery({
        queryKey: ['deliverymen-full'],
        queryFn: () => deliveryService.getDeliveryMen()
    });

    const { data: performance = [] } = useQuery({
        queryKey: ['delivery-performance'],
        queryFn: () => deliveryService.getDeliveryPerformanceToday()
    });

    const upsertMutation = useMutation({
        mutationFn: (data: Partial<DeliveryMan>) =>
            data.id
                ? deliveryService.updateDeliveryMan(data.id, data)
                : deliveryService.createDeliveryMan(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliverymen-full'] });
            queryClient.invalidateQueries({ queryKey: ['deliverymen'] });
            toast({ title: "Sucesso", description: "Entregador salvo com sucesso!" });
            setIsDialogOpen(false);
            setEditingMotoboy(null);
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao salvar entregador.", variant: "destructive" });
        }
    });

    const filteredMotoboys = motoboys.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm)
    );

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData);

        upsertMutation.mutate({
            ...editingMotoboy,
            name: data.name as string,
            phone: data.phone as string,
            vehicle: data.vehicle as string,
            plate: data.plate as string,
            contract_type: data.contract_type as any,
            commission_per_delivery: Number(data.commission_per_delivery),
            commission_percentage: Number(data.commission_percentage),
            status: data.status as any || 'active'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none text-white overflow-hidden relative group">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider flex items-center gap-2">
                            <Bike className="w-4 h-4" /> Frota Ativa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-4xl font-black">
                            {motoboys.filter(m => m.status === 'active').length}
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Bike className="w-24 h-24" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 border-none text-white overflow-hidden relative group">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Entregas Hoje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-4xl font-black">
                            {performance.reduce((acc, p) => acc + p.completed_deliveries, 0)}
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-none text-white overflow-hidden relative group">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Comissões Totais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-4xl font-black">
                            R$ {performance.reduce((acc, p) => acc + (p.total_commission_fixed || 0) + (p.total_commission_percentage || 0), 0).toFixed(2)}
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <DollarSign className="w-24 h-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Action Bar */}
            <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                        placeholder="Buscar entregador..."
                        className="pl-10 h-11 bg-neutral-50/50 border-none ring-1 ring-neutral-200 focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingMotoboy(null); }}>
                    <DialogTrigger asChild>
                        <Button className="btn-primary h-11 px-6 font-bold flex gap-2">
                            <Plus className="w-5 h-5" /> Adicionar Entregador
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <BadgeCheck className="w-6 h-6 text-primary" />
                                {editingMotoboy?.id ? 'Editar Entregador' : 'Novo Entregador'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Nome Completo</Label>
                                    <Input name="name" defaultValue={editingMotoboy?.name} required placeholder="Ex: João da Silva" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone / WhatsApp</Label>
                                    <Input name="phone" defaultValue={editingMotoboy?.phone} required placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select name="status" defaultValue={editingMotoboy?.status || 'active'}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                            <SelectItem value="busy">Ocupado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Veículo</Label>
                                    <Input name="vehicle" defaultValue={editingMotoboy?.vehicle} placeholder="Ex: CG 160 Start" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Placa</Label>
                                    <Input name="plate" defaultValue={editingMotoboy?.plate} placeholder="ABC-1234" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo de Contrato</Label>
                                    <Select name="contract_type" defaultValue={editingMotoboy?.contract_type || 'avulso'}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixo">Fixo (Mensal)</SelectItem>
                                            <SelectItem value="avulso">Avulso (Freelante)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Taxa Fixa (R$)</Label>
                                    <Input name="commission_per_delivery" type="number" step="0.01" defaultValue={editingMotoboy?.commission_per_delivery || 0} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full btn-primary h-12 text-lg font-bold" disabled={upsertMutation.isPending}>
                                {upsertMutation.isPending ? 'Salvando...' : 'Salvar Entregador'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-50/50">
                        <TableRow>
                            <TableHead className="w-[300px] font-bold">Entregador</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Contrato</TableHead>
                            <TableHead className="font-bold">Taxa Fixa</TableHead>
                            <TableHead className="font-bold text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredMotoboys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-neutral-400">
                                    Nenhum entregador encontrado.
                                </TableCell>
                            </TableRow>
                        ) : filteredMotoboys.map((motoboy) => (
                            <TableRow key={motoboy.id} className="group hover:bg-neutral-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl shadow-inner">
                                            {motoboy.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-neutral-900">{motoboy.name}</span>
                                            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {motoboy.phone}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`
                                        rounded-full px-3 py-1 font-bold border-none
                                        ${motoboy.status === 'active' ? 'bg-green-100 text-green-700' :
                                            motoboy.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'}
                                    `}>
                                        {motoboy.status === 'active' ? 'Disponível' :
                                            motoboy.status === 'busy' ? 'Em Rota' :
                                                'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-neutral-600">
                                    {motoboy.contract_type === 'fixo' ? 'Fixo' : 'Avulso'}
                                </TableCell>
                                <TableCell className="font-black text-neutral-900">
                                    R$ {motoboy.commission_per_delivery?.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={() => { setEditingMotoboy(motoboy); setIsDialogOpen(true); }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" asChild>
                                            <a href={`https://wa.me/${motoboy.phone?.replace(/\D/g, '')}`} target="_blank">
                                                <PhoneCall className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
