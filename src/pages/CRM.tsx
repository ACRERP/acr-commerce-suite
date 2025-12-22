import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    Users,
    Target,
    TrendingUp,
    Phone,
    Mail,
    MessageSquare,
    Calendar,
    Star,
    UserPlus,
    Search,
    MoreVertical,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Briefcase,
    Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Lead status configuration
const leadStatuses = [
    { id: 'novo', label: 'Novo Lead', color: 'bg-blue-100 text-blue-700', icon: UserPlus, border: 'border-blue-200' },
    { id: 'contato', label: 'Em Contato', color: 'bg-yellow-100 text-yellow-700', icon: Phone, border: 'border-yellow-200' },
    { id: 'proposta', label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700', icon: Mail, border: 'border-indigo-200' },
    { id: 'negociacao', label: 'Negociação', color: 'bg-orange-100 text-orange-700', icon: MessageSquare, border: 'border-orange-200' },
    { id: 'convertido', label: 'Convertido', color: 'bg-green-100 text-green-700', icon: CheckCircle, border: 'border-green-200' },
    { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-700', icon: AlertCircle, border: 'border-red-200' },
];

// Customer segments
const customerSegments = [
    { id: 'vip', label: 'VIP', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', description: 'Compras acima de R$ 5.000', icon: Star },
    { id: 'recorrente', label: 'Recorrente', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', description: 'Compras mensais', icon: Zap },
    { id: 'inativo', label: 'Inativo', color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800', description: 'Sem compras há 90 dias', icon: Clock },
    { id: 'novo', label: 'Novo', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', description: 'Primeiro mês', icon: UserPlus },
];

const CRM = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("leads");
    const [showNewLead, setShowNewLead] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newLead, setNewLead] = useState({
        name: '',
        phone: '',
        email: '',
        source: 'site',
        notes: '',
        value: '',
        priority: 'medium',
        expected_close_date: ''
    });

    // --- QUERIES ---

    // 1. Fetch Client Metrics (View) - Otimizado
    const { data: clientsData, isLoading: loadingClients } = useQuery({
        queryKey: ['client_metrics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('v_client_metrics')
                .select('*')
                .order('last_purchase_date', { ascending: false });

            if (error) throw error;
            return data || [];
        }
    });

    // 2. Fetch Leads (Table) - Real persistence
    const { data: leadsData, isLoading: loadingLeads } = useQuery({
        queryKey: ['leads'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        }
    });

    // --- MUTATIONS ---

    const addLeadMutation = useMutation({
        mutationFn: async (leadData: any) => {
            const { error } = await supabase.from('leads').insert([{
                ...leadData,
                status: 'novo'
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            setShowNewLead(false);
            setNewLead({ name: '', phone: '', email: '', source: 'site', notes: '', value: '', priority: 'medium', expected_close_date: '' });
            toast({ title: 'Lead adicionado com sucesso!' });
        },
        onError: (error: any) => {
            toast({ title: 'Erro ao adicionar lead', description: error.message, variant: 'destructive' });
        }
    });

    const updateLeadStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase.from('leads').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast({ title: 'Status atualizado com sucesso' });
        },
        onError: (error: any) => {
            toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
        }
    });

    // --- COMPUTED ---

    // Segment counts
    const segmentCounts = {
        vip: clientsData?.filter(c => c.segment === 'vip').length || 0,
        recorrente: clientsData?.filter(c => c.segment === 'recorrente').length || 0,
        inativo: clientsData?.filter(c => c.segment === 'inativo').length || 0,
        novo: clientsData?.filter(c => c.segment === 'novo').length || 0,
    };

    // Lead status counts
    const leads = leadsData || [];
    const leadCounts = leadStatuses.reduce((acc, status) => {
        acc[status.id] = leads.filter(l => l.status === status.id).length;
        return acc;
    }, {} as Record<string, number>);

    // Filter leads
    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone && lead.phone.includes(searchTerm)) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filter clients
    const filteredClients = (clientsData || []).filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalLeads = leadsData?.length || 0;
    const convertedLeads = leadsData?.filter(l => l.status === 'convertido').length || 0;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    return (
        <MainLayout>
            <div className="container-premium py-8 space-y-8 animate-fade-in-up">
                {/* Header Premium */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
                            CRM & Vendas
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Gestão inteligente de relacionamento e oportunidades
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowNewLead(true)}
                        className="btn-primary hover-lift flex items-center gap-2 px-6 py-3 shadow-lg shadow-primary-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Lead
                    </Button>
                </div>

                {/* Stats Grid Premium */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Leads */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total de Leads</p>
                                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{leadsData?.length || 0}</h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-success-600 font-medium">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>+12% este mês</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 transition-transform duration-300 group-hover:scale-110">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    {/* Clientes Ativos */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Clientes Ativos</p>
                                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{clientsData?.length || 0}</h3>
                                <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{segmentCounts.novo} Novos</Badge>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                                <Target className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    {/* Em Negociação */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Em Negociação</p>
                                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{(leadCounts.contato || 0) + (leadCounts.proposta || 0) + (leadCounts.negociacao || 0)}</h3>
                                <p className="text-xs text-neutral-400 mt-2">Oportunidades ativas</p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 transition-transform duration-300 group-hover:scale-110">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    {/* Taxa de Conversão */}
                    <div className="card-premium hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-success-100 dark:bg-success-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Conversão</p>
                                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{conversionRate}%</h3>
                                <Badge className="mt-2 bg-success-100 text-success-700 hover:bg-success-200 border-0">Meta: 25%</Badge>
                            </div>
                            <div className="p-3 rounded-xl bg-success-100 text-success-600 dark:bg-success-900/30 transition-transform duration-300 group-hover:scale-110">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar Premium */}
                <div className="card-premium p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Buscar por nome, telefone ou email..."
                            className="input-premium pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabs Premium */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-2xl grid-cols-3 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                        <TabsTrigger value="leads" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                            <Target className="w-4 h-4 mr-2" />
                            Pipeline Leads ({leads.length})
                        </TabsTrigger>
                        <TabsTrigger value="segmentos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                            <Users className="w-4 h-4 mr-2" />
                            Carteira VIP
                        </TabsTrigger>
                        <TabsTrigger value="followup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">
                            <Calendar className="w-4 h-4 mr-2" />
                            Follow-up
                        </TabsTrigger>
                    </TabsList>

                    {/* Leads Tab - Kanban Style */}
                    <TabsContent value="leads" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                            {['novo', 'contato', 'proposta', 'negociacao'].map(statusId => {
                                const status = leadStatuses.find(s => s.id === statusId)!;
                                const StatusIcon = status.icon;
                                const statusLeads = filteredLeads.filter(l => l.status === statusId);

                                return (
                                    <div key={statusId} className="flex flex-col min-w-[280px]">
                                        <div className={`p-3 rounded-t-xl bg-white dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between sticky top-0 z-10`}>
                                            <div className="flex items-center gap-2 font-bold text-sm text-neutral-700 dark:text-neutral-300">
                                                <div className={`p-1.5 rounded-md ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                </div>
                                                {status.label}
                                            </div>
                                            <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 font-mono">{statusLeads.length}</Badge>
                                        </div>

                                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 rounded-b-xl border border-t-0 border-neutral-100 dark:border-neutral-800 p-2 min-h-[400px] flex flex-col gap-3">
                                            {statusLeads.map(lead => (
                                                <div key={lead.id} className="group bg-white dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">{lead.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                                                {lead.source && (
                                                                    <Badge variant="outline" className="h-4 px-1 text-[10px] uppercase tracking-wider">{lead.source}</Badge>
                                                                )}
                                                                <span className="truncate">{format(new Date(lead.created_at), 'dd/MM', { locale: ptBR })}</span>
                                                            </div>
                                                        </div>
                                                        <Select
                                                            value={lead.status}
                                                            onValueChange={(value) => updateLeadStatusMutation.mutate({ id: lead.id, status: value })}
                                                        >
                                                            <SelectTrigger className="w-6 h-6 p-0 border-none opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                                                                <MoreVertical className="w-4 h-4 text-neutral-400" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {leadStatuses.map(s => (
                                                                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {lead.phone && (
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                                                                <Phone className="w-3 h-3" />
                                                                {lead.phone}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm hover:shadow-green-200 transition-all"
                                                                title="Abrir WhatsApp"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(`https://wa.me/55${lead.phone!.replace(/\D/g, '')}`, '_blank');
                                                                }}
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {lead.notes && (
                                                        <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 italic border border-neutral-100 dark:border-neutral-800">
                                                            "{lead.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {statusLeads.length === 0 && (
                                                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 opacity-60">
                                                    <Briefcase className="w-8 h-8 mb-2 stroke-1" />
                                                    <span className="text-xs">Sem oportunidades</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Segmentation Tab */}
                    <TabsContent value="segmentos" className="mt-0 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {customerSegments.map(segment => {
                                const Icon = segment.icon;
                                return (
                                    <div key={segment.id} className="card-premium p-4 hover:border-primary-200 transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg ${segment.color} bg-opacity-10`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{segment.label}</span>
                                        </div>
                                        <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-1">
                                            {segmentCounts[segment.id as keyof typeof segmentCounts]}
                                        </p>
                                        <p className="text-xs text-neutral-500 font-medium">{segment.description}</p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="card-premium overflow-hidden">
                            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary-500" />
                                    Clientes por Segmento
                                </h3>
                                <Badge variant="outline">Top 50</Badge>
                            </div>
                            <div className="p-0">
                                <div className="space-y-1 p-2">
                                    {loadingClients ? <div className="p-8 text-center text-neutral-500">Carregando carteira de clientes...</div> : filteredClients.slice(0, 50).map(client => {
                                        const segment = customerSegments.find(s => s.id === client.segment);
                                        return (
                                            <div key={client.client_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${segment?.color || 'bg-neutral-100 text-neutral-600'}`}>
                                                        {client.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-neutral-900 dark:text-white">{client.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                            <Phone className="w-3 h-3" />
                                                            {client.phone || 'Sem telefone'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden md:block">
                                                        <p className="font-bold text-neutral-900 dark:text-white">
                                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.total_spent)}
                                                        </p>
                                                        <p className="text-xs text-neutral-500">{client.purchase_count} compras</p>
                                                    </div>
                                                    <Badge className={`${segment?.color} border-0 capitalize px-2 py-0.5 min-w-[80px] justify-center`}>
                                                        {segment?.label}
                                                    </Badge>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {client.phone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => window.open(`https://wa.me/55${client.phone!.replace(/\D/g, '')}`, '_blank')}
                                                            >
                                                                <MessageSquare className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Link to={`/clientes/${client.client_id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Eye className="w-4 h-4 text-neutral-500" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Follow-up Tab */}
                    <TabsContent value="followup" className="mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card-premium p-0 overflow-hidden border-l-4 border-l-danger-500">
                                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 bg-danger-50 dark:bg-danger-900/20">
                                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-danger-600 shadow-sm">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-danger-700 dark:text-danger-400">Risco de Churn</h3>
                                        <p className="text-xs text-danger-600/80">Clientes inativos há +90 dias</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {(clientsData || []).filter(c => c.segment === 'inativo').slice(0, 5).map(client => (
                                        <div key={client.client_id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow">
                                            <div>
                                                <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{client.name}</p>
                                                <p className="text-xs font-medium text-danger-500">
                                                    {client.days_since_last_purchase} dias sem comprar
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                                                    <Phone className="w-3 h-3" />
                                                    Ligar
                                                </Button>
                                                {client.phone && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white border-0"
                                                        onClick={() => window.open(`https://wa.me/55${client.phone!.replace(/\D/g, '')}`, '_blank')}
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {!loadingClients && (clientsData || []).filter(c => c.segment === 'inativo').length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success-500 opacity-50" />
                                            <p className="text-success-600 font-medium">Carteira 100% Ativa!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-premium p-0 overflow-hidden border-l-4 border-l-amber-400">
                                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20">
                                    <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-amber-500 shadow-sm">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-700 dark:text-amber-400">Oportunidades VIP</h3>
                                        <p className="text-xs text-amber-600/80">Clientes de alto valor</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {(clientsData || []).filter(c => c.segment === 'vip').slice(0, 5).map(client => (
                                        <div key={client.client_id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                                    <Star className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{client.name}</p>
                                                    <p className="text-xs text-neutral-500">
                                                        Total: <span className="text-amber-600 font-bold">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.total_spent)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {client.phone && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 text-white border-0"
                                                        onClick={() => window.open(`https://wa.me/55${client.phone!.replace(/\D/g, '')}`, '_blank')}
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Link to={`/clientes/${client.client_id}`}>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                        <Eye className="w-4 h-4 text-neutral-400" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                    {!loadingClients && (clientsData || []).filter(c => c.segment === 'vip').length === 0 && (
                                        <p className="text-center py-8 text-muted-foreground text-sm">
                                            Nenhum cliente atingiu o nível VIP ainda.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>

                {/* New Lead Modal Premium */}
                <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
                    <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl overflow-hidden p-0 gap-0 rounded-2xl">
                        <DialogHeader className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                            <DialogTitle className="flex items-center gap-3 text-2xl">
                                <div className="p-2 bg-white/20 rounded-lg backdro-blur-sm">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                Novo Lead
                            </DialogTitle>
                            <p className="text-primary-100 mt-1">Cadastre uma nova oportunidade no CRM</p>
                        </DialogHeader>

                        <div className="p-6 space-y-6 bg-white dark:bg-neutral-900">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Informações Principais</Label>
                                    <Input
                                        value={newLead.name}
                                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                        placeholder="Nome completo do lead"
                                        className="h-12 text-lg bg-neutral-50 border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Contato</Label>
                                        <div className="relative mt-1.5">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <Input
                                                value={newLead.phone}
                                                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                                placeholder="(00) 00000-0000"
                                                className="pl-9 bg-neutral-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Email</Label>
                                        <div className="relative mt-1.5">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <Input
                                                type="email"
                                                value={newLead.email}
                                                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                                placeholder="email@exemplo.com"
                                                className="pl-9 bg-neutral-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Detalhes do Negócio</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">Valor Estimado</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">R$</span>
                                            <Input
                                                type="number"
                                                value={newLead.value}
                                                onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                                                placeholder="0.00"
                                                className="pl-8 bg-neutral-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">Prioridade</Label>
                                        <Select value={newLead.priority} onValueChange={(v) => setNewLead({ ...newLead, priority: v })}>
                                            <SelectTrigger className="bg-neutral-50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Baixa</SelectItem>
                                                <SelectItem value="medium">Média</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">Fechamento</Label>
                                        <Input
                                            type="date"
                                            value={newLead.expected_close_date}
                                            onChange={(e) => setNewLead({ ...newLead, expected_close_date: e.target.value })}
                                            className="bg-neutral-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Outros Detalhes</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                                        <SelectTrigger className="h-10 bg-neutral-50">
                                            <SelectValue placeholder="Origem" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="site">Site</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="indicacao">Indicação</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="google">Google</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Textarea
                                    value={newLead.notes}
                                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                                    placeholder="Observações, interesses, produtos..."
                                    className="min-h-[100px] resize-none bg-neutral-50 mt-2"
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 gap-3">
                            <Button variant="outline" onClick={() => setShowNewLead(false)} className="h-11 px-6 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900">
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => addLeadMutation.mutate(newLead)}
                                disabled={!newLead.name || addLeadMutation.isPending}
                                className="h-11 px-8 btn-primary hover-lift shadow-lg shadow-primary-500/20"
                            >
                                {addLeadMutation.isPending ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Criar Lead
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
};

export default CRM;
