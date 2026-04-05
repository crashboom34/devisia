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
import { ArrowLeft, FileText, Mic, Keyboard, Loader as Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import VoiceRecorder from '@/components/VoiceRecorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EstimateTemplate } from '@/lib/supabase';
import { getUserSubscriptionInfo, canCreateProject, type SubscriptionInfo } from '@/lib/subscription-helper';
import { getPlanLabel, getPlanValueProp } from '@/lib/plan-labels';

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
  const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    checkUser();
    loadTemplates();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
      // Load subscription info to display AI capability level
      const subInfo = await getUserSubscriptionInfo(user.id);
      setSubscriptionInfo(subInfo);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('estimate_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
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

    const createPermission = await canCreateProject(user.id);
    if (!createPermission.allowed) {
      alert(createPermission.message || 'Vous avez atteint votre limite de projets');
      if (createPermission.upgrade_url) {
        router.push(createPermission.upgrade_url);
      }
      return;
    }

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
            templateId: selectedTemplateId || undefined,
            adminTier: typeof window !== 'undefined' ? localStorage.getItem('admin_current_mode') : undefined,
          }),
        });

        if (!response.ok) {
          let errorMsg = 'Erreur inconnue';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.message || `Erreur HTTP ${response.status}`;
          } catch {
            errorMsg = `Erreur HTTP ${response.status}`;
          }
          throw new Error(errorMsg);
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
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Button>
          </Link>
        </div>
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Nouveau Projet</h1>
          <p className="text-sm sm:text-base text-gray-500">
            Dictez ou écrivez votre projet de construction
          </p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-gray-900">Décrivez Votre Projet</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-500">
              Choisissez votre méthode de saisie préférée
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'voice' | 'text')}>
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gray-100 border-gray-200">
                <TabsTrigger value="voice" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Dictée Vocale</span>
                  <span className="xs:hidden">Voix</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">
                  <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Saisie Texte</span>
                  <span className="xs:hidden">Texte</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base text-gray-600">Titre du Projet</Label>
                  <VoiceRecorder
                    value={formData.title}
                    onChange={(text) => {
                      console.log('[TITLE onChange]', text);
                      setFormData(prev => ({ ...prev, title: text }));
                    }}
                    placeholder="Dictez le titre de votre projet"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base text-gray-600">Description du Projet</Label>
                  <VoiceRecorder
                    value={formData.description}
                    onChange={(text) => {
                      console.log('[DESCRIPTION onChange]', text);
                      setFormData(prev => ({ ...prev, description: text }));
                    }}
                    placeholder="Dictez la description complète de votre projet"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base text-gray-600">Type de Projet (optionnel)</Label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
                      <span className="text-sm text-gray-500">Chargement des templates...</span>
                    </div>
                  ) : (
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger className="text-sm sm:text-base bg-gray-50 border-gray-200 text-gray-900">
                        <SelectValue placeholder="Sélectionner un type de projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="none" className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900">Aucun template (génération libre)</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.template_id} className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900">
                            {template.name}
                            <span className="text-xs text-gray-500 ml-2">• {template.category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-gray-500">
                    Sélectionnez un type de projet pour structurer automatiquement votre devis selon les standards BTP
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Link href="/dashboard" className="w-full sm:flex-1">
                    <Button type="button" variant="outline" className="w-full text-sm sm:text-base border-gray-200 text-gray-600 hover:bg-gray-50" disabled={loading}>
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className={`w-full sm:flex-1 relative overflow-hidden transition-all text-sm sm:text-base bg-brand-green hover:bg-brand-greenDark shadow-lg shadow-brand-green/20 text-white ${
                      loading ? 'animate-pulse' : ''
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
                  <Label htmlFor="title" className="text-sm sm:text-base text-gray-600">
                    Titre du Projet <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="ex: Rénovation maison 100m²"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="text-sm sm:text-base bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm sm:text-base text-gray-600">
                    Description du Projet <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre projet en détail : type de travaux, superficie, matériaux souhaités, contraintes particulières..."
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    className="text-sm sm:text-base bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                  />
                  <p className="text-xs sm:text-sm text-gray-500">
                    Plus votre description est détaillée, plus les devis générés seront précis.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template" className="text-sm sm:text-base text-gray-600">Type de Projet (optionnel)</Label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
                      <span className="text-sm text-gray-500">Chargement des templates...</span>
                    </div>
                  ) : (
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger id="template" className="text-sm sm:text-base bg-gray-50 border-gray-200 text-gray-900">
                        <SelectValue placeholder="Sélectionner un type de projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="none" className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900">Aucun template (génération libre)</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.template_id} className="text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900">
                            {template.name}
                            <span className="text-xs text-gray-500 ml-2">• {template.category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-gray-500">
                    Sélectionnez un type de projet pour structurer automatiquement votre devis selon les standards BTP
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Link href="/dashboard" className="w-full sm:flex-1">
                    <Button type="button" variant="outline" className="w-full text-sm sm:text-base border-gray-200 text-gray-600 hover:bg-gray-50" disabled={loading}>
                      Annuler
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className={`w-full sm:flex-1 relative overflow-hidden transition-all text-sm sm:text-base bg-brand-green hover:bg-brand-greenDark shadow-lg shadow-brand-green/20 text-white ${
                      loading ? 'animate-pulse' : ''
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

        {/* Subscription Tier Info - Automatic AI Model Assignment */}
        <Card className="mt-4 sm:mt-6 bg-white border border-gray-200 shadow-lg">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-green/10">
                <Sparkles className="h-5 w-5 text-brand-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {subscriptionInfo ? getPlanLabel(subscriptionInfo.tier_name) : 'Génération intelligente'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {subscriptionInfo
                    ? getPlanValueProp(subscriptionInfo.tier_name)
                    : 'Vos devis seront générés automatiquement selon votre abonnement'}
                </p>
              </div>
              {subscriptionInfo && subscriptionInfo.tier_level > 1 && (
                <div className="px-2 py-1 rounded-full bg-brand-green/10 border border-brand-green/30">
                  <span className="text-xs font-medium text-brand-green">Premium</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 sm:mt-6 bg-white border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand-green" />
              Créativité de l'IA
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-500">
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

        <Card className="mt-4 sm:mt-6 bg-brand-green/10 border border-brand-green/30">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <h3 className="font-semibold mb-2 text-brand-green text-sm sm:text-base">Conseils pour une bonne description</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Précisez le type de travaux (construction, rénovation, extension...)</li>
              <li>• Indiquez les dimensions et surfaces concernées</li>
              <li>• Mentionnez les matériaux et finitions souhaités</li>
              <li>• Signalez les contraintes techniques ou réglementaires</li>
              <li>• Décrivez les équipements à installer</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
