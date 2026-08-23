import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center gap-3 bg-background px-4 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm">Chargement…</span>
    </div>
  );
}
