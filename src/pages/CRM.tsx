import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Filter,
    MoreVertical,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Edit,
    Trash2,
    ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Lead status configuration
const leadStatuses = [
    { id: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-700', icon: UserPlus },
    { id: 'contato', label: 'Em Contato', color: 'bg-yellow-100 text-yellow-700', icon: Phone },
    { id: 'proposta', label: 'Proposta Enviada', color: 'bg-purple-100 text-purple-700', icon: Mail },
    { id: 'negociacao', label: 'Negociação', color: 'bg-orange-100 text-orange-700', icon: MessageSquare },
    { id: 'convertido', label: 'Convertido', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-700', icon: AlertCircle },
];

// Customer segments
const customerSegments = [
    { id: 'vip', label: 'VIP', color: 'bg-yellow-500', description: 'Compras acima de R$ 5.000' },
    { id: 'recorrente', label: 'Recorrente', color: 'bg-green-500', description: 'Compras mensais' },
    { id: 'inativo', label: 'Inativo', color: 'bg-gray-500', description: 'Sem compras há 90 dias' },
    { id: 'novo', label: 'Novo', color: 'bg-blue-500', description: 'Primeiro mês' },
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
    });

    // Fetch clients for segmentation
    const { data: clients } = useQuery({
        queryKey: ['crm_clients'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });
            return data || [];
        }
    });

    // Fetch sales for RFM analysis
    const { data: salesData } = useQuery({
        queryKey: ['crm_sales'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales')
                .select('client_id, total, created_at')
                .not('client_id', 'is', null);
            return data || [];
        }
    });

    // Calculate client stats
    const clientStats = clients?.reduce((acc, client) => {
        const clientSales = salesData?.filter(s => s.client_id === client.id) || [];
        const totalPurchases = clientSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const lastPurchase = clientSales.length > 0
            ? new Date(Math.max(...clientSales.map(s => new Date(s.created_at).getTime())))
            : null;
        const daysSinceLastPurchase = lastPurchase ? differenceInDays(new Date(), lastPurchase) : 999;

        let segment = 'novo';
        if (totalPurchases >= 5000) segment = 'vip';
        else if (clientSales.length >= 3 && daysSinceLastPurchase < 60) segment = 'recorrente';
        else if (daysSinceLastPurchase > 90) segment = 'inativo';

        acc.push({
            ...client,
            totalPurchases,
            purchaseCount: clientSales.length,
            lastPurchase,
            daysSinceLastPurchase,
            segment,
        });
        return acc;
    }, [] as any[]) || [];

    // Segment counts
    const segmentCounts = {
        vip: clientStats.filter(c => c.segment === 'vip').length,
        recorrente: clientStats.filter(c => c.segment === 'recorrente').length,
        inativo: clientStats.filter(c => c.segment === 'inativo').length,
        novo: clientStats.filter(c => c.segment === 'novo').length,
    };

    // Mock leads data (would come from a leads table in production)
    const [leads, setLeads] = useState([
        { id: 1, name: 'João Silva', phone: '(11) 99999-1234', email: 'joao@email.com', status: 'novo', source: 'site', createdAt: new Date(), notes: 'Interessado em celulares' },
        { id: 2, name: 'Maria Santos', phone: '(11) 98888-5678', email: 'maria@email.com', status: 'contato', source: 'whatsapp', createdAt: new Date(Date.now() - 86400000), notes: 'Orçamento de conserto' },
        { id: 3, name: 'Pedro Lima', phone: '(11) 97777-9012', email: 'pedro@email.com', status: 'proposta', source: 'indicacao', createdAt: new Date(Date.now() - 172800000), notes: 'Empresa de TI' },
    ]);

    // Lead status counts
    const leadCounts = leadStatuses.reduce((acc, status) => {
        acc[status.id] = leads.filter(l => l.status === status.id).length;
        return acc;
    }, {} as Record<string, number>);

    // Add new lead
    const handleAddLead = () => {
        const lead = {
            id: leads.length + 1,
            ...newLead,
            status: 'novo',
            createdAt: new Date(),
        };
        setLeads([lead, ...leads]);
        setNewLead({ name: '', phone: '', email: '', source: 'site', notes: '' });
        setShowNewLead(false);
        toast({ title: 'Lead adicionado com sucesso!' });
    };

    // Update lead status
    const updateLeadStatus = (leadId: number, newStatus: string) => {
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        toast({ title: 'Status atualizado!' });
    };

    // Filter leads
    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter clients
    const filteredClients = clientStats.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="page-header">CRM - Relacionamento</h1>
                        <p className="text-muted-foreground mt-1">
                            Gestão de leads, clientes e oportunidades
                        </p>
                    </div>
                    <Button className="gap-2" onClick={() => setShowNewLead(true)}>
                        <Plus className="w-4 h-4" />
                        Novo Lead
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Leads</p>
                                    <p className="text-2xl font-bold">{leads.length}</p>
                                    <p className="text-xs text-green-600">+{leadCounts.novo || 0} novos</p>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-100">
                                    <Target className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Clientes</p>
                                    <p className="text-2xl font-bold">{clients?.length || 0}</p>
                                    <p className="text-xs text-muted-foreground">{segmentCounts.vip} VIPs</p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-100">
                                    <Users className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Em Negociação</p>
                                    <p className="text-2xl font-bold">{(leadCounts.contato || 0) + (leadCounts.proposta || 0) + (leadCounts.negociacao || 0)}</p>
                                    <p className="text-xs text-orange-600">Oportunidades ativas</p>
                                </div>
                                <div className="p-2 rounded-lg bg-orange-100">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Clientes Inativos</p>
                                    <p className="text-2xl font-bold text-red-600">{segmentCounts.inativo}</p>
                                    <p className="text-xs text-muted-foreground">Sem compras 90+ dias</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-100">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por nome, telefone ou email..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="leads" className="gap-2">
                            <Target className="w-4 h-4" />
                            Leads ({leads.length})
                        </TabsTrigger>
                        <TabsTrigger value="segmentos" className="gap-2">
                            <Users className="w-4 h-4" />
                            Segmentação
                        </TabsTrigger>
                        <TabsTrigger value="followup" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            Follow-up
                        </TabsTrigger>
                    </TabsList>

                    {/* Leads Tab */}
                    <TabsContent value="leads">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Leads Pipeline */}
                            {['novo', 'contato', 'proposta', 'negociacao'].map(statusId => {
                                const status = leadStatuses.find(s => s.id === statusId)!;
                                const StatusIcon = status.icon;
                                const statusLeads = filteredLeads.filter(l => l.status === statusId);

                                return (
                                    <Card key={statusId} className="h-fit">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <StatusIcon className="w-4 h-4" />
                                                {status.label}
                                                <Badge variant="secondary" className="ml-auto">{statusLeads.length}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {statusLeads.map(lead => (
                                                <div key={lead.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-medium text-sm">{lead.name}</p>
                                                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                                        </div>
                                                        <Select
                                                            value={lead.status}
                                                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                                                        >
                                                            <SelectTrigger className="w-8 h-8 p-0 border-0">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {leadStatuses.map(s => (
                                                                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {lead.notes && (
                                                        <p className="text-xs text-muted-foreground mt-2 italic">"{lead.notes}"</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {lead.source}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(lead.createdAt), 'dd/MM', { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {statusLeads.length === 0 && (
                                                <p className="text-center text-sm text-muted-foreground py-4">
                                                    Nenhum lead
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Segmentation Tab */}
                    <TabsContent value="segmentos">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                            {customerSegments.map(segment => (
                                <Card key={segment.id} className={`border-l-4`} style={{ borderLeftColor: segment.color.replace('bg-', '') }}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${segment.color}`} />
                                            <span className="font-medium">{segment.label}</span>
                                        </div>
                                        <p className="text-2xl font-bold">{segmentCounts[segment.id as keyof typeof segmentCounts]}</p>
                                        <p className="text-xs text-muted-foreground">{segment.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Clientes por Segmento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {filteredClients.slice(0, 15).map(client => (
                                        <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${customerSegments.find(s => s.id === client.segment)?.color || 'bg-gray-200'
                                                    } text-white`}>
                                                    {client.segment === 'vip' ? <Star className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{client.name}</p>
                                                    <p className="text-sm text-muted-foreground">{client.phone || 'Sem telefone'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold">
                                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.totalPurchases)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{client.purchaseCount} compras</p>
                                                </div>
                                                <Badge className={customerSegments.find(s => s.id === client.segment)?.color + ' text-white'}>
                                                    {customerSegments.find(s => s.id === client.segment)?.label}
                                                </Badge>
                                                <Link to={`/clientes/${client.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Follow-up Tab */}
                    <TabsContent value="followup">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                        Clientes Inativos (Reativar)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {clientStats.filter(c => c.segment === 'inativo').slice(0, 8).map(client => (
                                            <div key={client.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{client.name}</p>
                                                    <p className="text-sm text-red-600">
                                                        {client.daysSinceLastPurchase} dias sem comprar
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        Ligar
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        WhatsApp
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {clientStats.filter(c => c.segment === 'inativo').length === 0 && (
                                            <p className="text-center py-8 text-muted-foreground">
                                                🎉 Todos os clientes estão ativos!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500" />
                                        Clientes VIP (Fidelização)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {clientStats.filter(c => c.segment === 'vip').slice(0, 8).map(client => (
                                            <div key={client.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Star className="w-5 h-5 text-yellow-500" />
                                                    <div>
                                                        <p className="font-medium">{client.name}</p>
                                                        <p className="text-sm text-yellow-700">
                                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.totalPurchases)} em compras
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link to={`/clientes/${client.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        Ver Cliente
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                        {clientStats.filter(c => c.segment === 'vip').length === 0 && (
                                            <p className="text-center py-8 text-muted-foreground">
                                                Nenhum cliente VIP ainda
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* New Lead Modal */}
                <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                Novo Lead
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Nome *</Label>
                                <Input
                                    value={newLead.name}
                                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                    placeholder="Nome do lead"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Telefone</Label>
                                    <Input
                                        value={newLead.phone}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={newLead.email}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Origem</Label>
                                <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
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
                            <div>
                                <Label>Observações</Label>
                                <Textarea
                                    value={newLead.notes}
                                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                                    placeholder="Interesse, produtos mencionados..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowNewLead(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAddLead} disabled={!newLead.name}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Lead
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
};

export default CRM;
