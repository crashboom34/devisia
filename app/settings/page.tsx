'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Key, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ApiKey } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'openrouter'>('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [modelName, setModelName] = useState('Llama 3.1 8B (Gratuit)');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openRouterModels = [
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Gratuit)' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (Payant)' },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B (Payant)' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Gratuit)' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5 (Payant)' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (Payant)' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Payant)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Payant)' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B (Payant)' },
    { id: 'mistralai/mistral-large', name: 'Mistral Large (Payant)' },
  ];

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

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminData || adminData.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    setIsSuperAdmin(true);
    setCheckingAuth(false);
    loadApiKeys();
  };

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (err) {
      console.error('Error loading API keys:', err);
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          provider,
          api_key: apiKey,
          model_id: provider === 'openrouter' ? modelId : null,
          model_name: provider === 'openrouter' ? modelName : null,
          is_active: true,
        });

      if (insertError) throw insertError;

      setSuccess('Clé API ajoutée avec succès');
      setApiKey('');
      loadApiKeys();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadApiKeys();
    } catch (err) {
      console.error('Error deleting API key:', err);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Vérification des permissions...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
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
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-600 mb-8">Configuration de votre compte</p>

        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Nouvelle Gestion des Clés API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> La gestion des clés API a été centralisée pour plus de sécurité.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 ml-4">
                <li>• Les clés API sont maintenant gérées exclusivement par les administrateurs</li>
                <li>• Vous pouvez simplement <strong>sélectionner le modèle IA</strong> de votre choix depuis votre dashboard</li>
                <li>• Vos appels API utilisent automatiquement les clés configurées par l'équipe</li>
                <li>• C'est plus sûr: vos clés personnelles ne sont plus nécessaires</li>
              </ul>
              <div className="pt-2">
                <Link href="/dashboard">
                  <Button className="w-full">
                    Retour au Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 opacity-60 pointer-events-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-400">Ajouter une clé API (Obsolète)</CardTitle>
                <CardDescription>
                  Cette fonctionnalité n'est plus disponible
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-gray-100 text-gray-600">Désactivé</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddApiKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Fournisseur</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as 'openai' | 'anthropic' | 'openrouter')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter (Recommandé - Tous les modèles)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {provider === 'openrouter' && (
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle IA</Label>
                  <Select
                    value={modelId}
                    onValueChange={(v) => {
                      setModelId(v);
                      const model = openRouterModels.find(m => m.id === v);
                      if (model) setModelName(model.name);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {openRouterModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Les modèles gratuits ne nécessitent pas de paiement. Les autres sont facturés selon l'usage.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={provider === 'openrouter' ? 'sk-or-...' : provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  {provider === 'openrouter' ? (
                    <>Obtenez votre clé sur <a href="https://openrouter.ai/keys" target="_blank" className="text-blue-600 hover:underline">openrouter.ai</a> (Gratuit + modèles gratuits disponibles)</>
                  ) : provider === 'openai' ? (
                    <>Obtenez votre clé sur <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 hover:underline">platform.openai.com</a></>
                  ) : (
                    <>Obtenez votre clé sur <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-blue-600 hover:underline">console.anthropic.com</a></>
                  )}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Ajout...' : 'Ajouter la clé API'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="opacity-60 pointer-events-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-400">Clés API enregistrées (Obsolète)</CardTitle>
                <CardDescription>
                  Les clés utilisateur ne sont plus utilisées
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-gray-100 text-gray-600">Désactivé</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune clé API enregistrée</p>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      key.is_active ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Key className={`h-5 w-5 ${key.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium capitalize">
                          {key.provider}
                          {key.is_active && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                              Active
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{maskApiKey(key.api_key)}</p>
                        {key.model_name && (
                          <p className="text-xs text-gray-500 mt-1">
                            Modèle: {key.model_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
