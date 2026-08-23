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
import { Mic, Keyboard, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageLoading } from '@/components/dashboard/PageState';
import VoiceRecorder from '@/components/VoiceRecorder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EstimateTemplate } from '@/lib/supabase';
import { getUserSubscriptionInfo, canCreateProject, type SubscriptionInfo } from '@/lib/subscription-helper';
import { getPlanLabel, getPlanValueProp } from '@/lib/plan-labels';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
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
    if (authLoading || !user) return;
    void loadTemplates();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    // Load subscription info to display AI capability level
    getUserSubscriptionInfo(user.id).then(setSubscriptionInfo);
  }, [authLoading, user]);

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
    if (!user) return;

    const createPermission = await canCreateProject(user.id);
    if (!createPermission.allowed) {
      toast.error(createPermission.message || 'Vous avez atteint votre limite de projets');
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
      toast.error('Erreur lors de la création du projet: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setLoading(false);
      setLoadingStage(null);
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
      <PageContainer className="max-w-3xl">
        <PageHeader
          title="Nouveau devis"
          subtitle="Décrivez le chantier à la voix ou au clavier pour générer trois variantes."
          breadcrumbs={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Nouveau devis' },
          ]}
        />

        <Card className="border-border bg-surface shadow-panel">
          <CardHeader>
            <CardTitle className="text-lg text-foreground sm:text-xl">Décrivez votre projet</CardTitle>
            <CardDescription className="text-sm text-muted-foreground sm:text-base">
              Choisissez la méthode la plus pratique sur le chantier.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'voice' | 'text')}>
              <TabsList className="mb-4 grid h-11 w-full grid-cols-2 border border-border bg-surface-elevated sm:mb-6">
                <TabsTrigger value="voice" className="flex min-h-10 items-center gap-1 text-xs data-[state=active]:bg-surface data-[state=active]:text-foreground sm:gap-2 sm:text-sm">
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Dictée Vocale</span>
                  <span className="xs:hidden">Voix</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex min-h-10 items-center gap-1 text-xs data-[state=active]:bg-surface data-[state=active]:text-foreground sm:gap-2 sm:text-sm">
                  <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                  <span className="hidden xs:inline">Saisie Texte</span>
                  <span className="xs:hidden">Texte</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm text-foreground sm:text-base">Titre du projet</Label>
                  <VoiceRecorder
                    value={formData.title}
                    onChange={(text) => setFormData(prev => ({ ...prev, title: text }))}
                    placeholder="Dictez le titre de votre projet"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm text-foreground sm:text-base">Description du projet</Label>
                  <VoiceRecorder
                    value={formData.description}
                    onChange={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Dictez la description complète de votre projet"
                  />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm text-foreground sm:text-base">Type de projet (optionnel)</Label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">Chargement des modèles…</span>
                    </div>
                  ) : (
                    <Select value={selectedTemplateId} onValueChange={(value) => setSelectedTemplateId(value === 'none' ? '' : value)}>
                      <SelectTrigger className="h-11 bg-surface-elevated text-sm text-foreground sm:text-base">
                        <SelectValue placeholder="Sélectionner un type de projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun modèle (génération libre)</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.template_id}>
                            {template.name}
                            <span className="ml-2 text-xs text-muted-foreground">• {template.category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez un type de projet pour structurer automatiquement votre devis selon les standards BTP
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Button asChild type="button" variant="outline" className="w-full text-sm sm:flex-1 sm:text-base">
                    <Link href="/dashboard" aria-disabled={loading} className={loading ? 'pointer-events-none opacity-50' : undefined}>
                      Annuler
                    </Link>
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className="relative w-full overflow-hidden text-sm sm:flex-1 sm:text-base"
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
                  <Label htmlFor="title" className="text-sm text-foreground sm:text-base">
                    Titre du projet <span className="text-danger" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="ex: Rénovation maison 100m²"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    aria-required="true"
                    className="h-11 bg-surface-elevated text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm text-foreground sm:text-base">
                    Description du projet <span className="text-danger" aria-hidden="true">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre projet en détail : type de travaux, superficie, matériaux souhaités, contraintes particulières..."
                    rows={8}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    aria-required="true"
                    className="bg-surface-elevated text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Plus votre description est détaillée, plus les devis générés seront précis.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template" className="text-sm text-foreground sm:text-base">Type de projet (optionnel)</Label>
                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">Chargement des modèles…</span>
                    </div>
                  ) : (
                    <Select value={selectedTemplateId} onValueChange={(value) => setSelectedTemplateId(value === 'none' ? '' : value)}>
                      <SelectTrigger id="template" className="h-11 bg-surface-elevated text-sm text-foreground sm:text-base">
                        <SelectValue placeholder="Sélectionner un type de projet (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun modèle (génération libre)</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.template_id}>
                            {template.name}
                            <span className="ml-2 text-xs text-muted-foreground">• {template.category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez un type de projet pour structurer automatiquement votre devis selon les standards BTP
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <Button asChild type="button" variant="outline" className="w-full text-sm sm:flex-1 sm:text-base">
                    <Link href="/dashboard" aria-disabled={loading} className={loading ? 'pointer-events-none opacity-50' : undefined}>
                      Annuler
                    </Link>
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.description}
                    className="relative w-full overflow-hidden text-sm sm:flex-1 sm:text-base"
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
        <Card className="border-border bg-surface shadow-panel">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {subscriptionInfo ? getPlanLabel(subscriptionInfo.tier_name) : 'Génération intelligente'}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subscriptionInfo
                    ? getPlanValueProp(subscriptionInfo.tier_name)
                    : 'Vos devis seront générés automatiquement selon votre abonnement'}
                </p>
              </div>
              {subscriptionInfo && subscriptionInfo.tier_level > 1 && (
                <div className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1">
                  <span className="text-xs font-medium text-primary">Premium</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-surface shadow-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground sm:text-lg">
              <Sparkles className="h-4 w-4 text-primary sm:h-5 sm:w-5" aria-hidden="true" />
              Créativité de l'IA
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground sm:text-sm">
              Ajustez la créativité du modèle (0 = précis et conservateur, 1 = créatif et varié)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-foreground">Température : {temperature.toFixed(2)}</span>
                <span className="text-muted-foreground">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0 - Précis</span>
                <span>0.5 - Équilibré</span>
                <span>1.0 - Créatif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-info/30 bg-info/10">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground sm:text-base">Conseils pour une description utile</h3>
            <ul className="space-y-1 text-xs text-muted-foreground sm:text-sm">
              <li>• Précisez le type de travaux (construction, rénovation, extension...)</li>
              <li>• Indiquez les dimensions et surfaces concernées</li>
              <li>• Mentionnez les matériaux et finitions souhaités</li>
              <li>• Signalez les contraintes techniques ou réglementaires</li>
              <li>• Décrivez les équipements à installer</li>
            </ul>
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  );
}
