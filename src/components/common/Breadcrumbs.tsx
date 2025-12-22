import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
    className?: string;
    customBreadcrumbs?: Array<{ label: string; path: string }>;
}

export function Breadcrumbs({ className, customBreadcrumbs }: BreadcrumbsProps) {
    const breadcrumbs = useBreadcrumbs(customBreadcrumbs);

    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const isFirst = index === 0;

                return (
                    <div key={crumb.path} className="flex items-center gap-2">
                        {isFirst ? (
                            <Link
                                to={crumb.path}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">{crumb.label}</span>
                            </Link>
                        ) : (
                            <>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                {isLast ? (
                                    <span className="font-medium text-foreground">{crumb.label}</span>
                                ) : (
                                    <Link
                                        to={crumb.path}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {crumb.label}
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
