'use client';

import Link from 'next/link';
import { ArrowRight, Eye, KeyRound, Settings2, ShieldCheck, UserRound } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageLoading } from '@/components/dashboard/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/use-auth-guard';

const settingsLinks = [
  {
    title: 'Paramètres détaillés',
    description: 'Entreprise, préférences, devis et notifications.',
    href: '/settings/parametres',
    icon: Settings2,
  },
  {
    title: 'Affichage avancé',
    description: 'Consulter les restrictions d’affichage existantes.',
    href: '/settings/view-mode',
    icon: Eye,
  },
  {
    title: 'Abonnement',
    description: 'Voir les plans et les limites associées au compte.',
    href: '/pricing',
    icon: ShieldCheck,
  },
];

export default function SettingsPage() {
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
      <PageContainer className="max-w-5xl">
        <PageHeader
          title="Paramètres"
          subtitle="Gérez votre compte et les préférences de Devisia."
          breadcrumbs={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Paramètres' },
          ]}
          showBackButton={false}
        />

        <Card className="border-border bg-surface shadow-panel">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-primary">
                  <UserRound className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Compte connecté</p>
                  <p className="mt-1 truncate font-semibold text-foreground">{user.email}</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/parametres">Modifier les préférences</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="settings-sections-title">
          <h2 id="settings-sections-title" className="mb-4 text-lg font-semibold text-foreground">Sections</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settingsLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border border-border bg-surface p-5 shadow-panel transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="security-title" className="rounded-xl border border-info/30 bg-info/10 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="security-title" className="font-semibold text-foreground">Clés de génération gérées par Devisia</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Aucune clé API personnelle n’est demandée dans l’application. Les accès aux services de génération sont configurés côté plateforme.
              </p>
            </div>
          </div>
        </section>
      </PageContainer>
    </DashboardLayout>
  );
}
