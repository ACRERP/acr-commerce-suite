import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    User,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    MoreVertical
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointments, useCreateAppointment, useDeleteAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { searchClients, Client as ClientData } from "@/lib/clients";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useBusinessProfile } from "@/contexts/BusinessProfileContext";

export function AgendaPage() {
    const { toast } = useToast();
    const { activeProfile } = useBusinessProfile();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('day');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [clientSearchResults, setClientSearchResults] = useState<ClientData[]>([]);
    const [isSearchingClient, setIsSearchingClient] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    // Date Range for Query
    const startDate = date ? startOfDay(date).toISOString() : startOfDay(new Date()).toISOString();
    const endDate = date ? endOfDay(date).toISOString() : endOfDay(new Date()).toISOString();

    const { data: appointments = [], isLoading } = useAppointments(startDate, endDate);
    const createMutation = useCreateAppointment();

    const [newApt, setNewApt] = useState({
        client_name: "",
        service: "",
        time: "09:00",
        duration: "60",
        notes: ""
    });

    const handleCreate = async () => {
        if (!date || !selectedClientId) {
            toast({ title: "Erro", description: "Selecione um cliente para agendar.", variant: "destructive" });
            return;
        }

        const [hours, minutes] = newApt.time.split(':').map(Number);
        const start = new Date(date);
        start.setHours(hours, minutes, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + Number(newApt.duration));

        await createMutation.mutateAsync({
            client_id: selectedClientId,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status: 'scheduled',
            notes: newApt.notes,
            service_id: newApt.service // Using service name for now
        });

        setIsAddModalOpen(false);
        setNewApt({ client_name: "", service: "", time: "09:00", duration: "60", notes: "" });
        setSelectedClientId(null);
        setClientSearch("");
    };

    // Client Search Logic
    useEffect(() => {
        const fetch = async () => {
            if (clientSearch.length > 2) {
                setIsSearchingClient(true);
                try {
                    const results = await searchClients(clientSearch);
                    setClientSearchResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingClient(false);
                }
            } else {
                setClientSearchResults([]);
            }
        };
        const timer = setTimeout(fetch, 300);
        return () => clearTimeout(timer);
    }, [clientSearch]);

    return (
        <MainLayout>
            <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">
                {/* Header Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            Agenda Inteligente
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary-500" />
                            Gerencie seus horários e otimize sua produtividade
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                            <Button
                                variant={view === 'day' ? 'secondary' : 'ghost'}
                                onClick={() => setView('day')}
                                className="rounded-lg h-9 px-4"
                            >
                                Dia
                            </Button>
                            <Button
                                variant={view === 'week' ? 'secondary' : 'ghost'}
                                onClick={() => setView('week')}
                                className="rounded-lg h-9 px-4"
                            >
                                Semana
                            </Button>
                        </div>
                        <Button
                            className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Novo Agendamento
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Lateral: Mini Calendário e Filtros */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
                            <CardContent className="p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    locale={ptBR}
                                    className="p-4"
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white dark:bg-gray-900">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-400">Profissionais</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                                    <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-xs ring-4 ring-primary-50">
                                        AC
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">Alisson Cruz</p>
                                        <p className="text-xs text-neutral-500">
                                            {activeProfile?.systemCategory === 'health' ? 'Médico / Especialista' :
                                                activeProfile?.systemCategory === 'food' ? 'Responsável' :
                                                    activeProfile?.id === 'education' ? 'Professor / Tutor' :
                                                        'Profissional'}
                                        </p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Principal: Timeline da Agenda */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-none shadow-xl bg-white dark:bg-gray-900">
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "--"}
                                    </h2>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <Search className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <CardContent className="p-6">
                                <div className="space-y-4 relative">
                                    <div className="absolute left-16 top-0 bottom-0 w-px bg-neutral-100 dark:bg-neutral-800"></div>

                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                            Carregando horários...
                                        </div>
                                    ) : appointments.length === 0 ? (
                                        <div className="text-center py-12 text-neutral-400 italic">
                                            Nenhum agendamento para este dia.
                                        </div>
                                    ) : (
                                        appointments.map((apt) => (
                                            <div key={apt.id} className="flex gap-6 group">
                                                <div className="w-16 pt-2 text-right">
                                                    <span className="text-sm font-bold text-neutral-400 group-hover:text-primary-500 transition-colors">
                                                        {format(new Date(apt.start_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-bold text-neutral-900 dark:text-neutral-100">{apt.clients?.name || 'Cliente'}</h4>
                                                                    <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'} className="text-[10px] h-4 capitalize">
                                                                        {apt.status === 'scheduled' ? 'Agendado' : apt.status}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-neutral-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {apt.service_id || 'Serviço'}
                                                                    </span>
                                                                    {apt.notes && (
                                                                        <span className="truncate max-w-[200px]">
                                                                            {apt.notes}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <div className="flex gap-6 py-2 opacity-30">
                                        <div className="w-16 text-right">
                                            <span className="text-sm font-bold text-neutral-400">12:00</span>
                                        </div>
                                        <div className="flex-1 border-t border-dashed border-neutral-200 dark:border-neutral-700 mt-2.5"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Plus className="w-6 h-6 text-primary-500" />
                            Novo Agendamento
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2 relative">
                                <Label>Cliente</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <Input
                                        placeholder="Buscar cliente por nome ou celular..."
                                        className="pl-10 bg-neutral-50"
                                        value={clientSearch}
                                        onChange={e => {
                                            setClientSearch(e.target.value);
                                            if (selectedClientId) setSelectedClientId(null);
                                        }}
                                    />
                                    {isSearchingClient && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-500" />}
                                </div>
                                {clientSearchResults.length > 0 && !selectedClientId && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                        {clientSearchResults.map(client => (
                                            <div
                                                key={client.id}
                                                className="p-3 hover:bg-primary-50 dark:hover:bg-primary-950/20 cursor-pointer flex flex-col transition-colors border-b last:border-0"
                                                onClick={() => {
                                                    setSelectedClientId(client.id);
                                                    setClientSearch(client.name);
                                                    setClientSearchResults([]);
                                                }}
                                            >
                                                <span className="font-bold text-sm">{client.name}</span>
                                                <span className="text-xs text-neutral-500">{client.phone || 'Sem telefone'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Input
                                    type="time"
                                    className="bg-neutral-50"
                                    value={newApt.time}
                                    onChange={e => setNewApt({ ...newApt, time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Duração (min)</Label>
                                <Select
                                    value={newApt.duration}
                                    onValueChange={v => setNewApt({ ...newApt, duration: v })}
                                >
                                    <SelectTrigger className="bg-neutral-50">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 min</SelectItem>
                                        <SelectItem value="60">1 hora</SelectItem>
                                        <SelectItem value="90">1:30 hora</SelectItem>
                                        <SelectItem value="120">2 horas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Serviço</Label>
                                <Input
                                    placeholder="Ex: Corte de Cabelo"
                                    className="bg-neutral-50"
                                    value={newApt.service}
                                    onChange={e => setNewApt({ ...newApt, service: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>Observações</Label>
                                <Textarea
                                    placeholder="Detalhes adicionais..."
                                    className="bg-neutral-50 min-h-[80px]"
                                    value={newApt.notes}
                                    onChange={e => setNewApt({ ...newApt, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                        <Button
                            className="btn-primary"
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirmar Agendamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
