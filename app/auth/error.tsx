'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function AuthError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-dark px-4 py-8">
      <section className="w-full max-w-md rounded-xl border border-gray-800 bg-brand-darkCard p-6 text-center shadow-2xl">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <AlertCircle className="h-7 w-7 text-amber-400" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-white">Un problème est survenu</h1>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Cette page d’authentification n’a pas pu être chargée. Vous pouvez réessayer sans
          risque ou revenir à la connexion.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={reset} size="lg" className="w-full">
            Réessayer
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/auth/login">Se connecter</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
