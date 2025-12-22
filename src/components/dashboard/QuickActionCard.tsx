import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
    icon: LucideIcon;
    label: string;
    shortcut?: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
}

export function QuickActionCard({
    icon: Icon,
    label,
    shortcut,
    onClick,
    variant = 'default'
}: QuickActionCardProps) {

    const variants = {
        default: "hover:border-primary/50 hover:bg-muted/50",
        primary: "bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary",
        success: "bg-success/10 border-success/20 hover:bg-success/20 text-success",
        warning: "bg-warning/10 border-warning/20 hover:bg-warning/20 text-warning",
        info: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-600",
    };

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 group relative overflow-hidden",
                variants[variant]
            )}
            onClick={onClick}
        >
            <div className="p-4 flex flex-col items-center justify-center gap-3 text-center h-full min-h-[120px]">
                <div className={cn(
                    "p-3 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform duration-200",
                    variant === 'default' ? "text-muted-foreground group-hover:text-primary" : "text-current"
                )}>
                    <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold text-sm leading-tight">{label}</h3>
                    {shortcut && (
                        <span className="inline-block text-[10px] font-mono bg-background/80 border rounded px-1.5 py-0.5 text-muted-foreground opacity-70">
                            {shortcut}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
}
