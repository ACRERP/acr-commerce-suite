/**
 * Componente de Page Header
 * 
 * Cabeçalho padronizado para páginas com título, descrição e ações
 */

import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    backButton?: boolean;
    backUrl?: string;
    actions?: ReactNode;
    breadcrumbs?: Array<{
        label: string;
        href?: string;
    }>;
    className?: string;
}

export function PageHeader({
    title,
    description,
    backButton = false,
    backUrl,
    actions,
    breadcrumbs,
    className,
}: PageHeaderProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center">
                            {index > 0 && <span className="mx-2">/</span>}
                            {crumb.href ? (
                                <button
                                    onClick={() => navigate(crumb.href!)}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {crumb.label}
                                </button>
                            ) : (
                                <span className="text-foreground font-medium">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    {backButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="mt-1"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}

                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

// Exemplo de uso:
/*
<PageHeader
  title="Produtos"
  description="Gerencie seu catálogo de produtos"
  breadcrumbs={[
    { label: 'Dashboard', href: '/' },
    { label: 'Estoque', href: '/estoque' },
    { label: 'Produtos' },
  ]}
  actions={
    <>
      <Button variant="outline">Importar</Button>
      <Button>Novo Produto</Button>
    </>
  }
/>
*/
