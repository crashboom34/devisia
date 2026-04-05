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
  valueColor = 'text-gray-900',
  iconColor = 'text-gray-400',
  onClick
}: KpiCardProps) {
  return (
    <Card
      className={`bg-white border-gray-200 hover:border-brand-green/30 transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 truncate">
              {title}
            </p>
          </div>
          {Icon && (
            <div className="p-1.5 sm:p-2.5 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 ml-2 shrink-0">
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
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
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {trend.value}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed truncate">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
