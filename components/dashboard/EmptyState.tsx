import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
      <CardContent className="flex flex-col items-center justify-center py-20 px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600/50 shadow-lg">
            <Icon className="h-12 w-12 text-slate-400" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">
          {title}
        </h3>

        <p className="text-slate-400 text-center mb-8 max-w-md leading-relaxed">
          {description}
        </p>

        {action && (
          <Button
            onClick={action.onClick}
            className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 px-6 py-2.5 h-auto font-medium"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
