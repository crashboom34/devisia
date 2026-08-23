import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  valueColor?: string;
  iconColor?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  valueColor = 'text-foreground',
  iconColor = 'text-primary',
  onClick
}: KpiCardProps) {
  return (
    <Card
      className={`min-w-[10rem] border-border bg-surface shadow-panel transition-colors hover:border-primary/30 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              {title}
            </p>
          </div>
          {Icon && (
            <div className="ml-2 shrink-0 rounded-lg border border-border bg-surface-elevated p-1.5 sm:rounded-xl sm:p-2.5">
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight ${valueColor}`}>
              {value}
            </p>
            {trend && (
              <span className={`text-[10px] sm:text-sm font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger'
              }`}>
                {trend.value}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="truncate text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
