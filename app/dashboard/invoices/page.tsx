'use client';

import Link from 'next/link';
import { ArrowRight, FileClock, FileText, ReceiptText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageLoading } from '@/components/dashboard/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function InvoicesPage() {
  const { user, loading } = useAuthGuard();

  if (loading || !user) {
    return (
      <DashboardLayout showNewQuoteButton={false}>
        <PageContainer>
          <PageLoading label={loading ? 'Vérification de votre accès…' : 'Redirection…'} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <PageContainer>
        <PageHeader
          title="Factures"
          subtitle="La facturation n’est pas encore disponible dans Devisia."
          breadcrumbs={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Factures' },
          ]}
          showBackButton={false}
        />

        <Card className="overflow-hidden border-border bg-surface shadow-panel">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
              <div className="flex flex-col justify-center border-b border-border p-6 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-primary">
                  <ReceiptText className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Module en préparation</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Une facturation reliée aux devis</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                  Aucune facture, échéance ou donnée d’encaissement n’est simulée ici. Le module sera activé lorsqu’il pourra s’appuyer sur un cycle de facturation réel.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-6 w-fit">
                  <Link href="/dashboard/quotes">
                    Consulter les devis
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              <div className="bg-surface-elevated p-6 sm:p-10">
                <h3 className="text-sm font-semibold text-foreground">Ce qui sera disponible</h3>
                <ul className="mt-5 space-y-4">
                  <li className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Conversion depuis un devis</p>
                      <p className="mt-1 text-sm text-muted-foreground">Création d’une facture à partir de données validées.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Échéances et statuts réels</p>
                      <p className="mt-1 text-sm text-muted-foreground">Suivi fondé sur les dates et paiements enregistrés.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ReceiptText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Documents cohérents</p>
                      <p className="mt-1 text-sm text-muted-foreground">Numérotation et exports intégrés au parcours métier.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}
