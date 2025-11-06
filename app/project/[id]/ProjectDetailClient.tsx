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
import EstimateTable from '@/components/EstimateTable';
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

            {estimates.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Devis Générés</CardTitle>
                  <CardDescription>Aucun devis disponible</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Aucun devis généré pour l'instant</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {estimates.map((estimate) => (
                  <EstimateTable
                    key={estimate.id}
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
                    }}
                    projectTitle={project.title}
                  />
                ))}
              </div>
            )}
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
