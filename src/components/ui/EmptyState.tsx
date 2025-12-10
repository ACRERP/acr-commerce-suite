import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-12 px-4 text-center',
            className
        )}>
            {icon && (
                <div className="mb-4 text-gray-300 dark:text-gray-600">
                    {icon}
                </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                    {description}
                </p>
            )}

            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Estados vazios pré-configurados
export function EmptyProducts({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            }
            title="Nenhum produto cadastrado"
            description="Comece adicionando seu primeiro produto ao sistema"
            action={onAdd ? {
                label: 'Adicionar Produto',
                onClick: onAdd,
            } : undefined}
        />
    );
}

export function EmptyClients({ onAdd }: { onAdd?: () => void }) {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            }
            title="Nenhum cliente cadastrado"
            description="Adicione clientes para começar a vender"
            action={onAdd ? {
                label: 'Adicionar Cliente',
                onClick: onAdd,
            } : undefined}
        />
    );
}

export function EmptySales() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            }
            title="Nenhuma venda registrada"
            description="As vendas aparecerão aqui quando forem realizadas"
        />
    );
}

export function EmptyDeliveries() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
            }
            title="Nenhuma entrega pendente"
            description="Entregas aparecerão aqui quando houver pedidos"
        />
    );
}

export function EmptyReports() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            }
            title="Nenhum dado disponível"
            description="Selecione um período e tipo de relatório para visualizar"
        />
    );
}

export function EmptyNotifications() {
    return (
        <EmptyState
            icon={
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            }
            title="Nenhuma notificação"
            description="Você está em dia com tudo!"
        />
    );
}
