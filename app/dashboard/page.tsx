'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Loader2, TrendingUp, CheckCircle2, Clock, Euro, RefreshCw, Users, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import ModelSelector from '@/components/ModelSelector';
import UserMenu from '@/components/UserMenu';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
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

  const recentActivities = projects.slice(0, 5).map(project => ({
    id: project.id,
    type: project.status === 'completed' ? 'completed' as const : 'created' as const,
    message: project.status === 'completed'
      ? `Projet "${project.title}" terminé`
      : `Projet "${project.title}" créé`,
    timestamp: project.created_at,
    projectId: project.id,
  }));

  const getFirstName = () => {
    if (!user?.email) return 'Utilisateur';
    return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
  };

  const handleRefresh = () => {
    handleRefreshData();
  };

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-30 shadow-2xl">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <Link href="/project/new">
                <Button variant="primary" size="lg">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouveau Devis</span>
                  <span className="sm:hidden">Devis</span>
                </Button>
              </Link>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-lg text-slate-400">
                Bienvenue, {getFirstName()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Admin Plan Simulator */}
        {isAdmin && <AdminPlanSimulator userId={user?.id} />}

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/quotes">
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-cyan-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-900/20 hover:-translate-y-1 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <FileText className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Devis</h3>
                    <p className="text-sm text-slate-400">Gérer vos devis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/invoices">
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-emerald-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-1 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <Receipt className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">Factures</h3>
                    <p className="text-sm text-slate-400">Gérer vos factures</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/clients">
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 hover:border-blue-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-1 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">Clients</h3>
                    <p className="text-sm text-slate-400">Gérer vos clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total des devis (30 derniers jours)"
            value={estimatesCount.total}
            subtitle={`${estimatesCount.completed} approuvés, ${estimatesCount.processing} expirés`}
            icon={FileText}
            iconColor="text-cyan-400"
          />
          <KpiCard
            title="En attente (30 derniers jours)"
            value={estimatesCount.pending}
            valueColor="text-orange-400"
            subtitle="À encaisser"
            icon={Clock}
            iconColor="text-orange-400"
          />
          <KpiCard
            title="Approuvés (30 derniers jours)"
            value={estimatesCount.completed}
            valueColor="text-emerald-400"
            subtitle="Devis acceptés"
            icon={CheckCircle2}
            iconColor="text-emerald-400"
          />
          <KpiCard
            title="Chiffre d'affaires (30 derniers jours)"
            value="0,00 €"
            valueColor="text-cyan-400"
            subtitle="Montants en euros pour les 30 derniers jours"
            icon={Euro}
            iconColor="text-cyan-400"
          />
        </div>

        {/* Chart Section */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-2xl">
          <CardHeader className="border-b border-slate-700/50 pb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-white text-2xl font-bold mb-2">
                  Chiffre d'affaires quotidien
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Montants en euros pour les {chartPeriod === '7days' ? '7' : chartPeriod === '30days' ? '30' : '90'} derniers jours
                </p>
              </div>
              <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
                <Button
                  variant={chartPeriod === '3months' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartPeriod('3months')}
                  className={chartPeriod === '3months'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                >
                  3 derniers mois
                </Button>
                <Button
                  variant={chartPeriod === '30days' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartPeriod('30days')}
                  className={chartPeriod === '30days'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                >
                  30 derniers jours
                </Button>
                <Button
                  variant={chartPeriod === '7days' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartPeriod('7days')}
                  className={chartPeriod === '7days'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                >
                  7 derniers jours
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50">
              <p className="text-slate-400">Aucune donnée de chiffre d'affaires pour le moment</p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotes */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-xl font-bold">Devis récents</CardTitle>
                <Link href="/dashboard/quotes">
                  <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-700/50">
                    Voir tout →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800/50">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 mb-4">Aucun devis récent</p>
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
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 transition-all duration-200 border border-slate-800/50 hover:border-slate-700 group">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">{project.title}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(project.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
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
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl font-bold">Plan d'abonnement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-800/50">
                    <div>
                      <p className="text-white font-semibold text-lg">Plan Gratuit</p>
                      <p className="text-sm text-slate-400">Essai gratuit actif</p>
                    </div>
                    <Link href="/pricing">
                      <Button variant="primary" size="sm">
                        Choisir un plan
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl font-bold">Consommation actuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-400">Projets utilisés</span>
                    <span className="text-lg font-bold text-white">
                      {projectLimits?.used || 0}
                      {projectLimits?.limit === -1 ? ' (Illimité)' : ` / ${projectLimits?.limit || 0}`}
                    </span>
                  </div>

                  {isAdmin ? (
                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-400">Accès Administrateur</span>
                        <span className="text-sm font-bold text-purple-400">Illimité</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full shadow-lg shadow-purple-500/50 animate-pulse" style={{ width: '100%' }}></div>
                      </div>
                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                        Vous avez un accès illimité en tant qu&apos;administrateur
                      </p>
                    </div>
                  ) : projectLimits?.has_reached_limit ? (
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-red-400">Limite atteinte</span>
                        <span className="text-sm font-bold text-red-400">
                          {Math.round(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full shadow-lg shadow-red-500/50"
                          style={{ width: `${Math.min(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                        Passez à un plan supérieur pour continuer à générer des devis
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-emerald-400">Utilisation</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {projectLimits?.limit === -1
                            ? 'Illimité'
                            : `${Math.round(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100)}%`
                          }
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full shadow-lg shadow-emerald-500/50"
                          style={{
                            width: projectLimits?.limit === -1
                              ? '100%'
                              : `${Math.min(((projectLimits?.used || 0) / (projectLimits?.limit || 1)) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                        {projectLimits?.remaining === -1
                          ? 'Projets illimités disponibles'
                          : `${projectLimits?.remaining || 0} projet${(projectLimits?.remaining || 0) > 1 ? 's' : ''} restant${(projectLimits?.remaining || 0) > 1 ? 's' : ''} ce mois`
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
