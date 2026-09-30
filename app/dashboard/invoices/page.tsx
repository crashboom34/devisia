'use client';

import Link from 'next/link';
import { Clock3, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function InvoicesPage() {
  const { loading } = useAuthGuard();

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Factures"
          subtitle="La facturation n'est pas encore disponible dans cette bêta."
          breadcrumbs={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Factures' },
          ]}
        />

        {loading ? (
          <div role="status" className="flex min-h-64 items-center justify-center text-sm text-slate-400">
            Chargement…
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock3 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">Bientôt disponible</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Facturation en préparation</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-400">
              Aucun total, taux de paiement ou document de facture n&apos;est simulé. En attendant l&apos;ouverture de ce
              module, vos devis restent accessibles et exportables depuis l&apos;espace Devis.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/quotes">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Voir mes devis
              </Link>
            </Button>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
