import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-border bg-surface shadow-panel">
      <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-6">
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-elevated sm:h-20 sm:w-20">
            <Icon className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-2 text-lg font-bold text-foreground sm:text-xl">
          {title}
        </h2>

        <p className="mb-5 max-w-sm text-center text-sm leading-relaxed text-muted-foreground sm:mb-6">
          {description}
        </p>

        {action && (
          action.href ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} size="sm">{action.label}</Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
