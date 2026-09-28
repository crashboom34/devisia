'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, ClipboardList, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import type { RefinementState } from '@/supabase/functions/_shared/btp-refinement';
import { toast } from 'sonner';

interface Props { projectId: string; onEstimateCreated: () => void; onStateChanged?: (version: number) => void }

export default function ProjectRefinement({ projectId, onEstimateCreated, onStateChanged }: Props) {
  const [state, setState] = useState<RefinementState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<'questions' | 'estimate' | null>(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const started = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: readError } = await supabase.from('project_refinements').select('*')
      .eq('project_id', projectId).maybeSingle();
    if (readError) setError('Le dossier d’affinage est indisponible. Vérifiez que sa mise à jour a été installée.');
    else { setState(data as RefinementState | null); if (data) onStateChanged?.(data.version); setError(''); }
    setLoading(false);
  }, [projectId, onStateChanged]);

  useEffect(() => { void load(); }, [load]);

  async function invoke(name: string, payload: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Session expirée, reconnectez-vous.');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) throw new Error('Configuration Supabase manquante.');
    const result = await fetch(`${url}/functions/v1/${name}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await result.json().catch(() => ({}));
    if (!result.ok) throw new Error(body.error || 'La demande a échoué.');
    return body;
  }

  async function ask(nextAnswers?: { id: string; value: string }[]) {
    setWorking('questions'); setError('');
    try {
      const result = await invoke('refine-project', {
        projectId, expectedVersion: state?.version ?? 0,
        ...(nextAnswers ? { answers: nextAnswers } : {}),
      });
      setState(result.refinement);
      onStateChanged?.(result.refinement.version);
      setAnswers({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de poursuivre l’analyse.');
      await load();
    } finally {
      setWorking(null);
    }
  }

  useEffect(() => {
    if (!loading && !state && !error && !started.current) {
      started.current = true;
      void ask();
    }
  // The initial analysis runs once after the saved dossier has loaded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, state, error]);

  async function createPreliminary() {
    if (!state) return;
    setWorking('estimate'); setError('');
    try {
      await invoke('generate-estimate', { projectId, scenarioType: 'standard', refinementVersion: state.version });
      toast.success('Estimation préliminaire créée. Vérifiez les montants et la TVA avant remise.');
      onEstimateCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Le chiffrage a échoué.');
    } finally { setWorking(null); }
  }

  if (loading) return <div className="rounded-xl border border-slate-700 p-8 text-center text-slate-400"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Chargement du dossier…</div>;

  const open = state?.questions.filter((question) => question.status === 'OPEN') || [];
  const answered = state?.questions.filter((question) => question.status === 'ANSWERED') || [];
  const ready = open.map((q) => ({ id: q.id, value: answers[q.id]?.trim() || '' })).filter((answer) => answer.value);

  return (
    <div className="space-y-5" aria-live="polite">
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-3 text-cyan-300"><ClipboardList className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">Dossier de chantier</span></div>
        <h2 className="text-xl font-semibold text-white sm:text-2xl">Préciser les travaux avant de chiffrer</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Quelques réponses peuvent modifier les quantités, la méthode de pose ou les prestations comprises. Vos réponses restent enregistrées avec le projet.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">{answered.length} réponse{answered.length > 1 ? 's' : ''} enregistrée{answered.length > 1 ? 's' : ''}</span>
          <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">{open.length} question{open.length > 1 ? 's' : ''} ouverte{open.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      {!state && !error && <Card className="border-slate-700 bg-slate-900"><CardContent className="p-6"><p className="mb-4 text-sm text-slate-300">{working ? 'Recherche des questions utiles…' : 'La description est enregistrée. Lancez l’analyse pour recevoir les premières questions utiles.'}</p><Button disabled={!!working} onClick={() => ask()} className="bg-cyan-600 hover:bg-cyan-500">{working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Analyser le chantier</Button></CardContent></Card>}

      {state && open.length > 0 && <div className="space-y-3">
        {open.map((question, index) => <Card key={question.id} className="border-slate-700 bg-slate-900/80"><CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-semibold text-cyan-300">{index + 1}</span><div><label htmlFor={`answer-${question.id}`} className="font-medium leading-6 text-white">{question.text}</label>{question.why && <p className="mt-1 text-xs leading-5 text-slate-400">{question.why}</p>}</div></div>
          <Textarea id={`answer-${question.id}`} value={answers[question.id] || ''} maxLength={2000} rows={2} disabled={!!working}
            onChange={(event) => setAnswers((previous) => ({ ...previous, [question.id]: event.target.value }))}
            placeholder="Votre réponse, même approximative…" className="border-slate-700 bg-slate-950/50 text-white placeholder:text-slate-500" />
          <button type="button" disabled={!!working} onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: 'Je ne sais pas' }))} className="text-xs text-cyan-300 underline-offset-4 hover:underline">Je ne sais pas encore</button>
        </CardContent></Card>)}
        <Button disabled={!ready.length || !!working} onClick={() => ask(ready)} className="w-full bg-cyan-600 hover:bg-cyan-500 sm:w-auto">
          {working === 'questions' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
          Enregistrer et poursuivre
        </Button>
      </div>}

      {state && open.length === 0 && <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="flex items-start gap-3 p-5"><Check className="mt-0.5 h-5 w-5 text-emerald-300" /><div><p className="font-medium text-white">Première analyse terminée</p><p className="mt-1 text-sm text-slate-400">Vous pouvez poursuivre l’échange ou lancer une estimation préliminaire.</p><Button variant="ghost" size="sm" disabled={!!working} onClick={() => ask()} className="mt-2 px-0 text-cyan-300 hover:text-white"><RefreshCw className="mr-2 h-4 w-4" />Chercher d’autres points à préciser</Button></div></CardContent></Card>}

      {answered.length > 0 && <details className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300"><summary className="cursor-pointer font-medium text-white">Réponses enregistrées ({answered.length})</summary><div className="mt-4 space-y-3">{answered.map((q) => <div key={q.id} className="border-t border-slate-800 pt-3"><p className="text-slate-400">{q.text}</p><p className="mt-1 whitespace-pre-wrap text-white">{q.answer}</p></div>)}</div></details>}

      {state && <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-md text-xs leading-5 text-slate-400">Le chiffrage est une estimation à contrôler : les études, quantités, prix fournisseurs et taux de TVA non confirmés restent à vérifier.</p><Button disabled={!!working} onClick={createPreliminary} variant="outline" className="shrink-0 border-cyan-600/60 text-cyan-200 hover:bg-cyan-500/10">{working === 'estimate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Chiffrer avec les informations actuelles</Button></div>}
    </div>
  );
}
