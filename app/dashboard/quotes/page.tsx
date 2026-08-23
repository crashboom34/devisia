'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Layers3, Plus, Shapes } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageError, PageLoading } from '@/components/dashboard/PageState';
import { Button } from '@/components/ui/button';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { supabase } from '@/lib/supabase';

interface Estimate {
  id: string;
  project_id: string;
  scenario_type: 'eco' | 'standard' | 'premium' | null;
  total_ttc: number | null;
  created_at: string;
  projects?: {
    title: string;
  } | null;
}

const scenarioLabels: Record<string, string> = {
  eco: 'Éco',
  standard: 'Standard',
  premium: 'Premium',
};

function formatAmount(value: number | null) {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function QuotesPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const loadEstimates = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('estimates')
        .select('id, project_id, scenario_type, total_ttc, created_at, projects(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setEstimates((data ?? []) as unknown as Estimate[]);
    } catch (loadError) {
      console.error('Error loading estimates:', loadError);
      setError('Impossible de charger les devis pour le moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadEstimates(user.id);
  }, [authLoading, loadEstimates, user]);

  const filteredEstimates = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase('fr');
    if (!query) return estimates;

    return estimates.filter((estimate) =>
      estimate.projects?.title?.toLocaleLowerCase('fr').includes(query)
      || estimate.id.toLocaleLowerCase('fr').includes(query)
      || scenarioLabels[estimate.scenario_type ?? '']?.toLocaleLowerCase('fr').includes(query)
    );
  }, [estimates, searchValue]);

  const stats = useMemo(() => ({
    total: estimates.length,
    projects: new Set(estimates.map((estimate) => estimate.project_id)).size,
    standard: estimates.filter((estimate) => estimate.scenario_type === 'standard').length,
    premium: estimates.filter((estimate) => estimate.scenario_type === 'premium').length,
  }), [estimates]);

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <PageContainer>
          <PageLoading label={authLoading ? 'Vérification de votre accès…' : 'Redirection…'} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="Devis"
          subtitle="Consultez les variantes de devis générées pour vos dossiers."
          breadcrumbs={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Devis' },
          ]}
          actions={(
            <Button asChild size="sm">
              <Link href="/project/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nouveau devis
              </Link>
            </Button>
          )}
        />

        {!error && !loading && (
          <section aria-label="Synthèse des devis" className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
              <KpiCard title="Variantes générées" value={stats.total} subtitle="Toutes gammes" icon={FileText} />
              <KpiCard title="Dossiers couverts" value={stats.projects} subtitle="Avec au moins un devis" icon={Layers3} />
              <KpiCard title="Gamme standard" value={stats.standard} subtitle="Variantes générées" icon={Shapes} />
              <KpiCard title="Gamme premium" value={stats.premium} subtitle="Variantes générées" icon={Shapes} />
            </div>
          </section>
        )}

        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher un dossier, un numéro ou une gamme…"
          onRefresh={() => void loadEstimates(user.id)}
        />

        {error ? (
          <PageError description={error} onRetry={() => void loadEstimates(user.id)} />
        ) : loading ? (
          <PageLoading label="Chargement des devis…" />
        ) : estimates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun devis"
            description="Créez un premier dossier pour générer vos variantes de devis."
            action={{ label: 'Créer un devis', href: '/project/new' }}
          />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filteredEstimates.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Aucun devis ne correspond à cette recherche.
                </p>
              ) : filteredEstimates.map((estimate) => (
                <Link
                  key={estimate.id}
                  href={`/project/${estimate.project_id}`}
                  className="block rounded-xl border border-border bg-surface p-4 shadow-panel transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{estimate.projects?.title || 'Dossier sans titre'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">#{estimate.id.slice(0, 8)}</p>
                    </div>
                    <span className="rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground">
                      {scenarioLabels[estimate.scenario_type ?? ''] || 'Non précisée'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(estimate.created_at)}</span>
                    <span className="text-base font-bold text-foreground">{formatAmount(estimate.total_ttc)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-panel lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">Liste des devis générés</caption>
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated">
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">N° devis</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dossier</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gamme</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Créé le</th>
                      <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Montant TTC</th>
                      <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEstimates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">Aucun devis ne correspond à cette recherche.</td>
                      </tr>
                    ) : filteredEstimates.map((estimate) => (
                      <tr key={estimate.id} className="transition-colors hover:bg-surface-elevated">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">#{estimate.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{estimate.projects?.title || 'Dossier sans titre'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{scenarioLabels[estimate.scenario_type ?? ''] || 'Non précisée'}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{formatDate(estimate.created_at)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-foreground">{formatAmount(estimate.total_ttc)}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/project/${estimate.project_id}`} aria-label={`Ouvrir le devis ${estimate.id.slice(0, 8)}`}>
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              Ouvrir
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border px-6 py-3 text-sm text-muted-foreground">
                {filteredEstimates.length} devis affiché{filteredEstimates.length > 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
