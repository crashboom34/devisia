'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ViewModeSelector } from '@/components/ViewModeSelector';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Settings } from 'lucide-react';

/**
 * View Mode Configuration Page
 *
 * Allows users to configure view restrictions to show only
 * specific pages (e.g., detailed settings only)
 */

export default function ViewModePage() {
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
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="text-gray-900">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux paramètres
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mode d'affichage</h1>
                <p className="text-sm text-gray-500">
                  Configurez les pages que vous souhaitez voir
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Introduction */}
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Restriction de vue personnalisée
              </h2>
              <p className="text-gray-600 mb-4">
                Vous pouvez configurer votre compte pour afficher <strong>uniquement la page des paramètres détaillés</strong>
                et masquer toutes les autres pages. Cette configuration persiste automatiquement entre les sessions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <p className="text-gray-500">
                    Redirection automatique vers la page autorisée
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <p className="text-gray-500">
                    Configuration sauvegardée dans Supabase
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <p className="text-gray-500">
                    Réversible à tout moment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Mode Selector */}
          <ViewModeSelector />

          {/* Quick Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Link href="/settings">
              <Button variant="outline" className="border-gray-200 text-gray-600">
                Retour aux paramètres
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-200 text-gray-600">
                Retour au Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
