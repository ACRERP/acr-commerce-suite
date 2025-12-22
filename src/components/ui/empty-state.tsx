/**
 * Componentes de Empty State
 * 
 * Estados vazios reutilizáveis para diferentes contextos
 */

import { LucideIcon, FileQuestion, ShoppingCart, Users, Package, FileText, DollarSign, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon: Icon = FileQuestion,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
            <Icon className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// Empty States Pré-configurados

export function EmptyCart() {
    return (
        <EmptyState
            icon={ShoppingCart}
            title="Carrinho Vazio"
            description="Adicione produtos ao carrinho para iniciar uma venda"
        />
    );
}

export function EmptyProducts() {
    return (
        <EmptyState
            icon={Package}
            title="Nenhum Produto Encontrado"
            description="Não há produtos cadastrados ou nenhum produto corresponde aos filtros aplicados"
        />
    );
}

export function EmptyClients() {
    return (
        <EmptyState
            icon={Users}
            title="Nenhum Cliente Encontrado"
            description="Não há clientes cadastrados ou nenhum cliente corresponde à busca"
        />
    );
}

export function EmptySales() {
    return (
        <EmptyState
            icon={DollarSign}
            title="Nenhuma Venda Registrada"
            description="Não há vendas no período selecionado"
        />
    );
}

export function EmptyReports() {
    return (
        <EmptyState
            icon={FileText}
            title="Nenhum Dado Disponível"
            description="Selecione um tipo de relatório e período para gerar os dados"
        />
    );
}

export function EmptyNotifications() {
    return (
        <EmptyState
            icon={Inbox}
            title="Nenhuma Notificação"
            description="Você está em dia! Não há notificações pendentes"
        />
    );
}

// Empty State com Ilustração Customizada
export function EmptyStateWithImage({
    imageSrc,
    imageAlt = 'Empty state',
    title,
    description,
    action,
    className,
}: {
    imageSrc: string;
    imageAlt?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
            <img
                src={imageSrc}
                alt={imageAlt}
                className="h-48 w-48 object-contain mb-6 opacity-50"
            />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
