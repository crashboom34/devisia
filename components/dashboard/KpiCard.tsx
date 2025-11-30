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
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, valueColor }: KpiCardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              {title}
            </p>
          </div>
          {Icon && (
            <div className="p-2 bg-slate-700/50 rounded-lg">
              <Icon className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className={`text-3xl font-bold ${valueColor || 'text-white'}`}>
            {value}
          </p>

          {subtitle && (
            <p className="text-sm text-slate-500">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
