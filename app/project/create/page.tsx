'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageLoading } from '@/components/dashboard/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function CreateProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientName: '',
    clientAddress: '',
    workType: '',
    notes: '',
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Le titre du projet est requis');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          client_name: formData.clientName.trim(),
          client_address: formData.clientAddress.trim(),
          work_type: formData.workType.trim(),
          notes: formData.notes.trim(),
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Projet créé avec succès');
      router.push(`/project/${project.id}`);
    } catch (saveError) {
      console.error('Error creating project:', saveError);
      toast.error('Erreur lors de la création du projet');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout showNewQuoteButton={false}>
        <PageContainer>
          <PageLoading label={authLoading ? 'Vérification de votre accès…' : 'Redirection…'} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <PageContainer className="max-w-4xl">
        <PageHeader
          title="Créer un dossier"
          subtitle="Enregistrez les informations du chantier sans lancer immédiatement la génération."
          breadcrumbs={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Nouveau dossier' },
          ]}
        />

        <Card className="border-border bg-surface shadow-panel">
          <CardHeader className="border-b border-border p-5 sm:p-6">
            <CardTitle className="text-xl text-foreground">Informations du chantier</CardTitle>
            <CardDescription className="leading-6 text-muted-foreground">
              Le titre suffit pour commencer. Les autres informations pourront être complétées depuis le dossier.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSave} className="space-y-7">
              <fieldset className="space-y-5">
                <legend className="text-sm font-semibold text-foreground">Projet</legend>
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Titre du projet <span className="text-danger" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex. Rénovation maison 100 m²"
                    value={formData.title}
                    onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                    required
                    aria-required="true"
                    autoComplete="off"
                    className="h-11 bg-surface-elevated"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description du projet</Label>
                  <Textarea
                    id="description"
                    placeholder="Travaux prévus, surface, matériaux et contraintes…"
                    rows={5}
                    value={formData.description}
                    onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-32 bg-surface-elevated"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="work-type">Type de travaux</Label>
                    <Input
                      id="work-type"
                      placeholder="Rénovation, extension…"
                      value={formData.workType}
                      onChange={(event) => setFormData((current) => ({ ...current, workType: event.target.value }))}
                      className="h-11 bg-surface-elevated"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nom du client</Label>
                    <Input
                      id="client-name"
                      placeholder="M. Dupont"
                      value={formData.clientName}
                      onChange={(event) => setFormData((current) => ({ ...current, clientName: event.target.value }))}
                      autoComplete="name"
                      className="h-11 bg-surface-elevated"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-5 border-t border-border pt-7">
                <legend className="text-sm font-semibold text-foreground">Lieu et notes</legend>
                <div className="space-y-2">
                  <Label htmlFor="client-address">Adresse du chantier</Label>
                  <Textarea
                    id="client-address"
                    placeholder="Adresse complète du chantier"
                    rows={3}
                    value={formData.clientAddress}
                    onChange={(event) => setFormData((current) => ({ ...current, clientAddress: event.target.value }))}
                    autoComplete="street-address"
                    className="bg-surface-elevated"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes et contraintes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Accès, délais, contraintes techniques…"
                    rows={4}
                    value={formData.notes}
                    onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                    className="bg-surface-elevated"
                  />
                </div>
              </fieldset>

              <div className="rounded-xl border border-info/30 bg-info/10 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Après l’enregistrement</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Vous pourrez ajouter les pièces, les photos et les dimensions avant de générer les devis.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <Button asChild type="button" variant="outline" disabled={saving} className="sm:min-w-32">
                  <Link href="/dashboard">Annuler</Link>
                </Button>
                <Button type="submit" disabled={saving || !formData.title.trim()} className="sm:min-w-48">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  {saving ? 'Enregistrement…' : 'Enregistrer le dossier'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}
