'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RegenerateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateId: string;
  currentModel: string;
  currentTotal: number;
  scenarioType: string;
  projectDescription: string;
  onSuccess: () => void;
}

export default function RegenerateQuoteDialog({
  open,
  onOpenChange,
  estimateId,
  currentModel,
  currentTotal,
  scenarioType,
  projectDescription,
  onSuccess,
}: RegenerateQuoteDialogProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    const startTime = Date.now();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/regenerate-estimate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimateId,
          projectDescription,
          adminTier: typeof window !== 'undefined' ? localStorage.getItem('admin_current_mode') : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la régénération');
      }

      const result = await response.json();
      const duration = Date.now() - startTime;
      const priceDifference = ((result.newTotal - currentTotal) / currentTotal) * 100;

      await supabase.from('quote_regeneration_log').insert({
        estimate_id: result.newEstimateId,
        original_estimate_id: estimateId,
        user_id: session.user.id,
        old_model: currentModel,
        new_model: currentModel,
        old_total_ttc: currentTotal,
        new_total_ttc: result.newTotal,
        price_difference_percent: priceDifference,
        regeneration_duration_ms: duration,
        status: 'success',
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error regenerating quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('quote_regeneration_log').insert({
            estimate_id: estimateId,
            original_estimate_id: estimateId,
            user_id: session.user.id,
            old_model: currentModel,
            new_model: currentModel,
            old_total_ttc: currentTotal,
            new_total_ttc: null,
            price_difference_percent: null,
            regeneration_duration_ms: Date.now() - startTime,
            status: 'failed',
            error_message: errorMessage,
          });
        }
      } catch (logError) {
        console.error('Error logging failed regeneration:', logError);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Régénérer le devis
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle version de ce devis {scenarioType} avec votre moteur de génération actuel.
            L&apos;ancienne version sera conservée pour comparaison.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">Informations importantes</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Le devis actuel sera conservé et marqué comme &quot;version précédente&quot;</li>
              <li>Vous pourrez comparer les deux versions côte à côte</li>
              <li>Le nouveau devis deviendra automatiquement la version active</li>
              <li>La régénération prend généralement 10–20 secondes</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total actuel :</span>
              <span className="font-bold">
                {currentTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Régénération en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Régénérer le devis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
