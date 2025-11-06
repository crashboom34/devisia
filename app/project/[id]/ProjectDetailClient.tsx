'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [expandedEstimate, setExpandedEstimate] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleEditProject = () => {
    if (project) {
      setEditTitle(project.title);
      setEditDescription(project.description);
      setShowEditDialog(true);
    }
  };

  const handleSaveProject = async () => {
    if (!project || !editTitle.trim() || !editDescription.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      setProject({
        ...project,
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setShowEditDialog(false);
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Erreur lors de la mise à jour du projet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    setIsDeleting(true);
    try {
      const { error: estimatesError } = await supabase
        .from('estimates')
        .delete()
        .eq('project_id', project.id);

      if (estimatesError) throw estimatesError;

      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (projectError) throw projectError;

      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Erreur lors de la suppression du projet');
      setIsDeleting(false);
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

                      const isExpanded = expandedEstimate === estimate.id;

                      const categories = estimate.categories || [];
                      const hasCategories = categories.length > 0;

                      const groupedByCategory: Record<string, any[]> = {};
                      if (!hasCategories && estimate.line_items) {
                        estimate.line_items.forEach((item: any) => {
                          const cat = item.category || 'Autres';
                          if (!groupedByCategory[cat]) {
                            groupedByCategory[cat] = [];
                          }
                          groupedByCategory[cat].push(item);
                        });
                      }

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
                            {!isExpanded ? (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600 font-medium mb-3">
                                  {hasCategories ? categories.length : Object.keys(groupedByCategory).length} catégories • {estimate.line_items?.length || 0} postes de travaux
                                </p>
                                {hasCategories ? (
                                  categories.slice(0, 3).map((cat: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm py-2 border-b">
                                      <span className="text-gray-700 font-medium">{cat.name}</span>
                                      <span className="text-gray-900 font-medium">
                                        {new Intl.NumberFormat('fr-FR', {
                                          style: 'currency',
                                          currency: 'EUR',
                                        }).format(cat.subtotal)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  Object.entries(groupedByCategory).slice(0, 3).map(([catName, items]: [string, any], idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm py-2 border-b">
                                      <span className="text-gray-700 font-medium">{catName}</span>
                                      <span className="text-gray-900 font-medium">
                                        {items.length} postes
                                      </span>
                                    </div>
                                  ))
                                )}
                                {((hasCategories && categories.length > 3) || (!hasCategories && Object.keys(groupedByCategory).length > 3)) && (
                                  <p className="text-sm text-gray-500 italic pt-2">
                                    + {hasCategories ? categories.length - 3 : Object.keys(groupedByCategory).length - 3} autres catégories
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {hasCategories ? (
                                  categories.map((cat: any, catIdx: number) => (
                                    <div key={catIdx} className="border-l-4 border-blue-500 pl-4">
                                      <div className="mb-3">
                                        <h3 className="text-lg font-bold text-gray-900">{cat.name}</h3>
                                        {cat.description && (
                                          <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        {cat.items?.map((item: any, itemIdx: number) => (
                                          <div key={itemIdx} className="bg-gray-50 rounded p-3">
                                            <div className="flex justify-between items-start">
                                              <div className="flex-1">
                                                <p className="font-medium text-gray-900">{item.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {item.quantity} {item.unit} × {new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                  }).format(item.unit_price)}
                                                </p>
                                              </div>
                                              <span className="text-gray-900 font-bold ml-4">
                                                {new Intl.NumberFormat('fr-FR', {
                                                  style: 'currency',
                                                  currency: 'EUR',
                                                }).format(item.total)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex justify-between items-center mt-3 pt-3 border-t-2">
                                        <span className="font-bold text-gray-700">Sous-total {cat.name}</span>
                                        <span className="font-bold text-blue-600">
                                          {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: 'EUR',
                                          }).format(cat.subtotal)}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  Object.entries(groupedByCategory).map(([catName, items]: [string, any], catIdx: number) => {
                                    const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
                                    return (
                                      <div key={catIdx} className="border-l-4 border-blue-500 pl-4">
                                        <div className="mb-3">
                                          <h3 className="text-lg font-bold text-gray-900">{catName}</h3>
                                          {items[0]?.category_description && (
                                            <p className="text-sm text-gray-600 mt-1">{items[0].category_description}</p>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          {items.map((item: any, itemIdx: number) => (
                                            <div key={itemIdx} className="bg-gray-50 rounded p-3">
                                              <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                  <p className="font-medium text-gray-900">{item.description}</p>
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    {item.quantity} {item.unit} × {new Intl.NumberFormat('fr-FR', {
                                                      style: 'currency',
                                                      currency: 'EUR',
                                                    }).format(item.unit_price)}
                                                  </p>
                                                </div>
                                                <span className="text-gray-900 font-bold ml-4">
                                                  {new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                  }).format(item.total)}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t-2">
                                          <span className="font-bold text-gray-700">Sous-total {catName}</span>
                                          <span className="font-bold text-blue-600">
                                            {new Intl.NumberFormat('fr-FR', {
                                              style: 'currency',
                                              currency: 'EUR',
                                            }).format(subtotal)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                                <div className="pt-4 mt-4 border-t-4 border-gray-900 bg-blue-50 rounded p-4">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900">TOTAL GÉNÉRAL</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                      {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: 'EUR',
                                      }).format(estimate.total_amount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={() => setExpandedEstimate(isExpanded ? null : estimate.id)}
                            >
                              {isExpanded ? 'Masquer les détails' : 'Voir le devis détaillé'}
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEditProject}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier le Projet
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
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

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le Projet</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de votre projet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du projet</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex: Rénovation salle de bain"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Décrivez votre projet en détail..."
                rows={8}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isSaving || !editTitle.trim() || !editDescription.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet et tous ses devis seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
