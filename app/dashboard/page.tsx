'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Loader2, TrendingUp, CheckCircle2, Clock, Euro } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import ModelSelector from '@/components/ModelSelector';
import UserMenu from '@/components/UserMenu';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatesCount, setEstimatesCount] = useState({ total: 0, completed: 0, processing: 0 });

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

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-brand-green">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-brand-dark">Devisia</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/project/new">
              <Button className="bg-brand-green hover:bg-green-600 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Créer un Devis</span>
                <span className="sm:hidden">Devis</span>
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-2">
            Bonjour {getFirstName()} 👋
          </h1>
          <p className="text-base sm:text-lg text-status-neutral">
            Suivez vos devis et projets en un coup d'œil
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Projets Total"
            value={projects.length}
            icon={FileText}
            trend={projects.length > 0 ? { value: '+' + projects.length, isPositive: true } : undefined}
            description="Tous vos projets"
          />
          <StatCard
            title="Devis Générés"
            value={estimatesCount.total}
            icon={CheckCircle2}
            description="Devis créés par IA"
          />
          <StatCard
            title="En Cours"
            value={estimatesCount.processing}
            icon={Clock}
            description="Projets actifs"
          />
          <StatCard
            title="Terminés"
            value={projects.filter(p => p.status === 'completed').length}
            icon={TrendingUp}
            trend={projects.filter(p => p.status === 'completed').length > 0
              ? { value: '100%', isPositive: true }
              : undefined}
            description="Projets complétés"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-brand-dark">Mes Projets</h2>
              <div className="flex gap-2">
                <Link href="/project/create">
                  <Button size="sm" variant="outline" className="text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Projet Simple
                  </Button>
                </Link>
                <Link href="/project/new">
                  <Button size="sm" className="bg-brand-green hover:bg-green-600 text-white text-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Projet + Devis
                  </Button>
                </Link>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="text-center py-12 sm:py-16 animate-fade-in">
                <CardContent className="px-6">
                  <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-brand-green" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-2">Aucun projet</h3>
                  <p className="text-base text-status-neutral mb-6">
                    Créez votre premier projet pour générer des devis professionnels
                  </p>
                  <Link href="/project/new" className="inline-block">
                    <Button size="lg" className="bg-brand-green hover:bg-green-600 text-white">
                      <Plus className="h-5 w-5 mr-2" />
                      Créer un projet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project, index) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full border-gray-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg font-semibold text-brand-dark flex-1 break-words">
                        {project.title}
                      </CardTitle>
                      <StatusBadge status={project.status as 'draft' | 'processing' | 'completed'} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-status-neutral line-clamp-3 mb-4">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-status-neutral">
                      <span>
                        {new Date(project.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-brand-green font-medium hover:underline">
                        Voir le projet →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <ActivityTimeline activities={recentActivities} />
            <div className="lg:sticky lg:top-24">
              <ModelSelector />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
