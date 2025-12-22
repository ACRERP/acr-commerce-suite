import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService, Alert } from '@/lib/alerts/alert-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    X,
    Check,
    AlertCircle,
    Clock,
    DollarSign,
    Package,
    Truck,
    TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export function AlertCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Buscar alertas não lidos
    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ['alerts', 'unread'],
        queryFn: () => alertService.getUnreadAlerts(),
        refetchInterval: 30000, // Atualizar a cada 30s
    });

    // Buscar estatísticas
    const { data: stats } = useQuery({
        queryKey: ['alerts', 'stats'],
        queryFn: () => alertService.getStats(),
        refetchInterval: 60000, // Atualizar a cada 1min
    });

    // Marcar como lido
    const markAsReadMutation = useMutation({
        mutationFn: (alertId: number) => alertService.markAsRead(alertId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
    });

    // Marcar todos como lidos
    const markAllAsReadMutation = useMutation({
        mutationFn: () => alertService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success('Todos os alertas foram marcados como lidos');
        }
    });

    const getPriorityColor = (prioridade: string) => {
        const colors = {
            'critica': 'bg-red-500',
            'alta': 'bg-orange-500',
            'media': 'bg-yellow-500',
            'baixa': 'bg-blue-500'
        };
        return colors[prioridade as keyof typeof colors] || 'bg-gray-500';
    };

    const getModuleIcon = (modulo: string) => {
        const icons = {
            'os': Clock,
            'financeiro': DollarSign,
            'estoque': Package,
            'delivery': Truck,
            'vendas': TrendingUp
        };
        return icons[modulo as keyof typeof icons] || AlertCircle;
    };

    const handleAlertClick = (alert: Alert) => {
        if (alert.acao_url) {
            window.location.href = alert.acao_url;
        }
        markAsReadMutation.mutate(alert.id!);
    };

    return (
        <div className="relative">
            {/* Botão de Notificações */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {stats && stats.nao_lidas > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {stats.nao_lidas > 9 ? '9+' : stats.nao_lidas}
                    </span>
                )}
            </button>

            {/* Painel de Alertas */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Painel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col animate-slide-in">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">Notificações</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {stats && stats.nao_lidas > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        {stats.nao_lidas} não {stats.nao_lidas === 1 ? 'lida' : 'lidas'}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAllAsReadMutation.mutate()}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Marcar todas como lidas
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Lista de Alertas */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">
                                    Carregando...
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {alerts.map((alert) => {
                                        const Icon = getModuleIcon(alert.modulo);

                                        return (
                                            <div
                                                key={alert.id}
                                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                                onClick={() => handleAlertClick(alert)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Ícone */}
                                                    <div className={`p-2 rounded-lg ${getPriorityColor(alert.prioridade)} bg-opacity-10`}>
                                                        <Icon className={`w-5 h-5 ${getPriorityColor(alert.prioridade).replace('bg-', 'text-')}`} />
                                                    </div>

                                                    {/* Conteúdo */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-sm truncate">
                                                                {alert.titulo}
                                                            </h4>
                                                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(alert.prioridade)}`} />
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                            {alert.mensagem}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary" size="sm">
                                                                {alert.modulo}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(alert.created_at!).toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ação */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsReadMutation.mutate(alert.id!);
                                                        }}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {alerts.length > 0 && (
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Ver todas as notificações
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Componente de Badge de Alerta (para usar em outros lugares)
export function AlertBadge() {
    const { data: stats } = useQuery({
        queryKey: ['alerts', 'stats'],
        queryFn: () => alertService.getStats(),
        refetchInterval: 60000,
    });

    if (!stats || stats.nao_lidas === 0) return null;

    return (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {stats.nao_lidas > 9 ? '9+' : stats.nao_lidas}
        </span>
    );
}
