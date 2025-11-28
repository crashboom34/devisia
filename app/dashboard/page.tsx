'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import ModelSelector from '@/components/ModelSelector';
import UserMenu from '@/components/UserMenu';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">Brouillon</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs rounded bg-blue-200 text-blue-700">En cours</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded bg-green-200 text-green-700">Terminé</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            <span className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Aide Devis IA</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Mes Projets</h1>
            <p className="text-sm sm:text-base text-gray-600 truncate">
              {user?.email}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link href="/project/create" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Créer un Projet
              </Button>
            </Link>
            <Link href="/project/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Projet + Devis
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent className="px-3 sm:px-6">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun projet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Créez votre premier projet pour générer des devis
                  </p>
                  <Link href="/project/new" className="inline-block">
                    <Button size="lg" className="text-sm sm:text-base">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Créer un projet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <CardTitle className="text-base sm:text-lg flex-1 break-words">{project.title}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 mb-3 sm:mb-4">
                      {project.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
              </div>
            )}
          </div>
          <div className="lg:sticky lg:top-20">
            <ModelSelector />
          </div>
        </div>
      </main>
    </div>
  );
}
