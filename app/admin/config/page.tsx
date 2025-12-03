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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Key, Info, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  is_encrypted: boolean;
  description: string | null;
  category: string;
  updated_at: string;
}

export default function AdminConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);

  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: 'api_keys',
    is_encrypted: false,
  });

  useEffect(() => {
    checkAdmin();
    loadConfigs();
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

    if (!adminData || adminData.role !== 'super_admin') {
      router.push('/admin');
      return;
    }

    setLoading(false);
  };

  const loadConfigs = async () => {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error loading configs:', error);
    } else {
      setConfigs(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();

    if (editingConfig) {
      const { error } = await supabase
        .from('system_config')
        .update({
          ...formData,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingConfig.id);

      if (error) {
        console.error('Error updating config:', error);
      }
    } else {
      const { error } = await supabase
        .from('system_config')
        .insert({
          ...formData,
          updated_by: user?.id,
        });

      if (error) {
        console.error('Error creating config:', error);
      }
    }

    setDialogOpen(false);
    setEditingConfig(null);
    resetForm();
    loadConfigs();
  };

  const openEditDialog = (config: SystemConfig) => {
    setEditingConfig(config);
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description || '',
      category: config.category,
      is_encrypted: config.is_encrypted,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      description: '',
      category: 'api_keys',
      is_encrypted: false,
    });
  };

  const maskValue = (value: string, isEncrypted: boolean) => {
    if (!isEncrypted) return value;
    if (value.length <= 8) return '********';
    return value.substring(0, 4) + '...' + value.substring(value.length - 4);
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

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
          <h1 className="text-2xl font-bold text-gray-900">Configuration Système</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2 text-blue-900">Comment ajouter une clé API OpenRouter</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-1">1. Obtenir votre clé API</p>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Créer une clé sur OpenRouter
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div>
                    <p className="font-medium mb-1">2. Ajouter la configuration</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Cliquez sur "Ajouter une configuration" ci-dessous</li>
                      <li>• <strong>Clé:</strong> <code className="bg-gray-100 px-1 rounded">openrouter_api_key</code></li>
                      <li>• <strong>Valeur:</strong> Collez votre clé API (commence par sk-or-...)</li>
                      <li>• <strong>Catégorie:</strong> api_keys</li>
                      <li>• <strong>Chiffré:</strong> Activé (recommandé)</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-xs text-gray-600">
                      Note: Les clés API système sont utilisées par les Edge Functions backend. Elles ne sont jamais exposées au client.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
                  <CardDescription>
                    Configuration pour {category}
                  </CardDescription>
                </div>
                <Button onClick={() => { resetForm(); setFormData({ ...formData, category }); setEditingConfig(null); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-mono text-sm">{config.key}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {maskValue(config.value, config.is_encrypted)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {config.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categoryConfigs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Aucune configuration
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedConfigs).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune configuration</h3>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter votre première configuration système
              </p>
              <Button onClick={() => { resetForm(); setEditingConfig(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une configuration
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? 'Modifier la configuration' : 'Ajouter une configuration'}
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres système
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_keys">API Keys</SelectItem>
                    <SelectItem value="models">Models</SelectItem>
                    <SelectItem value="limits">Limits</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Clé</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="ex: openrouter_api_key"
                  required
                  disabled={!!editingConfig}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valeur</Label>
                <Textarea
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_encrypted"
                  checked={formData.is_encrypted}
                  onChange={(e) => setFormData({ ...formData, is_encrypted: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_encrypted">Valeur sensible (masquer)</Label>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  {editingConfig ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
