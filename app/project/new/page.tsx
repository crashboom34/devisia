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
import ModelSelector from '@/components/ModelSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

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
  const [temperature, setTemperature] = useState(0.5);

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
            projectDescription: formData.description,
            scenarioType,
            temperature,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to generate ${scenarioType} estimate: ${errorData.error}`);
        }

        await response.json();
      }

      // Marquer le projet comme terminé après génération de tous les devis
      await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', project.id);

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
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <span className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Aide Devis IA</span>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Nouveau Projet</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Dictez ou écrivez votre projet de construction
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Décrivez Votre Projet</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choisissez votre méthode de saisie préférée
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'voice' | 'text')}>
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="voice" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Dictée Vocale</span>
                  <span className="xs:hidden">Voix</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Saisie Texte</span>
                  <span className="xs:hidden">Texte</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base">Titre du Projet</Label>
                  <VoiceRecorder
                    value={formData.title}
                    onChange={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Dictez le titre de votre projet"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base">Description du Projet</Label>
                  <VoiceRecorder
                    value={formData.description}
                    onChange={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Dictez la description complète de votre projet"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Link href="/dashboard" className="w-full sm:flex-1">
                    <Button type="button" variant="outline" className="w-full text-sm sm:text-base" disabled={loading}>
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className={`w-full sm:flex-1 relative overflow-hidden transition-all text-sm sm:text-base ${
                      loading ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-1 sm:gap-2">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{getLoadingText()}</span>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                      </span>
                    ) : (
                      <span className="text-xs sm:text-base">Créer et Générer les Devis</span>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm sm:text-base">
                    Titre du Projet <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="ex: Rénovation maison 100m²"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm sm:text-base">
                    Description du Projet <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre projet en détail : type de travaux, superficie, matériaux souhaités, contraintes particulières..."
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-500">
                    Plus votre description est détaillée, plus les devis générés seront précis.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Link href="/dashboard" className="w-full sm:flex-1">
                    <Button type="button" variant="outline" className="w-full text-sm sm:text-base" disabled={loading}>
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className={`w-full sm:flex-1 relative overflow-hidden transition-all text-sm sm:text-base ${
                      loading ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_100%] animate-gradient' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-1 sm:gap-2">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">{getLoadingText()}</span>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                      </span>
                    ) : (
                      <span className="text-xs sm:text-base">Créer et Générer les Devis</span>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 sm:mt-6">
          <ModelSelector />
        </div>

        <Card className="mt-4 sm:mt-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              Créativité de l'IA
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Ajustez la créativité du modèle (0 = précis et conservateur, 1 = créatif et varié)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Température: {temperature.toFixed(2)}</span>
                <span className="text-gray-500">
                  {temperature < 0.3 ? '❄️ Très conservateur' :
                   temperature < 0.5 ? '🧊 Conservateur' :
                   temperature < 0.7 ? '⚖️ Équilibré' :
                   temperature < 0.9 ? '🔥 Créatif' :
                   '🌟 Très créatif'}
                </span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(value) => setTemperature(value[0])}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.0 - Précis</span>
                <span>0.5 - Équilibré</span>
                <span>1.0 - Créatif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 sm:mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <h3 className="font-semibold mb-2 text-blue-900 text-sm sm:text-base">Conseils pour une bonne description</h3>
            <ul className="text-xs sm:text-sm text-gray-700 space-y-1">
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
