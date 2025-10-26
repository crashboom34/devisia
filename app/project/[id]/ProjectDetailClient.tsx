'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import type { Project } from '@/lib/supabase';

interface ProjectDetailClientProps {
  projectId: string;
}

export default function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setUser(user);
    loadProject(user.id);
  };

  const loadProject = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        router.push('/dashboard');
        return;
      }
      setProject(data);

      const { data: estimatesData } = await supabase
        .from('estimates')
        .select('*')
        .eq('project_id', projectId)
        .order('scenario_type', { ascending: true });

      if (estimatesData) {
        setEstimates(estimatesData);
      }
    } catch (err) {
      console.error('Error loading project:', err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100">Brouillon</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">En cours</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Terminé</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Aide Devis IA</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            {getStatusBadge(project.status)}
          </div>
          <p className="text-gray-600">
            Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Devis Générés</CardTitle>
                <CardDescription>
                  {estimates.length} devis disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estimates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Aucun devis généré pour l'instant</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {estimates.map((estimate) => {
                      const scenarioLabels: Record<string, { label: string; color: string }> = {
                        eco: { label: 'Scénario Économique', color: 'bg-green-100 text-green-700' },
                        standard: { label: 'Scénario Standard', color: 'bg-blue-100 text-blue-700' },
                        premium: { label: 'Scénario Premium', color: 'bg-amber-100 text-amber-700' },
                      };
                      const scenario = scenarioLabels[estimate.scenario_type] || { label: estimate.scenario_type, color: 'bg-gray-100' };

                      return (
                        <Card key={estimate.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{scenario.label}</CardTitle>
                              <Badge className={scenario.color}>
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                }).format(estimate.total_amount)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600 font-medium mb-3">
                                {estimate.line_items?.length || 0} postes de travaux
                              </p>
                              {estimate.line_items?.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.description}</span>
                                  <span className="text-gray-900 font-medium">
                                    {new Intl.NumberFormat('fr-FR', {
                                      style: 'currency',
                                      currency: 'EUR',
                                    }).format(item.total)}
                                  </span>
                                </div>
                              ))}
                              {estimate.line_items?.length > 3 && (
                                <p className="text-sm text-gray-500 italic">
                                  + {estimate.line_items.length - 3} autres postes
                                </p>
                              )}
                            </div>
                            <Button variant="outline" className="w-full mt-4">
                              Voir le devis détaillé
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" disabled>
                  Modifier le Projet
                </Button>
                <Button variant="outline" className="w-full text-red-600 hover:text-red-700" disabled>
                  Supprimer le Projet
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-blue-900">Prochaines Étapes</h3>
                <ol className="text-sm text-gray-700 space-y-2">
                  <li>1. Sélectionnez votre modèle IA préféré</li>
                  <li>2. Générez des devis selon vos besoins</li>
                  <li>3. Comparez les différents scénarios</li>
                  <li>4. Exportez vos devis</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
