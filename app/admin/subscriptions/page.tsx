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
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit, Shield, CreditCard, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CANONICAL_MAPPING } from '@/lib/tier-model';

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
}

interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  tier_level: number;
  ai_model_id: string;
  max_projects_per_month: number;
  max_estimates_per_project: number;
  priority_support: boolean;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface TierWithModel extends SubscriptionTier {
  ai_model_name?: string;
  ai_model_identifier?: string;
  ai_provider?: string;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [tiers, setTiers] = useState<TierWithModel[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    tier_level: 1,
    ai_model_id: '',
    max_projects_per_month: 10,
    max_estimates_per_project: 3,
    priority_support: false,
    features: [] as string[],
    is_active: true,
    sort_order: 1,
  });

  useEffect(() => {
    checkAdmin();
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

    await Promise.all([loadTiers(), loadAIModels()]);
    setLoading(false);
  };

  const loadTiers = async () => {
    const { data, error } = await supabase
      .from('admin_subscription_tier_models')
      .select('*')
      .order('tier_level', { ascending: true });

    if (error) {
      console.error('Error loading tiers:', error);
    } else {
      setTiers(data || []);
    }
  };

  const loadAIModels = async () => {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error loading AI models:', error);
    } else {
      setAIModels(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      features: JSON.stringify(formData.features),
    };

    if (editingTier) {
      const { error } = await supabase
        .from('subscription_tiers')
        .update(dataToSubmit)
        .eq('id', editingTier.id);

      if (error) {
        console.error('Error updating tier:', error);
        alert('Error updating subscription tier');
      } else {
        setDialogOpen(false);
        setEditingTier(null);
        loadTiers();
      }
    } else {
      const { error } = await supabase
        .from('subscription_tiers')
        .insert([dataToSubmit]);

      if (error) {
        console.error('Error creating tier:', error);
        alert('Error creating subscription tier');
      } else {
        setDialogOpen(false);
        loadTiers();
      }
    }
  };

  const handleEdit = (tier: TierWithModel) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      display_name: tier.display_name,
      description: tier.description || '',
      price_monthly: tier.price_monthly,
      price_yearly: tier.price_yearly,
      tier_level: tier.tier_level,
      ai_model_id: tier.ai_model_id,
      max_projects_per_month: tier.max_projects_per_month,
      max_estimates_per_project: tier.max_estimates_per_project,
      priority_support: tier.priority_support,
      features: tier.features || [],
      is_active: tier.is_active,
      sort_order: tier.sort_order,
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (tier: SubscriptionTier) => {
    const { error } = await supabase
      .from('subscription_tiers')
      .update({ is_active: !tier.is_active })
      .eq('id', tier.id);

    if (error) {
      console.error('Error toggling tier:', error);
    } else {
      loadTiers();
    }
  };

  const applyDefaultMapping = async () => {
    for (const entry of CANONICAL_MAPPING) {
      const { data: model } = await supabase
        .from('ai_models')
        .select('id')
        .eq('model_id', entry.modelId)
        .eq('is_active', true)
        .maybeSingle();

      if (!model) continue;

      await supabase
        .from('subscription_tiers')
        .update({ ai_model_id: model.id })
        .eq('name', entry.tier);
    }
    await loadTiers();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      tier_level: 1,
      ai_model_id: '',
      max_projects_per_month: 10,
      max_estimates_per_project: 3,
      priority_support: false,
      features: [],
      is_active: true,
      sort_order: 1,
    });
    setEditingTier(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">Admin - Subscriptions</span>
          </div>
          <Link href="/admin">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <PageHeader
          title="Subscription Tier Management"
          subtitle="Configure subscription plans and their AI model assignments"
          showBackButton={false}
        />

        <Alert className="mb-6 border-cyan-500/30 bg-cyan-500/10">
          <AlertCircle className="h-4 w-4 text-cyan-400" />
          <AlertDescription className="text-slate-300">
            <strong className="text-cyan-400">Administrator Control:</strong> Only super administrators can assign AI models to subscription tiers.
            Users <strong>cannot</strong> manually select models - assignment is automatic based on their subscription.
            Users only see generic labels like "Advanced AI Intelligence" without technical details.
          </AlertDescription>
        </Alert>

        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/50 shadow-2xl mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                  Mapping Plan → Modele IA (Canonique)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Reference officielle — applique automatiquement a chaque generation de devis
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={applyDefaultMapping}
                className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reappliquer mapping par defaut
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CANONICAL_MAPPING.map((entry) => (
                <div
                  key={entry.tier}
                  className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4"
                >
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plan</div>
                  <div className="text-lg font-semibold text-white capitalize mb-3">{entry.tier}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Modele IA</div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-cyan-300">{entry.label}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 font-mono">{entry.modelId}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/50 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-cyan-400" />
                  Subscription Tiers
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage pricing plans and AI model mappings
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg shadow-cyan-600/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tier
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTier ? 'Edit' : 'Create'} Subscription Tier</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Configure the subscription plan and assign an AI model
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Plan ID (slug)</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., professional"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name" className="text-slate-300">Display Name</Label>
                        <Input
                          id="display_name"
                          value={formData.display_name}
                          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                          placeholder="e.g., Professional"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-300">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="User-facing description of the plan"
                        className="bg-slate-800/50 border-slate-700 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price_monthly" className="text-slate-300">Monthly Price ($)</Label>
                        <Input
                          id="price_monthly"
                          type="number"
                          step="0.01"
                          value={formData.price_monthly}
                          onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price_yearly" className="text-slate-300">Yearly Price ($)</Label>
                        <Input
                          id="price_yearly"
                          type="number"
                          step="0.01"
                          value={formData.price_yearly}
                          onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tier_level" className="text-slate-300">Tier Level</Label>
                        <Input
                          id="tier_level"
                          type="number"
                          value={formData.tier_level}
                          onChange={(e) => setFormData({ ...formData, tier_level: parseInt(e.target.value) })}
                          min="1"
                          required
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                        <p className="text-xs text-slate-500">1=Basic, 2=Pro, 3=Premium, 4+=Enterprise</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sort_order" className="text-slate-300">Sort Order</Label>
                        <Input
                          id="sort_order"
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                      <Label htmlFor="ai_model_id" className="text-cyan-400 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Model Assignment (Admin Only)
                      </Label>
                      <Select value={formData.ai_model_id} onValueChange={(value) => setFormData({ ...formData, ai_model_id: value })}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                          <SelectValue placeholder="Select AI model for this tier" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {aiModels.map((model) => (
                            <SelectItem key={model.id} value={model.id} className="text-white hover:bg-slate-700">
                              {model.display_name} ({model.provider})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">This information is hidden from users</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max_projects" className="text-slate-300">Max Projects/Month</Label>
                        <Input
                          id="max_projects"
                          type="number"
                          value={formData.max_projects_per_month}
                          onChange={(e) => setFormData({ ...formData, max_projects_per_month: parseInt(e.target.value) })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_estimates" className="text-slate-300">Max Estimates/Project</Label>
                        <Input
                          id="max_estimates"
                          type="number"
                          value={formData.max_estimates_per_project}
                          onChange={(e) => setFormData({ ...formData, max_estimates_per_project: parseInt(e.target.value) })}
                          className="bg-slate-800/50 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="priority_support"
                        checked={formData.priority_support}
                        onCheckedChange={(checked) => setFormData({ ...formData, priority_support: checked })}
                      />
                      <Label htmlFor="priority_support" className="text-slate-300">Priority Support</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active" className="text-slate-300">Active</Label>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800">
                        {editingTier ? 'Update' : 'Create'} Tier
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-700/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Tier</TableHead>
                    <TableHead className="text-slate-300">Level</TableHead>
                    <TableHead className="text-slate-300">Price</TableHead>
                    <TableHead className="text-slate-300">AI Model</TableHead>
                    <TableHead className="text-slate-300">Limits</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id} className="border-slate-700/50 hover:bg-slate-800/30">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{tier.display_name}</div>
                          <div className="text-sm text-slate-400">{tier.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <span className="px-2 py-1 rounded bg-slate-700/50 text-xs">Level {tier.tier_level}</span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="text-sm">
                          <div>${tier.price_monthly}/mo</div>
                          <div className="text-xs text-slate-500">${tier.price_yearly}/yr</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tier.ai_model_name ? (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-cyan-400" />
                            <div className="text-sm">
                              <div className="text-white">{tier.ai_model_name}</div>
                              <div className="text-xs text-slate-500">{tier.ai_provider}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">No model assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        <div>{tier.max_projects_per_month} projects/mo</div>
                        <div className="text-xs text-slate-500">{tier.max_estimates_per_project} estimates/project</div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tier.is_active}
                          onCheckedChange={() => handleToggleActive(tier)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tier)}
                          className="text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
