import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
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
  valueColor = 'text-white',
  iconColor = 'text-slate-400',
  onClick
}: KpiCardProps) {
  return (
    <Card
      className={`bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50 backdrop-blur-sm ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {title}
            </p>
          </div>
          {Icon && (
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold tracking-tight ${valueColor}`}>
              {value}
            </p>
            {trend && (
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {trend.value}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-sm text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
