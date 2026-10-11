'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, ChevronRight, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { getOrganizationEntitlements, hasEntitlement } from '@/lib/entitlements';
import { formatCurrencyEUR } from '@/lib/pricing/engine';
import { supabase } from '@/lib/supabase';

interface JobRow {
  id: string;
  name: string;
  client_name: string | null;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  sold_total_ht_cents: number;
  initial_budget_cents: number;
  created_at: string;
}

export default function JobsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).maybeSingle(),
      supabase.from('jobs').select('id, name, client_name, status, sold_total_ht_cents, initial_budget_cents, created_at').order('created_at', { ascending: false }),
    ]).then(async ([membership, result]) => {
      if (membership.error) throw membership.error;
      const access = membership.data?.organization_id
        ? await getOrganizationEntitlements(membership.data.organization_id)
        : { tier: 'starter', entitlements: [] };
      const canUseJobs = hasEntitlement(access.entitlements, 'job_management');
      setAllowed(canUseJobs);
      if (result.error && canUseJobs) throw result.error;
      setJobs((result.data || []) as JobRow[]);
    }).catch((error) => console.error('[jobs] loading failed', error)).finally(() => setLoading(false));
  }, [authLoading, user]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="Chantiers" subtitle="Du budget accepté aux coûts réellement engagés." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Chantiers' }]} />

        {!loading && allowed === false ? (
          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white">Suivi chantier disponible avec Business</h2>
              <p className="text-sm text-slate-400 mt-2">Starter conserve la création de devis et le calcul de coûts de base.</p>
              <Link href="/pricing" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300">Comparer les offres</Link>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="py-16 text-center text-slate-400">Chargement des chantiers…</div>
        ) : jobs.length === 0 ? (
          <EmptyState icon={BriefcaseBusiness} title="Aucun chantier" description="Acceptez un devis pour figer son budget initial et créer le chantier." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => {
              const plannedMargin = job.sold_total_ht_cents - job.initial_budget_cents;
              return (
                <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="min-w-0">
                  <Card className="h-full min-w-0 bg-slate-800/50 border-slate-700/40 hover:border-cyan-500/40 transition-colors">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-semibold text-white truncate">{job.name}</h2>
                          <p className="text-xs text-slate-500 mt-1">{job.client_name || 'Client à préciser'}</p>
                        </div>
                        <span className="text-[11px] rounded-full bg-cyan-500/10 text-cyan-300 px-2 py-1">{job.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-slate-500 text-xs">Vendu HT</p><p className="text-white font-semibold">{formatCurrencyEUR(job.sold_total_ht_cents / 100)}</p></div>
                        <div><p className="text-slate-500 text-xs">Marge prévue</p><p className={plannedMargin >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{formatCurrencyEUR(plannedMargin / 100)}</p></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500"><span>{new Date(job.created_at).toLocaleDateString('fr-FR')}</span><span className="flex items-center gap-1 text-cyan-400">Ouvrir <ChevronRight className="h-3.5 w-3.5" /></span></div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
