'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Model {
  id: string;
  display_name: string;
  model_id: string;
  provider: string;
  cost_per_1k_tokens_input?: number;
  cost_per_1k_tokens_output?: number;
  is_active?: boolean;
}

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
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  useEffect(() => {
    if (open) {
      setError(null);
      setIsRegenerating(false);
      loadModels();
    }
  }, [open]);

  const loadModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erreur de chargement: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Aucun modèle IA disponible. Veuillez contacter l\'administrateur.');
      }

      setModels(data);

      // Pré-sélectionner GPT-4o Mini si disponible, sinon le premier modèle disponible
      const gpt4oMini = data.find(m => m.model_id.includes('gpt-4o-mini'));
      const defaultModel = gpt4oMini?.id || data[0]?.id || '';

      setSelectedModel(defaultModel);
    } catch (err) {
      console.error('Error loading models:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des modèles';
      setError(errorMessage);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedModel) {
      setError('Veuillez sélectionner un modèle');
      return;
    }

    setIsRegenerating(true);
    setError(null);

    const startTime = Date.now();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Appeler la fonction Edge pour régénérer le devis
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/regenerate-estimate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimateId,
          modelId: selectedModel,
          projectDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la régénération');
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      // Logger la régénération
      const selectedModelData = models.find(m => m.id === selectedModel);
      const priceDifference = ((result.newTotal - currentTotal) / currentTotal) * 100;

      await supabase.from('quote_regeneration_log').insert({
        estimate_id: result.newEstimateId,
        original_estimate_id: estimateId,
        user_id: user.id,
        old_model: currentModel,
        new_model: selectedModelData?.display_name || 'Unknown',
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

      // Logger l'échec
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('quote_regeneration_log').insert({
            estimate_id: estimateId,
            original_estimate_id: estimateId,
            user_id: user.id,
            old_model: currentModel,
            new_model: models.find(m => m.id === selectedModel)?.display_name || 'Unknown',
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

  const selectedModelData = models.find(m => m.id === selectedModel);
  const isFreeModel = !selectedModelData?.cost_per_1k_tokens_input && !selectedModelData?.cost_per_1k_tokens_output;
  const avgCost = selectedModelData?.cost_per_1k_tokens_input && selectedModelData?.cost_per_1k_tokens_output
    ? (selectedModelData.cost_per_1k_tokens_input + selectedModelData.cost_per_1k_tokens_output) / 2
    : selectedModelData?.cost_per_1k_tokens_input || selectedModelData?.cost_per_1k_tokens_output || 0;
  const estimatedCost = avgCost > 0
    ? ((projectDescription.length / 1000) * avgCost * 2).toFixed(2)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Régénérer le devis avec un meilleur modèle
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle version de ce devis {scenarioType} en utilisant un modèle IA plus performant.
            L'ancien devis sera conservé pour comparaison.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="model">Sélectionner un modèle IA</Label>
            {loadingModels ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Choisir un modèle..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => {
                    const modelIsFree = !model.cost_per_1k_tokens_input && !model.cost_per_1k_tokens_output;
                    const avgModelCost = model.cost_per_1k_tokens_input && model.cost_per_1k_tokens_output
                      ? (model.cost_per_1k_tokens_input + model.cost_per_1k_tokens_output) / 2
                      : model.cost_per_1k_tokens_input || model.cost_per_1k_tokens_output || 0;

                    return (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.display_name}</span>
                          <span className="ml-4 text-xs text-gray-500">
                            {modelIsFree ? '(GRATUIT)' : `~${avgModelCost.toFixed(4)}€/1k tokens`}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-gray-500">
              Modèle actuel: <strong>{currentModel}</strong>
            </p>
          </div>

          {selectedModelData && !isFreeModel && parseFloat(estimatedCost) > 0 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Coût estimé:</strong> ~{estimatedCost}€ pour ce devis
                <br />
                <span className="text-xs">
                  Les modèles payants offrent généralement des estimations +15% à +30% plus précises.
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">Informations importantes</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Le devis actuel sera conservé et marqué comme "version précédente"</li>
              <li>Vous pourrez comparer les deux versions côte à côte</li>
              <li>Le nouveau devis deviendra automatiquement la version active</li>
              <li>La régénération prend généralement 10-20 secondes</li>
              <li>Toutes les régénérations sont enregistrées pour audit</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total actuel:</span>
              <span className="font-bold">{currentTotal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
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
            disabled={isRegenerating || !selectedModel || loadingModels}
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
