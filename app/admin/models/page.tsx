'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit, Trash2, Key, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AIModel {
  id: string;
  provider: string;
  model_id: string;
  display_name: string;
  description: string;
  cost_per_1k_tokens_input: number;
  cost_per_1k_tokens_output: number;
  is_active: boolean;
  max_tokens: number;
  created_at: string;
}

export default function AdminModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  const [formData, setFormData] = useState({
    provider: 'openrouter',
    model_id: '',
    display_name: '',
    description: '',
    cost_per_1k_tokens_input: 0,
    cost_per_1k_tokens_output: 0,
    max_tokens: 4096,
    is_active: true,
  });

  useEffect(() => {
    checkAdmin();
    loadModels();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  };

  const loadModels = async () => {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading models:', error);
    } else {
      setModels(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingModel) {
      const { error } = await supabase
        .from('ai_models')
        .update(formData)
        .eq('id', editingModel.id);

      if (error) {
        console.error('Error updating model:', error);
      }
    } else {
      const { error } = await supabase
        .from('ai_models')
        .insert(formData);

      if (error) {
        console.error('Error creating model:', error);
      }
    }

    setDialogOpen(false);
    setEditingModel(null);
    resetForm();
    loadModels();
  };

  const handleToggleActive = async (model: AIModel) => {
    const { error } = await supabase
      .from('ai_models')
      .update({ is_active: !model.is_active })
      .eq('id', model.id);

    if (error) {
      console.error('Error toggling model:', error);
    } else {
      loadModels();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      return;
    }

    const { error } = await supabase
      .from('ai_models')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting model:', error);
    } else {
      loadModels();
    }
  };

  const openEditDialog = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      provider: model.provider,
      model_id: model.model_id,
      display_name: model.display_name,
      description: model.description || '',
      cost_per_1k_tokens_input: model.cost_per_1k_tokens_input,
      cost_per_1k_tokens_output: model.cost_per_1k_tokens_output,
      max_tokens: model.max_tokens,
      is_active: model.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      provider: 'openrouter',
      model_id: '',
      display_name: '',
      description: '',
      cost_per_1k_tokens_input: 0,
      cost_per_1k_tokens_output: 0,
      max_tokens: 4096,
      is_active: true,
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Modèles IA</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Gestion Centralisée des Clés API</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Les clés API sont gérées via <Link href="/admin/config" className="text-blue-600 hover:underline font-medium">Configuration Système</Link> (catégorie: api_keys)</li>
                  <li>• Les utilisateurs sélectionnent uniquement le modèle qu'ils souhaitent utiliser</li>
                  <li>• Tous les appels API utilisent les clés configurées par les admins</li>
                  <li>• Sécurisé: Les clés ne sont jamais exposées côté client</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Modèles IA</CardTitle>
                <CardDescription>
                  Gérez les modèles disponibles pour les utilisateurs
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingModel(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un modèle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingModel ? 'Modifier le modèle' : 'Ajouter un modèle'}
                    </DialogTitle>
                    <DialogDescription>
                      Configurez les paramètres du modèle IA
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider">Fournisseur</Label>
                        <Select
                          value={formData.provider}
                          onValueChange={(v) => setFormData({ ...formData, provider: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openrouter">OpenRouter</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="model_id">ID du Modèle</Label>
                        <Input
                          id="model_id"
                          value={formData.model_id}
                          onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                          placeholder="ex: anthropic/claude-3.5-sonnet"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_name">Nom d'affichage</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cost_input">Coût Input ($/1K)</Label>
                        <Input
                          id="cost_input"
                          type="number"
                          step="0.000001"
                          value={formData.cost_per_1k_tokens_input}
                          onChange={(e) => setFormData({ ...formData, cost_per_1k_tokens_input: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost_output">Coût Output ($/1K)</Label>
                        <Input
                          id="cost_output"
                          type="number"
                          step="0.000001"
                          value={formData.cost_per_1k_tokens_output}
                          onChange={(e) => setFormData({ ...formData, cost_per_1k_tokens_output: parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max_tokens">Max Tokens</Label>
                        <Input
                          id="max_tokens"
                          type="number"
                          value={formData.max_tokens}
                          onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Actif</Label>
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                        Annuler
                      </Button>
                      <Button type="submit" className="flex-1">
                        {editingModel ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modèle</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Coût Input</TableHead>
                  <TableHead className="text-right">Coût Output</TableHead>
                  <TableHead>Max Tokens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{model.display_name}</p>
                        <p className="text-sm text-gray-500">{model.model_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{model.provider}</TableCell>
                    <TableCell className="text-right">${model.cost_per_1k_tokens_input.toFixed(6)}</TableCell>
                    <TableCell className="text-right">${model.cost_per_1k_tokens_output.toFixed(6)}</TableCell>
                    <TableCell>{model.max_tokens.toLocaleString()}</TableCell>
                    <TableCell>
                      <Switch
                        checked={model.is_active}
                        onCheckedChange={() => handleToggleActive(model)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(model)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(model.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
