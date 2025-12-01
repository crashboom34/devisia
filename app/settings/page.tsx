'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Key, AlertCircle, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SettingsNavigation } from '@/components/SettingsNavigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Aide Devis IA</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Paramètres</h1>
          <p className="text-gray-400">Configuration de votre compte</p>
        </div>

        {/* Information Alert */}
        <Alert className="mb-8 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <Key className="h-5 w-5 text-blue-600" />
          <AlertDescription className="ml-2 text-gray-800">
            <div className="space-y-3">
              <p className="font-semibold text-base">
                Important: La gestion des clés API a été centralisée pour plus de sécurité.
              </p>
              <ul className="space-y-2 ml-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Les clés API sont maintenant gérées exclusivement par les administrateurs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>
                    Vous pouvez simplement <strong>sélectionner le modèle IA</strong> de votre choix depuis votre dashboard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Vos appels API utilisent automatiquement les clés configurées par l'équipe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>C'est plus sûr: vos clés personnelles ne sont plus nécessaires</span>
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Return to Dashboard Button */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-base font-semibold">
              Retour au Dashboard
            </Button>
          </Link>
        </div>

        {/* Obsolete Section - API Keys */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-300 mb-1">
                Ajouter une clé API (Obsolète)
              </CardTitle>
              <p className="text-sm text-gray-500">Cette fonctionnalité n'est plus disponible</p>
            </div>
            <Badge variant="outline" className="border-gray-600 text-gray-400 px-3 py-1">
              Désactivé
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider Field - Disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Fournisseur
              </label>
              <div className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed">
                OpenRouter (Recommandé - Tous les modèles)
              </div>
            </div>

            {/* Model Field - Disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Modèle IA
              </label>
              <div className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed">
                Llama 3.1 8B (Gratuit)
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Les modèles gratuits ne nécessitent pas de paiement. Les autres sont facturés selon l'usage.
              </p>
            </div>

            {/* API Key Field - Disabled */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Clé API
              </label>
              <div className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed font-mono">
                sk-or-...
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Obtenez votre clé sur{' '}
                <span className="text-blue-400">openrouter.ai</span>{' '}
                (Gratuit + modèles gratuits disponibles)
              </p>
            </div>

            {/* Disabled Add Button */}
            <Button
              disabled
              className="w-full bg-emerald-500/30 text-emerald-300 cursor-not-allowed py-6 text-base font-semibold"
            >
              Ajouter la clé API
            </Button>
          </CardContent>
        </Card>

        {/* Saved API Keys Section - Empty */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-300 mb-1">
                Clés API enregistrées (Obsolète)
              </CardTitle>
              <p className="text-sm text-gray-500">Les clés utilisateur ne sont plus utilisées</p>
            </div>
            <Badge variant="outline" className="border-gray-600 text-gray-400 px-3 py-1">
              Désactivé
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Aucune clé API enregistrée</p>
              <p className="text-gray-600 text-sm mt-2">
                La gestion des clés est maintenant centralisée côté administrateur
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-8 p-6 bg-blue-900/20 border border-blue-800/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-blue-200">
              <p className="font-semibold">Pourquoi ce changement ?</p>
              <ul className="space-y-1 ml-4">
                <li>✓ Sécurité renforcée: vos clés API personnelles ne sont plus exposées</li>
                <li>✓ Simplicité: plus besoin de gérer vos propres clés</li>
                <li>✓ Centralisation: l'équipe gère les quotas et la disponibilité</li>
                <li>✓ Transparence: vous choisissez le modèle, nous gérons l'accès</li>
              </ul>
              <p className="mt-4 pt-4 border-t border-blue-800/50">
                Pour toute question, contactez l'équipe support ou consultez la documentation.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Navigation */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Navigation des paramètres</h3>
          <SettingsNavigation />
        </div>

        {/* View Mode Configuration */}
        <div className="mt-8">
          <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <EyeOff className="h-5 w-5 text-purple-400" />
                    Restreindre l'affichage
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Configurez votre compte pour afficher uniquement certaines pages et masquer toutes les autres.
                    Utile si vous souhaitez vous concentrer sur une seule section (ex: paramètres détaillés uniquement).
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Redirection automatique
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Sauvegarde permanente
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Réversible
                    </Badge>
                  </div>
                </div>
                <Link href="/settings/view-mode">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    Configurer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
