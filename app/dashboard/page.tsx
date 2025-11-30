'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Loader2, TrendingUp, CheckCircle2, Clock, Euro, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import ModelSelector from '@/components/ModelSelector';
import UserMenu from '@/components/UserMenu';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/dashboard/PageHeader';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatesCount, setEstimatesCount] = useState({ total: 0, completed: 0, processing: 0, pending: 0 });
  const [chartPeriod, setChartPeriod] = useState<'7days' | '30days' | '3months'>('30days');

  useEffect(() => {
    checkUser();
    loadProjects();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      const { data: estimates } = await supabase
        .from('estimates')
        .select('id, scenario_type')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (estimates) {
        setEstimatesCount({
          total: estimates.length,
          completed: estimates.filter(e => e.scenario_type).length,
          processing: data?.filter(p => p.status === 'processing').length || 0,
          pending: data?.filter(p => p.status === 'draft').length || 0,
        });
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
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
    loadProjects();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">Devisia</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/project/new">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm font-medium">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouveau Devis</span>
                <span className="sm:hidden">Devis</span>
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Page Header */}
        <PageHeader
          title="Tableau de bord"
          subtitle={`Bienvenue, ${getFirstName()}`}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Total des devis (30 derniers jours)"
            value={estimatesCount.total}
            subtitle={`${estimatesCount.completed} approuvés, ${estimatesCount.processing} expirés`}
            icon={FileText}
          />
          <KpiCard
            title="En attente (30 derniers jours)"
            value={estimatesCount.pending}
            valueColor="text-orange-400"
            subtitle="À encaisser"
            icon={Clock}
          />
          <KpiCard
            title="Approuvés (30 derniers jours)"
            value={estimatesCount.completed}
            valueColor="text-green-400"
            subtitle="Devis acceptés"
            icon={CheckCircle2}
          />
          <KpiCard
            title="Chiffre d'affaires (30 derniers jours)"
            value="0,00 €"
            valueColor="text-cyan-400"
            subtitle="Montants en euros pour les 30 derniers jours"
            icon={Euro}
          />
        </div>

        {/* Chart Section */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-white text-xl">
                Chiffre d'affaires quotidien
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartPeriod === '3months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartPeriod('3months')}
                  className={chartPeriod === '3months'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                  }
                >
                  3 derniers mois
                </Button>
                <Button
                  variant={chartPeriod === '30days' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartPeriod('30days')}
                  className={chartPeriod === '30days'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                  }
                >
                  30 derniers jours
                </Button>
                <Button
                  variant={chartPeriod === '7days' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartPeriod('7days')}
                  className={chartPeriod === '7days'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                  }
                >
                  7 derniers jours
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Montants en euros pour les {chartPeriod === '7days' ? '7' : chartPeriod === '30days' ? '30' : '90'} derniers jours
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 flex items-center justify-center text-slate-500">
              <p>Aucune donnée de chiffre d'affaires pour le moment</p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Quotes */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Devis récents</span>
                <Link href="/project/new">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre premier devis
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">Aucun devis récent</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <Link key={project.id} href={`/project/${project.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900 hover:bg-slate-850 transition-colors border border-slate-700 hover:border-slate-600">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{project.title}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(project.created_at).toLocaleDateString('fr-FR')}
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
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Plan d'abonnement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Plan Gratuit</p>
                      <p className="text-sm text-slate-400">Essai gratuit actif</p>
                    </div>
                    <Link href="/pricing">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        Choisir un plan
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Consommation actuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Devis générés</span>
                      <span className="text-sm font-medium text-white">{estimatesCount.total}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Limite atteinte</span>
                      <span className="text-sm font-medium text-red-400">100%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Passez à un plan supérieur pour continuer à générer des devis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
