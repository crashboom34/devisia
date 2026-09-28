'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileText, Keyboard, Mic, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/DashboardLayout';
import VoiceRecorder from '@/components/VoiceRecorder';
import { supabase } from '@/lib/supabase';
import { canCreateProject } from '@/lib/subscription-helper';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !title.trim() || !description.trim() || loading) return;
    setLoading(true);
    try {
      const permission = await canCreateProject(user.id);
      if (!permission.allowed) {
        toast.error(permission.message || 'Limite de projets atteinte');
        if (permission.upgrade_url) router.push(permission.upgrade_url);
        return;
      }
      const { data, error } = await supabase.from('projects').insert({
        user_id: user.id, title: title.trim(), description: description.trim(), status: 'draft',
      }).select('id').single();
      if (error) throw error;
      router.push(`/project/${data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le projet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="mx-auto max-w-3xl px-1 pb-12">
        <Link href="/dashboard" className="mb-7 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Retour aux projets
        </Link>
        <div className="mb-7 max-w-xl">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <FileText className="h-5 w-5" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Nouveau chantier</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Décrivez les travaux.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            Devisia conservera votre description, puis vous posera les questions qui peuvent changer le périmètre ou le prix. Vous déciderez quand lancer le chiffrage.
          </p>
        </div>

        <Card className="border-slate-700/60 bg-slate-900/70 shadow-xl shadow-slate-950/20">
          <CardContent className="p-5 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-title" className="text-slate-200">Nom du chantier</Label>
                <Input id="project-title" autoComplete="off" maxLength={120} required value={title}
                  onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Extension et toit-terrasse à Montarnaud"
                  className="border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-500" />
              </div>
              <div className="space-y-3">
                <Label className="text-slate-200">Description des travaux</Label>
                <Tabs defaultValue="text">
                  <TabsList className="mb-3 grid w-full grid-cols-2 border border-slate-700 bg-slate-950/50 sm:w-64">
                    <TabsTrigger value="text"><Keyboard className="mr-2 h-4 w-4" /> Écrire</TabsTrigger>
                    <TabsTrigger value="voice"><Mic className="mr-2 h-4 w-4" /> Dicter</TabsTrigger>
                  </TabsList>
                  <TabsContent value="text">
                    <Textarea id="project-description" aria-label="Description des travaux" required rows={10} maxLength={20000}
                      value={description} onChange={(event) => setDescription(event.target.value)}
                      placeholder="Décrivez librement les surfaces, la structure existante, les fournitures et les travaux envisagés…"
                      className="min-h-[240px] resize-y border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-500" />
                  </TabsContent>
                  <TabsContent value="voice">
                    <VoiceRecorder value={description} onChange={setDescription} placeholder="Dictez la description du chantier" />
                  </TabsContent>
                </Tabs>
                <p className="text-xs text-slate-500">Vous pourrez compléter et corriger les informations avant de créer un devis.</p>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/dashboard"><Button type="button" variant="ghost" className="w-full text-slate-400 sm:w-auto">Annuler</Button></Link>
                <Button type="submit" disabled={authLoading || loading || !title.trim() || !description.trim()}
                  className="w-full bg-cyan-600 text-white hover:bg-cyan-500 sm:w-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Créer le dossier de chantier
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
