'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  restrictToDetailedSettings,
  restoreFullAccess,
  setUserViewRestriction,
  type ViewMode,
} from '@/lib/view-restrictions';
import { useViewRestriction } from './ViewRestrictionManager';
import { Eye, EyeOff, Settings, Info, FileText, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ViewModeSelector Component
 *
 * Allows users to configure their view restrictions
 * with a user-friendly interface
 */

export function ViewModeSelector() {
  const { restriction, loading, refresh, isRestricted } = useViewRestriction();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSetMode = async (mode: ViewMode) => {
    setProcessing(true);
    setMessage(null);

    try {
      let success = false;

      if (mode === 'full') {
        success = await restoreFullAccess();
      } else {
        success = await setUserViewRestriction(mode);
      }

      if (success) {
        setMessage({
          type: 'success',
          text: 'Configuration enregistrée. Redirection en cours...',
        });

        // Refresh and redirect after 1 second
        setTimeout(() => {
          refresh();
          window.location.reload();
        }, 1000);
      } else {
        setMessage({
          type: 'error',
          text: 'Erreur lors de la configuration. Veuillez réessayer.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Une erreur est survenue.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const viewModes = [
    {
      id: 'full' as ViewMode,
      title: 'Accès complet',
      description: 'Accéder à toutes les pages (mode par défaut)',
      icon: Eye,
      color: 'blue',
      pages: ['Dashboard', 'Tous les paramètres', 'Projets', 'Clients'],
    },
    {
      id: 'detailed-settings-only' as ViewMode,
      title: 'Paramètres Détaillés uniquement',
      description: 'Afficher uniquement la page des paramètres détaillés',
      icon: Settings,
      color: 'purple',
      pages: ['Paramètres Détaillés'],
      recommended: true,
    },
    {
      id: 'api-info-only' as ViewMode,
      title: 'Informations API uniquement',
      description: 'Afficher uniquement la page d\'information API',
      icon: Info,
      color: 'emerald',
      pages: ['Informations API'],
    },
    {
      id: 'complete-settings-only' as ViewMode,
      title: 'Paramètres Complets uniquement',
      description: 'Afficher uniquement la page des paramètres complets',
      icon: FileText,
      color: 'orange',
      pages: ['Paramètres Complets'],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Alert className={isRestricted ? 'bg-orange-500/10 border-orange-500/50' : 'bg-blue-500/10 border-blue-500/50'}>
        <AlertCircle className={isRestricted ? 'text-orange-500' : 'text-blue-500'} />
        <AlertDescription className="text-gray-900">
          {isRestricted ? (
            <>
              Mode restreint actif: <strong>{viewModes.find(m => m.id === restriction?.view_mode)?.title || 'Inconnu'}</strong>
              <br />
              <span className="text-sm text-gray-500">
                Vous êtes redirigé automatiquement vers: {restriction?.redirect_route}
              </span>
            </>
          ) : (
            <>
              Accès complet activé
              <br />
              <span className="text-sm text-gray-500">
                Vous pouvez accéder à toutes les pages de l'application
              </span>
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Success/Error Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="text-green-500" />
          ) : (
            <AlertCircle className="text-red-500" />
          )}
          <AlertDescription className="text-gray-900">
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* View Mode Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {viewModes.map((mode) => {
          const IconComponent = mode.icon;
          const isActive = restriction?.view_mode === mode.id || (!restriction && mode.id === 'full');

          return (
            <Card
              key={mode.id}
              className={`
                relative overflow-hidden
                ${isActive
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-200'
                }
              `}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-${mode.color}-500/20`}>
                      <IconComponent className={`h-5 w-5 text-${mode.color}-400`} />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                        {mode.title}
                        {mode.recommended && (
                          <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                            Recommandé
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  {isActive && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">{mode.description}</p>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Pages accessibles:</p>
                  <div className="flex flex-wrap gap-1">
                    {mode.pages.map((page) => (
                      <Badge
                        key={page}
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 text-xs"
                      >
                        {page}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleSetMode(mode.id)}
                  disabled={processing || isActive}
                  className={`
                    w-full
                    ${isActive
                      ? 'bg-green-600 hover:bg-green-700'
                      : `bg-${mode.color}-600 hover:bg-${mode.color}-700`
                    }
                  `}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Configuration...
                    </>
                  ) : isActive ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mode actif
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activer ce mode
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-400" />
            Comment ça fonctionne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-600 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-semibold">1.</span>
            <p>Sélectionnez le mode de vue que vous souhaitez activer</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-semibold">2.</span>
            <p>La configuration est sauvegardée automatiquement dans votre compte</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-semibold">3.</span>
            <p>Vous serez redirigé vers la page autorisée</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-semibold">4.</span>
            <p>Toutes les tentatives d'accès à d'autres pages vous redirigeront automatiquement</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-semibold">5.</span>
            <p>Pour désactiver, sélectionnez "Accès complet"</p>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-blue-600 font-semibold mb-2">Persistance de la configuration</p>
            <p className="text-xs text-gray-500">
              Votre configuration est sauvegardée dans la base de données Supabase et persiste
              entre les sessions. Elle s'applique automatiquement à chaque connexion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
