import { useQuery } from '@tanstack/react-query';
import { osService } from '@/lib/os/os-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Explicit import
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    User,
    Smartphone,
    Package,
    Wrench,
    DollarSign,
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle,
    Printer, // Added
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { printOS } from '@/lib/os/os-print';

interface OSDetailsModalProps {
    osId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OSDetailsModal({ osId, open, onOpenChange }: OSDetailsModalProps) {
    const { data: os, isLoading } = useQuery({
        queryKey: ['os-details', osId],
        queryFn: () => osService.getOSById(osId!),
        enabled: !!osId,
    });

    const { data: services } = useQuery({
        queryKey: ['os-services', osId],
        queryFn: () => osService.getServices(osId!),
        enabled: !!osId,
    });

    const { data: parts } = useQuery({
        queryKey: ['os-parts', osId],
        queryFn: () => osService.getParts(osId!),
        enabled: !!osId,
    });

    const { data: accessories } = useQuery({
        queryKey: ['os-accessories', osId],
        queryFn: () => osService.getAccessories(osId!),
        enabled: !!osId,
    });

    if (!os) return null;

    const statusColors = {
        'aberta': 'bg-neutral-100 text-neutral-700',
        'em_andamento': 'bg-blue-100 text-blue-700',
        'aguardando_peca': 'bg-yellow-100 text-yellow-700',
        'concluida': 'bg-green-100 text-green-700',
        'entregue': 'bg-purple-100 text-purple-700',
        'cancelada': 'bg-red-100 text-red-700',
    };

    const priorityColors = {
        'baixa': 'bg-neutral-100 text-neutral-600',
        'media': 'bg-blue-50 text-blue-700',
        'alta': 'bg-orange-100 text-orange-700',
        'urgente': 'bg-red-100 text-red-700',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wrench className="w-6 h-6 text-primary-500" />
                            <span>Ordem de Serviço #{os.numero}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Actions */}
                            <div className="flex items-center gap-1 mr-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const message = `Olá ${os.clients?.name || ''}, referente à sua OS #${os.numero} (${os.device_brand} ${os.device_model})...`;
                                        const phone = os.clients?.phone?.replace(/\D/g, '') || '';
                                        if (phone) window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                        else toast.error('Cliente sem telefone cadastrado');
                                    }}
                                    title="Enviar WhatsApp"
                                >
                                    <Smartphone className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => printOS(os, services || [], parts || [])}
                                    title="Imprimir OS"
                                >
                                    <Printer className="w-4 h-4 text-neutral-600" />
                                </Button>
                            </div>

                            <Badge className={statusColors[os.status as keyof typeof statusColors]}>
                                {os.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge className={priorityColors[os.prioridade as keyof typeof priorityColors]}>
                                {os.prioridade?.toUpperCase()}
                            </Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="geral" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="geral">Geral</TabsTrigger>
                        <TabsTrigger value="servicos">Serviços & Peças</TabsTrigger>
                        <TabsTrigger value="acessorios">Acessórios</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>

                    {/* Tab Geral */}
                    <TabsContent value="geral" className="space-y-6">
                        {/* Cliente */}
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-sm text-neutral-700 mb-3">
                                <User className="w-4 h-4" />
                                Cliente
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-neutral-500">Nome:</span>
                                    <p className="font-medium">{os.clients?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Telefone:</span>
                                    <p className="font-medium">{os.clients?.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Equipamento */}
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-sm text-neutral-700 mb-3">
                                <Smartphone className="w-4 h-4" />
                                Equipamento
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-neutral-500">Tipo:</span>
                                    <p className="font-medium">{os.device_type}</p>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Marca:</span>
                                    <p className="font-medium">{os.device_brand || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Modelo:</span>
                                    <p className="font-medium">{os.device_model || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Série/IMEI:</span>
                                    <p className="font-medium font-mono text-xs">{os.serial_number || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Problema */}
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-sm text-neutral-700 mb-2">
                                <AlertCircle className="w-4 h-4" />
                                Defeito Relatado
                            </h3>
                            <p className="text-sm bg-neutral-50 p-3 rounded-lg border italic">
                                "{os.reported_issue}"
                            </p>
                        </div>

                        {os.diagnostico && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-bold text-sm text-neutral-700 mb-2">Diagnóstico Técnico</h3>
                                    <p className="text-sm bg-blue-50 p-3 rounded-lg border">
                                        {os.diagnostico}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Checklist */}
                        <Separator />
                        <div>
                            <h3 className="font-bold text-sm text-neutral-700 mb-2">Checklist de Entrada</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    {os.power_on ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    )}
                                    <span>Equipamento {os.power_on ? 'liga' : 'não liga'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {os.has_password ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-neutral-400" />
                                    )}
                                    <span>{os.has_password ? 'Possui senha' : 'Sem senha'}</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab Serviços & Peças */}
                    <TabsContent value="servicos" className="space-y-6">
                        {/* Serviços */}
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-sm text-neutral-700 mb-3">
                                <Wrench className="w-4 h-4" />
                                Serviços
                            </h3>
                            {services && services.length > 0 ? (
                                <div className="space-y-2">
                                    {services.map((service: any) => (
                                        <div key={service.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{service.descricao}</p>
                                                <p className="text-xs text-neutral-500">Qtd: {service.quantidade}</p>
                                            </div>
                                            <span className="font-mono font-bold text-green-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.valor_total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-400 text-center py-4">Nenhum serviço cadastrado</p>
                            )}
                        </div>

                        <Separator />

                        {/* Peças */}
                        <div>
                            <h3 className="flex items-center gap-2 font-bold text-sm text-neutral-700 mb-3">
                                <Package className="w-4 h-4" />
                                Peças
                            </h3>
                            {parts && parts.length > 0 ? (
                                <div className="space-y-2">
                                    {parts.map((part: any) => (
                                        <div key={part.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{part.descricao}</p>
                                                <p className="text-xs text-neutral-500">Qtd: {part.quantidade}</p>
                                            </div>
                                            <span className="font-mono font-bold text-green-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(part.valor_total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-400 text-center py-4">Nenhuma peça cadastrada</p>
                            )}
                        </div>

                        <Separator />

                        {/* Resumo Financeiro */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Serviços:</span>
                                    <span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_servicos || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Peças:</span>
                                    <span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_pecas || 0)}</span>
                                </div>
                                {os.desconto && os.desconto > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Desconto:</span>
                                        <span className="font-mono">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.desconto)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-bold text-green-700">
                                    <span>TOTAL:</span>
                                    <span className="font-mono">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.valor_final || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab Acessórios */}
                    <TabsContent value="acessorios" className="space-y-4">
                        {accessories && accessories.length > 0 ? (
                            accessories.map((acc: any) => (
                                <div key={acc.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{acc.descricao}</p>
                                        <p className="text-xs text-neutral-500">Quantidade: {acc.quantidade}</p>
                                    </div>
                                    <Badge variant={acc.devolvido ? "default" : "secondary"}>
                                        {acc.devolvido ? 'Devolvido' : 'Pendente'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-neutral-400 text-center py-8">Nenhum acessório registrado</p>
                        )}
                    </TabsContent>

                    {/* Tab Timeline */}
                    <TabsContent value="timeline" className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-neutral-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">OS Criada</p>
                                    <p className="text-xs text-neutral-500">
                                        {os.created_at && format(new Date(os.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </p>
                                </div>
                            </div>

                            {os.prazo_entrega && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">Prazo de Entrega</p>
                                        <p className="text-xs text-neutral-500">
                                            {format(new Date(os.prazo_entrega), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {os.data_conclusao && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">Concluída</p>
                                        <p className="text-xs text-neutral-500">
                                            {format(new Date(os.data_conclusao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
