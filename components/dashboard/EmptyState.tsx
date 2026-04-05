import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-6">
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute inset-0 bg-brand-green/10 blur-2xl rounded-full"></div>
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-200">
            <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-gray-500 text-center mb-5 sm:mb-6 max-w-sm leading-relaxed">
          {description}
        </p>

        {action && (
          <Button
            onClick={action.onClick}
            variant="primary"
            size="sm"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
