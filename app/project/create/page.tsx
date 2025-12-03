'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Save, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import { toast } from 'sonner';

export default function CreateProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientName: '',
    clientAddress: '',
    workType: '',
    notes: '',
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Le titre du projet est requis');
      return;
    }

    setSaving(true);

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          client_name: formData.clientName,
          client_address: formData.clientAddress,
          work_type: formData.workType,
          notes: formData.notes,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Projet créé avec succès');
      router.push(`/project/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      toast.error('Erreur lors de la création du projet');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">Nouveau Projet</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Créer un projet</CardTitle>
            <CardDescription>
              Créez un projet sans générer de devis immédiatement. Vous pourrez ajouter des photos et générer des devis plus tard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre du Projet <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Rénovation maison 100m²"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description du Projet</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre projet en détail..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nom du Client</Label>
                  <Input
                    id="client-name"
                    placeholder="Ex: M. Dupont"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work-type">Type de Travaux</Label>
                  <Input
                    id="work-type"
                    placeholder="Ex: Rénovation, Extension, Construction..."
                    value={formData.workType}
                    onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-address">Adresse du Chantier</Label>
                <Textarea
                  id="client-address"
                  placeholder="Adresse complète du chantier..."
                  rows={3}
                  value={formData.clientAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Remarques</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes diverses, contraintes particulières..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/dashboard" className="w-full sm:flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={saving}>
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={saving} className="w-full sm:flex-1">
                  {saving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer le Projet
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Vous pourrez ensuite :</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Ajouter des pièces et des photos avec dimensions</li>
                      <li>Générer des devis à la demande avec l'IA</li>
                      <li>Modifier et compléter les informations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
