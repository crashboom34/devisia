'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  FileText,
  FolderKanban,
  Plus,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageError, PageLoading } from '@/components/dashboard/PageState';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { supabase, type Project } from '@/lib/supabase';
import { checkProjectLimit, type ProjectLimitInfo } from '@/lib/subscription-helper';

interface DashboardCounts {
  estimates: number;
  drafts: number;
  processing: number;
  completed: number;
}

const initialCounts: DashboardCounts = {
  estimates: 0,
  drafts: 0,
  processing: 0,
  completed: 0,
};

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function ActivityStat({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card className="border-border bg-surface shadow-panel">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-elevated p-2.5 text-primary">
            <Icon className="h-5 w-5" aria-hidden={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const latestRequest = useRef(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>(initialCounts);
  const [projectLimits, setProjectLimits] = useState<ProjectLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (userId: string) => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError(null);

    try {
      const [projectsResult, estimatesResult, limits] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('estimates').select('id').eq('user_id', userId),
        checkProjectLimit(userId),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (estimatesResult.error) throw estimatesResult.error;
      if (requestId !== latestRequest.current) return;

      const projectData = projectsResult.data ?? [];
      setProjects(projectData);
      setCounts({
        estimates: estimatesResult.data?.length ?? 0,
        drafts: projectData.filter((project) => project.status === 'draft').length,
        processing: projectData.filter((project) => project.status === 'processing').length,
        completed: projectData.filter((project) => project.status === 'completed').length,
      });
      setProjectLimits(limits);
    } catch (loadError) {
      if (requestId !== latestRequest.current) return;
      console.error('Error loading dashboard:', loadError);
      setError('Les données d’activité ne sont pas disponibles pour le moment.');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadDashboard(user.id);
  }, [authLoading, loadDashboard, user]);

  const attentionProjects = useMemo(
    () => projects.filter((project) => project.status !== 'completed').slice(0, 5),
    [projects]
  );

  const displayName = user?.email?.split('@')[0] || 'votre équipe';
  const usagePercentage = projectLimits?.limit === -1
    ? 0
    : Math.min(((projectLimits?.used ?? 0) / Math.max(projectLimits?.limit ?? 1, 1)) * 100, 100);

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
          title={`Bonjour, ${displayName}`}
          subtitle="Retrouvez les dossiers à reprendre et les derniers devis générés."
          showBackButton={false}
          actions={(
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadDashboard(user.id)}
              disabled={loading}
              aria-label="Actualiser l’activité"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Actualiser
            </Button>
          )}
        />

        {error ? (
          <PageError description={error} onRetry={() => void loadDashboard(user.id)} />
        ) : loading ? (
          <PageLoading label="Chargement de votre activité…" />
        ) : (
          <>
            <section aria-labelledby="activity-overview-title">
              <h2 id="activity-overview-title" className="sr-only">Vue d’ensemble de l’activité</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
                <ActivityStat icon={FolderKanban} label="Dossiers" value={projects.length} helper="Tous les projets" />
                <ActivityStat icon={FileText} label="Devis" value={counts.estimates} helper="Devis générés" />
                <ActivityStat icon={Clock3} label="À reprendre" value={counts.drafts} helper="Dossiers brouillons" />
                <ActivityStat icon={Sparkles} label="En génération" value={counts.processing} helper="Traitements en cours" />
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)] lg:gap-6">
              <Card className="border-border bg-surface shadow-panel">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 p-5 sm:p-6">
                  <div>
                    <CardTitle className="text-lg text-foreground">À reprendre</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Les dossiers qui demandent encore une action.</p>
                  </div>
                  <Link href="/project/new">
                    <Button size="sm">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Nouveau
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                  {attentionProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-6 text-center">
                      <CircleCheck className="mx-auto h-7 w-7 text-success" aria-hidden="true" />
                      <p className="mt-3 font-medium text-foreground">Aucun dossier en attente</p>
                      <p className="mt-1 text-sm text-muted-foreground">Vos dossiers en cours apparaîtront ici.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {attentionProjects.map((project) => (
                        <li key={project.id}>
                          <Link
                            href={`/project/${project.id}`}
                            className="group flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{project.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Mis à jour le {formatProjectDate(project.updated_at)}</p>
                            </div>
                            <StatusBadge status={project.status} />
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card className="border-border bg-surface shadow-panel">
                  <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-lg text-foreground">Usage mensuel</CardTitle>
                      <span className="text-sm font-semibold text-foreground">
                        {projectLimits?.used ?? 0}{projectLimits?.limit === -1 ? '' : ` / ${projectLimits?.limit ?? 0}`}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                    {projectLimits?.limit === -1 ? (
                      <p className="text-sm text-muted-foreground">Création de projets illimitée pour ce compte.</p>
                    ) : (
                      <>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-surface-elevated"
                          role="progressbar"
                          aria-label="Projets utilisés ce mois"
                          aria-valuemin={0}
                          aria-valuemax={projectLimits?.limit ?? 0}
                          aria-valuenow={projectLimits?.used ?? 0}
                        >
                          <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercentage}%` }} />
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {projectLimits?.has_reached_limit
                            ? 'Limite atteinte pour ce mois.'
                            : `${projectLimits?.remaining ?? 0} projet${(projectLimits?.remaining ?? 0) > 1 ? 's' : ''} disponible${(projectLimits?.remaining ?? 0) > 1 ? 's' : ''}.`}
                        </p>
                      </>
                    )}
                    <Link href="/pricing" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
                      Voir les abonnements
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-border bg-surface shadow-panel">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Dossiers finalisés</p>
                        <p className="mt-1 text-sm text-muted-foreground">{counts.completed} projet{counts.completed > 1 ? 's' : ''} terminé{counts.completed > 1 ? 's' : ''}</p>
                      </div>
                      <CircleCheck className="h-6 w-6 text-success" aria-hidden="true" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-border bg-surface shadow-panel">
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 p-5 pb-3 sm:p-6 sm:pb-3">
                <div>
                  <CardTitle className="text-lg text-foreground">Activité récente</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Les derniers dossiers créés ou mis à jour.</p>
                </div>
                <Link href="/dashboard/quotes" className="text-sm font-medium text-primary hover:underline">Voir les devis</Link>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                {projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface-elevated p-6 text-center">
                    <FileText className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    <p className="mt-3 font-medium text-foreground">Votre activité commence ici</p>
                    <p className="mt-1 text-sm text-muted-foreground">Créez un premier dossier pour préparer votre devis.</p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/project/new">Créer un devis</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.slice(0, 6).map((project) => (
                      <Link
                        key={project.id}
                        href={`/project/${project.id}`}
                        className="rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-semibold text-foreground">{project.title}</p>
                          <StatusBadge status={project.status} />
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Créé le {formatProjectDate(project.created_at)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
