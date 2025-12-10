/**
 * Centro de Notificações
 * 
 * Componente de dropdown com lista de notificações
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationService, Notification } from '@/lib/notifications/notification-service';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    // Buscar notificações
    const { data: notifications = [], refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.getNotifications(),
        refetchInterval: 60000, // Atualizar a cada 1 minuto
    });

    // Contagem de não lidas
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (notificationId: string) => {
        await notificationService.markAsRead(notificationId);
        refetch();
    };

    const handleMarkAllAsRead = async () => {
        await notificationService.markAllAsRead();
        refetch();
    };

    const handleDelete = async (notificationId: string) => {
        await notificationService.deleteNotification(notificationId);
        refetch();
    };

    const handleAction = (notification: Notification) => {
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setOpen(false);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        const iconClass = 'h-4 w-4';
        switch (type) {
            case 'success':
                return <Check className={cn(iconClass, 'text-green-600')} />;
            case 'warning':
                return <Bell className={cn(iconClass, 'text-yellow-600')} />;
            case 'error':
                return <Bell className={cn(iconClass, 'text-red-600')} />;
            default:
                return <Bell className={cn(iconClass, 'text-blue-600')} />;
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return 'border-l-green-500 bg-green-50';
            case 'warning':
                return 'border-l-yellow-500 bg-yellow-50';
            case 'error':
                return 'border-l-red-500 bg-red-50';
            default:
                return 'border-l-blue-500 bg-blue-50';
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificações</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="h-auto p-1 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhuma notificação</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px]">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    'p-3 border-l-4 mb-2 mx-2 rounded-r',
                                    getNotificationColor(notification.type),
                                    !notification.read && 'font-semibold'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold">
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-600 mt-1" />
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center gap-2 pt-2">
                                            {notification.actionUrl && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAction(notification)}
                                                    className="h-7 text-xs"
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    {notification.actionLabel || 'Ver'}
                                                </Button>
                                            )}

                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="h-7 text-xs"
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Marcar como lida
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(notification.id)}
                                                className="h-7 text-xs ml-auto"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <p className="text-xs text-muted-foreground pt-1">
                                            {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
