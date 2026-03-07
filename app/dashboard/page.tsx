'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import UserMenu from '@/components/UserMenu';
import { StatusBadge } from '@/components/ui/status-badge';
import AdminPlanSimulator from '@/components/AdminPlanSimulator';
import {
  FileText, Plus, Clock, Euro, RefreshCw, ChevronRight,
  Loader as Loader2, CircleCheck as CheckCircle2, TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import { checkProjectLimit, isUserAdmin, type ProjectLimitInfo } from '@/lib/subscription-helper';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatesCount, setEstimatesCount] = useState({ total: 0, completed: 0, processing: 0, pending: 0 });
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '3months'>('30days');
  const [isAdmin, setIsAdmin] = useState(false);
  const [projectLimits, setProjectLimits] = useState<ProjectLimitInfo | null>(null);

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    const [adminStatus, limits, projectsResult, estimatesResult] = await Promise.all([
      isUserAdmin(currentUser.id),
      checkProjectLimit(currentUser.id),
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('estimates').select('id, scenario_type').eq('user_id', currentUser.id),
    ]);

    setIsAdmin(adminStatus);
    setProjectLimits(limits);

    const projectsData = projectsResult.data || [];
    setProjects(projectsData);

    const estimatesData = estimatesResult.data || [];
    setEstimatesCount({
      total: estimatesData.length,
      completed: estimatesData.filter(e => e.scenario_type).length,
      processing: projectsData.filter(p => p.status === 'processing').length,
      pending: projectsData.filter(p => p.status === 'draft').length,
    });

    setLoading(false);
  };

  const handleRefreshData = async () => {
    if (!user) return;
    setLoading(true);
    const [projectsResult, estimatesResult, limits] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('estimates').select('id, scenario_type').eq('user_id', user.id),
      checkProjectLimit(user.id),
    ]);

    const projectsData = projectsResult.data || [];
    setProjects(projectsData);
    setProjectLimits(limits);

    const estimatesData = estimatesResult.data || [];
    setEstimatesCount({
      total: estimatesData.length,
      completed: estimatesData.filter(e => e.scenario_type).length,
      processing: projectsData.filter(p => p.status === 'processing').length,
      pending: projectsData.filter(p => p.status === 'draft').length,
    });

    setLoading(false);
  };

  const getFirstName = () => {
    if (!user?.email) return 'Utilisateur';
    return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="bg-slate-900/98 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 h-14 lg:h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Devisia</span>
            </Link>

            <div className="hidden lg:block flex-1" />

            <div className="flex items-center gap-2.5">
              <Link href="/project/new" className="hidden sm:block">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" />
                  Nouveau Devis
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-24 lg:pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-8 max-w-7xl mx-auto space-y-5 lg:space-y-8">

            {/* Greeting */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white tracking-tight">
                  Bonjour, {getFirstName()}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-400 mt-0.5">
                  Voici un apercu de votre activite
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshData}
                className="h-9 w-9 text-slate-400"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {isAdmin && <AdminPlanSimulator userId={user?.id} />}

            {/* KPI Strip -- horizontal scroll on mobile */}
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6 sm:overflow-visible scrollbar-hide">
                {[
                  { title: 'Total devis', value: estimatesCount.total, sub: `${estimatesCount.completed} approuves`, color: 'cyan', icon: FileText },
                  { title: 'En attente', value: estimatesCount.pending, sub: 'A traiter', color: 'orange', icon: Clock },
                  { title: 'Approuves', value: estimatesCount.completed, sub: 'Devis acceptes', color: 'emerald', icon: CheckCircle2 },
                  { title: "Chiffre d'affaires", value: '0 EUR', sub: '30 derniers jours', color: 'cyan', icon: Euro },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  const colorMap: Record<string, string> = {
                    cyan: 'text-cyan-400 bg-cyan-500/10',
                    orange: 'text-orange-400 bg-orange-500/10',
                    emerald: 'text-emerald-400 bg-emerald-500/10',
                  };
                  const textColor: Record<string, string> = {
                    cyan: 'text-cyan-400',
                    orange: 'text-orange-400',
                    emerald: 'text-emerald-400',
                  };
                  return (
                    <div
                      key={kpi.title}
                      className="min-w-[140px] sm:min-w-0 bg-slate-800/60 border border-slate-700/40 rounded-2xl p-3.5 sm:p-4 lg:p-5 flex-shrink-0 sm:flex-shrink"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                        <div className={cn('p-1.5 rounded-lg', colorMap[kpi.color])}>
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                      </div>
                      <p className={cn('text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight', textColor[kpi.color] || 'text-white')}>
                        {kpi.value}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Section */}
            <Card className="bg-slate-800/40 border-slate-700/40 overflow-hidden">
              <CardHeader className="border-b border-slate-700/40 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-base sm:text-lg lg:text-xl font-bold">
                      Chiffre d&apos;affaires
                    </CardTitle>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                      {chartPeriod === '7days' ? '7' : chartPeriod === '30days' ? '30' : '90'} derniers jours
                    </p>
                  </div>
                  <div className="flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-700/40">
                    {[
                      { key: '7days' as const, label: '7J' },
                      { key: '30days' as const, label: '30J' },
                      { key: '3months' as const, label: '3M' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setChartPeriod(p.key)}
                        className={cn(
                          'px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                          chartPeriod === p.key
                            ? 'bg-cyan-600 text-white shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="h-36 sm:h-48 lg:h-56 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/40">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-slate-500">Aucune donnee pour le moment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Quotes + Plan -- stack on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
              {/* Recent Quotes */}
              <Card className="bg-slate-800/40 border-slate-700/40">
                <CardHeader className="p-4 lg:p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base sm:text-lg font-bold">Devis recents</CardTitle>
                    <Link href="/dashboard/quotes" className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      Voir tout
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/40">
                      <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 mb-3">Aucun devis</p>
                      <Link href="/project/new">
                        <Button variant="primary" size="xs">
                          <Plus className="h-3.5 w-3.5" />
                          Creer un devis
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.slice(0, 5).map((project) => (
                        <Link key={project.id} href={`/project/${project.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 active:scale-[0.99] transition-all border border-slate-800/40 group">
                            <div className="flex-1 min-w-0 mr-3">
                              <p className="font-medium text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                                {project.title}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                                {new Date(project.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                            </div>
                            <StatusBadge status={project.status as 'draft' | 'processing' | 'completed'} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription */}
              <div className="space-y-5">
                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Plan d&apos;abonnement</h3>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800/40">
                      <div>
                        <p className="text-sm font-semibold text-white">Plan Gratuit</p>
                        <p className="text-[10px] sm:text-xs text-slate-500">Essai gratuit actif</p>
                      </div>
                      <Link href="/pricing">
                        <Button variant="outline" size="xs">
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/40">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Consommation</h3>
                      <span className="text-xs font-bold text-slate-400">
                        {projectLimits?.used || 0}
                        {projectLimits?.limit === -1 ? '' : ` / ${projectLimits?.limit || 0}`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden">
                      {(() => {
                        const used = projectLimits?.used || 0;
                        const limit = projectLimits?.limit || 1;
                        const isUnlimited = limit === -1;
                        const pct = isUnlimited ? 100 : Math.min((used / limit) * 100, 100);
                        const atLimit = projectLimits?.has_reached_limit;
                        const barColor = isUnlimited || isAdmin
                          ? 'from-cyan-500 to-cyan-600'
                          : atLimit
                            ? 'from-red-500 to-red-600'
                            : 'from-emerald-500 to-emerald-600';

                        return (
                          <div
                            className={cn('bg-gradient-to-r h-full rounded-full transition-all duration-500', barColor)}
                            style={{ width: `${pct}%` }}
                          />
                        );
                      })()}
                    </div>

                    <p className="text-[10px] sm:text-xs text-slate-500 mt-2">
                      {isAdmin && projectLimits?.limit === -1
                        ? 'Acces illimite (admin)'
                        : projectLimits?.has_reached_limit
                          ? 'Limite atteinte - passez a un plan superieur'
                          : projectLimits?.remaining === -1
                            ? 'Projets illimites'
                            : `${projectLimits?.remaining || 0} projet${(projectLimits?.remaining || 0) > 1 ? 's' : ''} restant${(projectLimits?.remaining || 0) > 1 ? 's' : ''}`
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
