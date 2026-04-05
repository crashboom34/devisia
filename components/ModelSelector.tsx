'use client';
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AIModel {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  description: string;
  cost_per_1k_tokens_input: number;
  cost_per_1k_tokens_output: number;
  max_tokens: number;
}

export default function ModelSelector() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadModelsAndPreference();
  }, []);

  const loadModelsAndPreference = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data: modelsData } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('cost_per_1k_tokens_input', { ascending: true });

    if (modelsData) {
      setModels(modelsData);

      const { data: preference } = await supabase
        .from('user_preferences')
        .select('preferred_model_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preference?.preferred_model_id) {
        setSelectedModelId(preference.preferred_model_id);
      } else if (modelsData.length > 0) {
        setSelectedModelId(modelsData[0].id);
      }
    }

    setLoading(false);
  };

  const handleModelChange = async (modelId: string) => {
    setSelectedModelId(modelId);

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('user_preferences')
        .update({
          preferred_model_id: modelId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          preferred_model_id: modelId
        });
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6">
          <p className="text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-green" />
          <CardTitle className="text-gray-900">Modèle IA</CardTitle>
        </div>
        <CardDescription className="text-gray-500">
          Choisissez le modèle d'intelligence artificielle pour générer vos devis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={selectedModelId} onValueChange={handleModelChange}>
            <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
              <SelectValue placeholder="Sélectionner un modèle" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-gray-900 hover:bg-gray-50">
                  {model.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModel && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-brand-green mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{selectedModel.display_name}</p>
                  {selectedModel.cost_per_1k_tokens_input === 0 ? (
                    <Badge variant="default" className="bg-brand-green text-white">GRATUIT</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                      {((selectedModel.cost_per_1k_tokens_input + selectedModel.cost_per_1k_tokens_output) / 2).toFixed(5)}$/1K tokens
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedModel.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <Zap className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Capacité</p>
                <p className="text-sm font-medium text-gray-900">{selectedModel.max_tokens.toLocaleString()} tokens</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
