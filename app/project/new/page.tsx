'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Mic, Keyboard, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import VoiceRecorder from '@/components/VoiceRecorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NewProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'creating' | 'eco' | 'standard' | 'premium' | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');

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

  const getLoadingText = () => {
    switch (loadingStage) {
      case 'creating':
        return 'Création du projet...';
      case 'eco':
        return 'Génération du devis Économique...';
      case 'standard':
        return 'Génération du devis Standard...';
      case 'premium':
        return 'Génération du devis Premium...';
      default:
        return 'Génération des devis...';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStage('creating');

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const scenarios: Array<'eco' | 'standard' | 'premium'> = ['eco', 'standard', 'premium'];

      for (const scenarioType of scenarios) {
        setLoadingStage(scenarioType);

        const response = await fetch(`${supabaseUrl}/functions/v1/generate-estimate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: project.id,
            scenarioType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to generate ${scenarioType} estimate: ${errorData.error}`);
        }

        await response.json();
      }

      router.push(`/project/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Erreur lors de la création du projet: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Projet</h1>
          <p className="text-gray-600">
            Dictez ou écrivez votre projet de construction
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Décrivez Votre Projet</CardTitle>
            <CardDescription>
              Choisissez votre méthode de saisie préférée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'voice' | 'text')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Dictée Vocale
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Saisie Texte
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-6">
                <div className="space-y-3">
                  <Label>Titre du Projet</Label>
                  <VoiceRecorder
                    key={`title-${formData.title}`}
                    initialValue={formData.title}
                    onTranscriptComplete={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Dictez le titre de votre projet"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Description du Projet</Label>
                  <VoiceRecorder
                    key={`description-${formData.description}`}
                    initialValue={formData.description}
                    onTranscriptComplete={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Dictez la description complète de votre projet"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" disabled={loading}>
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className={`flex-1 relative overflow-hidden transition-all ${
                      loading ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        {getLoadingText()}
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                    ) : (
                      'Créer le Projet et Générer les Devis'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Titre du Projet <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="ex: Rénovation maison 100m²"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description du Projet <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre projet en détail : type de travaux, superficie, matériaux souhaités, contraintes particulières..."
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Plus votre description est détaillée, plus les devis générés seront précis.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" disabled={loading}>
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className={`flex-1 relative overflow-hidden transition-all ${
                      loading ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        {getLoadingText()}
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                    ) : (
                      'Créer le Projet et Générer les Devis'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-blue-900">Conseils pour une bonne description</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Précisez le type de travaux (construction, rénovation, extension...)</li>
              <li>• Indiquez les dimensions et surfaces concernées</li>
              <li>• Mentionnez les matériaux et finitions souhaités</li>
              <li>• Signalez les contraintes techniques ou réglementaires</li>
              <li>• Décrivez les équipements à installer</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
