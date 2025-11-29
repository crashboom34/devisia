import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  description?: string;
}

export function StatCard({ title, value, trend, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 rounded-lg bg-brand-light">
            <Icon className="h-5 w-5 text-brand-green" />
          </div>
          {trend && (
            <div className={`text-sm font-medium ${trend.isPositive ? 'text-status-success' : 'text-status-danger'}`}>
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-status-neutral mb-1">{title}</p>
          <p className="text-3xl font-bold text-brand-dark">{value}</p>
          {description && (
            <p className="text-xs text-status-neutral mt-2">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
