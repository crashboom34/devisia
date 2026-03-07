'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Loader2, CheckCircle2, Clock, Euro, RefreshCw, Users, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import { StatusBadge } from '@/components/ui/status-badge';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Sidebar } from '@/components/Sidebar';
import AdminPlanSimulator from '@/components/AdminPlanSimulator';
import { checkProjectLimit, isUserAdmin, type ProjectLimitInfo } from '@/lib/subscription-helper';

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

      <div className="flex-1 lg:ml-64">
        <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-30 shadow-2xl">
          <div className="px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-end gap-3">
            <Link href="/project/new">
              <Button variant="primary" size="sm" className="lg:text-base">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau Devis</span>
                <span className="sm:hidden">Devis</span>
              </Button>
            </Link>
            <UserMenu />
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
          {/* Page Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-slate-400 mt-1">
                Bienvenue, {getFirstName()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>

          {isAdmin && <AdminPlanSimulator userId={user?.id} />}

          {/* Quick Navigation */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            <Link href="/dashboard/quotes">
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-cyan-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-900/20 hover:-translate-y-1 cursor-pointer group h-full">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Devis</h3>
                      <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Gérer vos devis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/invoices">
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-emerald-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-1 cursor-pointer group h-full">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                      <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">Factures</h3>
                      <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Gérer vos factures</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/clients">
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-1 cursor-pointer group h-full">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">Clients</h3>
                      <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Gérer vos clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <KpiCard
              title="Total devis"
              value={estimatesCount.total}
              subtitle={`${estimatesCount.completed} approuvés`}
              icon={FileText}
              iconColor="text-cyan-400"
            />
            <KpiCard
              title="En attente"
              value={estimatesCount.pending}
              valueColor="text-orange-400"
              subtitle="A encaisser"
              icon={Clock}
              iconColor="text-orange-400"
            />
            <KpiCard
              title="Approuvés"
              value={estimatesCount.completed}
              valueColor="text-emerald-400"
              subtitle="Devis acceptés"
              icon={CheckCircle2}
              iconColor="text-emerald-400"
            />
            <KpiCard
              title="Chiffre d'affaires"
              value="0,00 EUR"
              valueColor="text-cyan-400"
              subtitle="30 derniers jours"
              icon={Euro}
              iconColor="text-cyan-400"
            />
          </div>

          {/* Chart Section */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-2xl">
            <CardHeader className="border-b border-slate-700/50 p-4 sm:p-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-white text-lg sm:text-xl lg:text-2xl font-bold mb-1">
                    Chiffre d&apos;affaires quotidien
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Montants en euros - {chartPeriod === '7days' ? '7' : chartPeriod === '30days' ? '30' : '90'} derniers jours
                  </p>
                </div>
                <div className="flex gap-1.5 bg-slate-900/50 p-1 sm:p-1.5 rounded-xl border border-slate-700/50 self-start">
                  {[
                    { key: '3months' as const, label: '3M', fullLabel: '3 mois' },
                    { key: '30days' as const, label: '30J', fullLabel: '30 jours' },
                    { key: '7days' as const, label: '7J', fullLabel: '7 jours' },
                  ].map((period) => (
                    <Button
                      key={period.key}
                      variant={chartPeriod === period.key ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setChartPeriod(period.key)}
                      className={cn(
                        'text-xs sm:text-sm px-2.5 sm:px-3 py-1.5',
                        chartPeriod === period.key
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      )}
                    >
                      <span className="sm:hidden">{period.label}</span>
                      <span className="hidden sm:inline">{period.fullLabel}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-48 sm:h-56 lg:h-64 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50">
                <p className="text-sm sm:text-base text-slate-400">Aucune donnée pour le moment</p>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Quotes */}
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg sm:text-xl font-bold">Devis récents</CardTitle>
                  <Link href="/dashboard/quotes">
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50 text-xs sm:text-sm">
                      Voir tout
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 bg-slate-900/30 rounded-xl border border-slate-800/50">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-500" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-400 mb-3 sm:mb-4">Aucun devis récent</p>
                    <Link href="/project/new">
                      <Button variant="primary" size="sm">
                        <Plus className="h-4 w-4" />
                        Créer votre premier devis
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <Link key={project.id} href={`/project/${project.id}`}>
                        <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-all duration-200 border border-slate-800/50 hover:border-slate-700 group">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-semibold text-sm sm:text-base text-white truncate group-hover:text-cyan-400 transition-colors">{project.title}</p>
                            <p className="text-xs sm:text-sm text-slate-500">
                              {new Date(project.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
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

            {/* Subscription Plan */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-white text-lg sm:text-xl font-bold">Plan d&apos;abonnement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-base sm:text-lg">Plan Gratuit</p>
                      <p className="text-xs sm:text-sm text-slate-400">Essai gratuit actif</p>
                    </div>
                    <Link href="/pricing" className="shrink-0">
                      <Button variant="primary" size="sm">
                        <span className="hidden sm:inline">Choisir un plan</span>
                        <span className="sm:hidden">Upgrade</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-white text-lg sm:text-xl font-bold">Consommation actuelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-xs sm:text-sm font-medium text-slate-400">Projets utilisés</span>
                      <span className="text-sm sm:text-lg font-bold text-white">
                        {projectLimits?.used || 0}
                        {projectLimits?.limit === -1 ? ' (Illimité)' : ` / ${projectLimits?.limit || 0}`}
                      </span>
                    </div>

                    {isAdmin && projectLimits?.limit === -1 ? (
                      <div className="p-3 sm:p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs sm:text-sm font-medium text-cyan-400">Accès Administrateur</span>
                          <span className="text-xs sm:text-sm font-bold text-cyan-400">Illimité</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 sm:h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-full rounded-full shadow-lg shadow-cyan-500/50 animate-pulse" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 sm:mt-3 leading-relaxed">
                          Accès illimité en tant qu&apos;administrateur
                        </p>
                      </div>
                    ) : projectLimits?.has_reached_limit ? (
                      <div className="p-3 sm:p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs sm:text-sm font-medium text-red-400">Limite atteinte</span>
                          <span className="text-xs sm:text-sm font-bold text-red-400">
                            {Math.round(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 sm:h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full shadow-lg shadow-red-500/50"
                            style={{ width: `${Math.min(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 sm:mt-3 leading-relaxed">
                          Passez à un plan supérieur pour continuer
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs sm:text-sm font-medium text-emerald-400">Utilisation</span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">
                            {projectLimits?.limit === -1
                              ? 'Illimité'
                              : `${Math.round(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100)}%`
                            }
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 sm:h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full shadow-lg shadow-emerald-500/50"
                            style={{
                              width: projectLimits?.limit === -1
                                ? '100%'
                                : `${Math.min(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 sm:mt-3 leading-relaxed">
                          {projectLimits?.remaining === -1
                            ? 'Projets illimités disponibles'
                            : `${projectLimits?.remaining || 0} projet${(projectLimits?.remaining || 0) > 1 ? 's' : ''} restant${(projectLimits?.remaining || 0) > 1 ? 's' : ''}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
