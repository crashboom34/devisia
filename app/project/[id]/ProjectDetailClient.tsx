'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Loader2, Pencil, Trash2, ChevronDown, ChevronUp, Sparkles, Camera } from 'lucide-react';
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
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { toast } from 'sonner';

const EstimateTable = dynamic(() => import('@/components/EstimateTable'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-800 rounded-lg" />,
});

const ProjectRoomsPhotos = dynamic(() => import('@/components/ProjectRoomsPhotos'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-800 rounded-lg" />,
});
import type { Project } from '@/lib/supabase';

interface ProjectDetailClientProps {
  projectId: string;
}

export default function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  const [project, setProject] = useState<Project | null>(null);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEstimate, setExpandedEstimate] = useState<string | null>(null);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set(['eco']));
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteEstimateDialog, setShowDeleteEstimateDialog] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingEstimate, setIsDeletingEstimate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProject(user.id);
  }, [authLoading, user]);

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
      toast.error('Erreur lors de la mise à jour du projet');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleScenario = (scenarioType: string) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(scenarioType)) {
      newExpanded.delete(scenarioType);
    } else {
      newExpanded.add(scenarioType);
    }
    setExpandedScenarios(newExpanded);
  };

  const getScenarioLabel = (type: string) => {
    switch (type) {
      case 'eco': return 'Scénario Économique';
      case 'standard': return 'Scénario Standard';
      case 'premium': return 'Scénario Premium';
      default: return type;
    }
  };

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'eco': return 'bg-green-100 text-green-800 border-green-300';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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
      toast.error('Erreur lors de la suppression du projet');
      setIsDeleting(false);
    }
  };

  const handleDeleteEstimate = async () => {
    if (!estimateToDelete) return;

    setIsDeletingEstimate(true);
    try {
      const { error } = await supabase
        .from('estimates')
        .delete()
        .eq('id', estimateToDelete);

      if (error) throw error;

      setEstimates(estimates.filter(e => e.id !== estimateToDelete));
      setShowDeleteEstimateDialog(false);
      setEstimateToDelete(null);
    } catch (err) {
      console.error('Error deleting estimate:', err);
      toast.error('Erreur lors de la suppression du scénario');
    } finally {
      setIsDeletingEstimate(false);
    }
  };

  const confirmDeleteEstimate = (estimateId: string) => {
    setEstimateToDelete(estimateId);
    setShowDeleteEstimateDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <header className="bg-brand-darkCard border-b border-gray-800 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 text-gray-300 hover:text-white hover:bg-brand-darkLight">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-brand-green">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0" />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-white truncate">Devisia</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <h1 className="text-xl sm:text-3xl font-bold text-white break-words">{project.title}</h1>
            {getStatusBadge(project.status)}
          </div>
          <p className="text-sm sm:text-base text-gray-400">
            Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Tabs defaultValue="infos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-brand-darkCard border-gray-800">
                <TabsTrigger value="infos" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Infos
                </TabsTrigger>
                <TabsTrigger value="devis" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Devis
                </TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">
                  <Camera className="h-4 w-4 mr-2" />
                  Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="infos" className="space-y-4">
                <Card className="bg-brand-darkCard border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Description du Projet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 whitespace-pre-wrap">{project.description}</p>
                  </CardContent>
                </Card>

                {project.client_name && (
                  <Card className="bg-brand-darkCard border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Informations Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.client_name && (
                        <div>
                          <span className="font-medium text-gray-300">Client :</span>{' '}
                          <span className="text-gray-400">{project.client_name}</span>
                        </div>
                      )}
                      {project.client_address && (
                        <div>
                          <span className="font-medium text-gray-300">Adresse :</span>{' '}
                          <span className="text-gray-400 whitespace-pre-wrap">{project.client_address}</span>
                        </div>
                      )}
                      {project.work_type && (
                        <div>
                          <span className="font-medium text-gray-300">Type de travaux :</span>{' '}
                          <span className="text-gray-400">{project.work_type}</span>
                        </div>
                      )}
                      {project.notes && (
                        <div>
                          <span className="font-medium text-gray-300">Notes :</span>{' '}
                          <span className="text-gray-400 whitespace-pre-wrap">{project.notes}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {estimates.length === 0 && (
                  <Card className="bg-brand-green/10 border-brand-green/30">
                    <CardContent className="py-8 text-center">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-brand-green" />
                      <h3 className="font-semibold mb-2 text-white">Aucun devis généré</h3>
                      <p className="text-sm text-gray-300 mb-4">
                        Générez vos premiers devis avec l'IA pour ce projet
                      </p>
                      <Link href="/project/new">
                        <Button className="bg-brand-green hover:bg-green-600 text-white">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Générer des Devis
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="devis" className="space-y-4">

            {estimates.length === 0 ? (
              <Card className="bg-brand-darkCard border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Devis Générés</CardTitle>
                  <CardDescription className="text-gray-400">Aucun devis disponible</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Aucun devis généré pour l'instant</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Devis Générés</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const uniqueScenarios = new Set(estimates.map(e => e.scenario_type));
                      if (expandedScenarios.size === uniqueScenarios.size) {
                        setExpandedScenarios(new Set());
                      } else {
                        setExpandedScenarios(uniqueScenarios);
                      }
                    }}
                    className="text-xs border-gray-700 text-gray-300 hover:bg-brand-darkCard"
                  >
                    {expandedScenarios.size === new Set(estimates.map(e => e.scenario_type)).size ? 'Tout replier' : 'Tout déplier'}
                  </Button>
                </div>
                {estimates.map((estimate) => {
                  const isExpanded = expandedScenarios.has(estimate.scenario_type);
                  return (
                    <div key={estimate.id} className="border border-gray-800 bg-brand-darkCard rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleScenario(estimate.scenario_type)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-darkLight transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full border ${getScenarioColor(estimate.scenario_type)}`}>
                            {getScenarioLabel(estimate.scenario_type)}
                          </div>
                          <span className="font-bold text-lg text-white">
                            {(estimate.total_ttc || estimate.total_amount || 0).toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            })}
                          </span>
                          {estimate.model_used && (
                            <span className="text-xs text-gray-500 hidden sm:inline">
                              • {estimate.model_used}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteEstimate(estimate.id);
                            }}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-800">
                          <EstimateTable
                            estimate={{
                              id: estimate.id,
                              scenario_type: estimate.scenario_type,
                              estimate_number: estimate.estimate_number,
                              client_name: estimate.client_name,
                              estimate_date: estimate.estimate_date,
                              validity_days: estimate.validity_days,
                              payment_terms: estimate.payment_terms,
                              execution_delay: estimate.execution_delay,
                              deposit_required: estimate.deposit_required,
                              special_conditions: estimate.special_conditions,
                              categories: estimate.categories || [],
                              total_ht: estimate.total_ht || 0,
                              total_tva: estimate.total_tva || 0,
                              total_ttc: estimate.total_ttc || estimate.total_amount || 0,
                              discount_amount: estimate.discount_amount,
                              discount_percent: estimate.discount_percent,
                              model_used: estimate.model_used,
                              scenario_justification: estimate.scenario_justification,
                            }}
                            projectTitle={project.title}
                            projectDescription={project.description}
                            onRegenerate={() => user && loadProject(user.id)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
              </TabsContent>

              <TabsContent value="photos">
                <ProjectRoomsPhotos projectId={projectId} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-brand-darkCard border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button
                  variant="outline"
                  className="w-full text-sm sm:text-base border-gray-700 text-gray-300 hover:bg-brand-darkLight"
                  onClick={handleEditProject}
                >
                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Modifier le Projet
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/50 text-sm sm:text-base"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Supprimer le Projet
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-brand-green/10 border-brand-green/30">
              <CardContent className="pt-4 sm:pt-6">
                <h3 className="font-semibold mb-2 text-brand-green text-sm sm:text-base">Prochaines Étapes</h3>
                <ol className="text-xs sm:text-sm text-gray-300 space-y-1 sm:space-y-2">
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
        <DialogContent className="sm:max-w-[600px] bg-brand-darkCard border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier le Projet</DialogTitle>
            <DialogDescription className="text-gray-400">
              Mettez à jour les informations de votre projet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Titre du projet</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex: Rénovation salle de bain"
                className="bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Décrivez votre projet en détail..."
                rows={8}
                className="bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
              className="border-gray-700 text-gray-300 hover:bg-brand-darkLight"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isSaving || !editTitle.trim() || !editDescription.trim()}
              className="bg-brand-green hover:bg-green-600 text-white"
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
        <AlertDialogContent className="bg-brand-darkCard border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Cette action est irréversible. Le projet et tous ses devis seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-gray-700 text-gray-300 hover:bg-brand-darkLight">Annuler</AlertDialogCancel>
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

      <AlertDialog open={showDeleteEstimateDialog} onOpenChange={setShowDeleteEstimateDialog}>
        <AlertDialogContent className="bg-brand-darkCard border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer ce scénario?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Cette action est irréversible. Ce devis sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingEstimate} className="border-gray-700 text-gray-300 hover:bg-brand-darkLight">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEstimate}
              disabled={isDeletingEstimate}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingEstimate ? (
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
