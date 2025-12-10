import React from 'react';
import { cn } from '@/lib/utils';
import {
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Truck,
    Package,
    DollarSign,
    LucideIcon
} from 'lucide-react';

export type StatusType =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'cancelled'
    | 'paid'
    | 'unpaid'
    | 'overdue'
    | 'in_transit'
    | 'delivered';

export interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    className?: string;
}

const statusConfig: Record<StatusType, {
    label: string;
    icon: LucideIcon;
    className: string;
}> = {
    pending: {
        label: 'Pendente',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    },
    processing: {
        label: 'Processando',
        icon: Package,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    },
    completed: {
        label: 'Concluído',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
    cancelled: {
        label: 'Cancelado',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
    paid: {
        label: 'Pago',
        icon: DollarSign,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
    unpaid: {
        label: 'Não Pago',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    },
    overdue: {
        label: 'Vencido',
        icon: AlertCircle,
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    },
    in_transit: {
        label: 'Em Trânsito',
        icon: Truck,
        className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    },
    delivered: {
        label: 'Entregue',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    },
};

export function StatusBadge({
    status,
    label,
    size = 'md',
    showIcon = true,
    className,
}: StatusBadgeProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-200',
                config.className,
                sizes[size],
                'hover:scale-105',
                className
            )}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {label || config.label}
        </span>
    );
}

// Componente auxiliar para mapear status de vendas
export function SaleStatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, StatusType> = {
        'concluida': 'completed',
        'pendente': 'pending',
        'cancelada': 'cancelled',
    };

    return <StatusBadge status={statusMap[status] || 'pending'} />;
}

// Componente auxiliar para mapear status de delivery
export function DeliveryStatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, StatusType> = {
        'pending': 'pending',
        'preparing': 'processing',
        'ready': 'processing',
        'in_transit': 'in_transit',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
    };

    return <StatusBadge status={statusMap[status] || 'pending'} />;
}

// Componente auxiliar para mapear status de pagamento
export function PaymentStatusBadge({
    status,
    dueDate
}: {
    status: string;
    dueDate?: Date | string;
}) {
    let statusType: StatusType = 'unpaid';

    if (status === 'paid') {
        statusType = 'paid';
    } else if (dueDate) {
        const due = new Date(dueDate);
        const now = new Date();
        if (due < now) {
            statusType = 'overdue';
        }
    }

    return <StatusBadge status={statusType} />;
}
