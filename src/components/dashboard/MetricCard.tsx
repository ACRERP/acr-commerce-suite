/**
 * Componente de Card de Métrica para Dashboard
 * 
 * Exibe um indicador com valor, título, descrição e comparação com período anterior
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    loading?: boolean;
}

const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-600',
    warning: 'bg-yellow-500/10 text-yellow-600',
    danger: 'bg-red-500/10 text-red-600',
    info: 'bg-blue-500/10 text-blue-600',
};

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    color = 'primary',
    loading = false,
}: MetricCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (trend.value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    const getTrendColor = () => {
        if (!trend) return '';
        if (trend.value > 0) return 'text-green-600';
        if (trend.value < 0) return 'text-red-600';
        return 'text-gray-500';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-2">{value}</h3>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                        {trend && (
                            <div className={cn('flex items-center gap-1 mt-2 text-sm font-medium', getTrendColor())}>
                                {getTrendIcon()}
                                <span>{Math.abs(trend.value)}%</span>
                                <span className="text-xs text-muted-foreground ml-1">{trend.label}</span>
                            </div>
                        )}
                    </div>
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
