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
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mb-6">
          <Icon className="h-10 w-10 text-slate-500" />
        </div>

        <h3 className="text-xl font-semibold text-white mb-2">
          {title}
        </h3>

        <p className="text-slate-400 text-center mb-6 max-w-md">
          {description}
        </p>

        {action && (
          <Button
            onClick={action.onClick}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
