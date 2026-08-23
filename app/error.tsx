'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application render error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12">
      <div role="alert" className="w-full max-w-lg rounded-2xl border border-danger/30 bg-surface p-6 text-center shadow-panel sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-foreground">Une erreur est survenue</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          La page n’a pas pu être affichée. Vous pouvez réessayer sans perdre votre session.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/dashboard">Retour à l’accueil</Link>
          </Button>
          <Button type="button" onClick={reset}>Réessayer</Button>
        </div>
      </div>
    </main>
  );
}
