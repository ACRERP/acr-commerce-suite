import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: "primary" | "accent" | "success" | "warning" | "destructive";
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCardSkeleton() {
  return (
    <div className="stat-card p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-2/4" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-7 w-1/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "primary",
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-11 h-11 rounded-lg transition-transform group-hover:scale-110",
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          {isPositive && <TrendingUp className="w-4 h-4 text-success" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-destructive" />}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )}
          >
            {isPositive && "+"}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
