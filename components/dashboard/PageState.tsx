import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageLoading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

interface PageErrorProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function PageError({ title = 'Impossible d’afficher cette page', description, onRetry }: PageErrorProps) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4">
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
