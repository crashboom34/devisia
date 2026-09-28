'use client';

import { useState } from 'react';
import { AlertCircle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

type Item = { poste: string; description?: string; quantity: number; unit: string; unit_price_ht: number; amount_ht: number };
type Category = { name: string; description?: string; items: Item[]; subtotal_ht: number };
type Preliminary = {
  id: string; categories?: Category[]; total_ht?: number;
  estimate_data?: { assumptions?: string[]; missing?: string[]; refinement_version?: number; project_description?: string };
};

const euros = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

export default function PreliminaryEstimateCard({ estimate, currentVersion, projectDescription, onFinalized }: { estimate: Preliminary; currentVersion?: number; projectDescription: string; onFinalized: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedRates, setSelectedRates] = useState<Record<number, number>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const items = (estimate.categories || []).flatMap((category) => category.items || []);
  const stale = (currentVersion !== undefined && estimate.estimate_data?.refinement_version !== currentVersion)
    || (estimate.estimate_data?.project_description !== undefined && estimate.estimate_data.project_description !== projectDescription);
  const incomplete = !!estimate.estimate_data?.missing?.length;

  async function finalize() {
    if (stale || incomplete || !confirmed || Object.keys(selectedRates).length !== items.length) return;
    setSaving(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expirée. Reconnectez-vous.');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/finalize-estimate`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId: estimate.id, confirmed: true, vatRates: items.map((_, index) => selectedRates[index]) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Impossible de finaliser le chiffrage.');
      setOpen(false); onFinalized();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Échec de la validation.');
    } finally { setSaving(false); }
  }

  return <div className="space-y-5 p-4 text-slate-300 sm:p-6">
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p><strong>Estimation préliminaire HT.</strong> Contrôlez les métrés, prix, études et le taux de TVA avant d’établir un devis. Aucun TTC n’est calculé ici.{stale && ' Les réponses du dossier ont changé depuis ce chiffrage : il faut le recalculer.'}</p>
    </div>
    {(estimate.categories || []).map((category, index) => <section key={`${category.name}-${index}`}>
      <h3 className="border-b border-slate-700 pb-2 font-semibold text-white">{category.name}</h3>
      {category.description && <p className="mt-2 text-xs text-slate-400">{category.description}</p>}
      <div className="mt-2 divide-y divide-slate-800">
        {(category.items || []).map((item, i) => <div key={i} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
          <div className="max-w-lg"><p className="font-medium text-slate-200">{item.poste}</p>{item.description && <p className="text-xs text-slate-400">{item.description}</p>}
            <p className="text-xs text-slate-500">{item.quantity} {item.unit} × {euros(item.unit_price_ht)} HT</p></div>
          <strong className="text-white">{euros(item.amount_ht)} HT</strong>
        </div>)}
      </div>
      <p className="text-right text-xs text-slate-400">Sous-total {euros(category.subtotal_ht)} HT</p>
    </section>)}
    <div className="flex items-center justify-between border-t border-cyan-500/30 pt-4 text-white"><span className="font-semibold">Total estimatif HT</span><strong className="text-xl text-cyan-300">{euros(estimate.total_ht || 0)}</strong></div>
    {!!estimate.estimate_data?.assumptions?.length && <div className="rounded-lg bg-slate-950/50 p-4 text-sm"><h3 className="mb-2 flex items-center gap-2 font-medium text-white"><ClipboardCheck className="h-4 w-4" />Hypothèses à contrôler</h3><ul className="list-inside list-disc space-y-1">{estimate.estimate_data.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
    {!!estimate.estimate_data?.missing?.length && <div className="rounded-lg bg-slate-950/50 p-4 text-sm"><h3 className="mb-2 font-medium text-white">Informations à confirmer</h3><ul className="list-inside list-disc space-y-1">{estimate.estimate_data.missing.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
    <div className="border-t border-slate-800 pt-4"><Button type="button" disabled={stale || incomplete} onClick={() => setOpen(true)} className="bg-cyan-600 text-white hover:bg-cyan-500">Préparer le devis après vérification</Button>{stale && <p className="mt-2 text-xs text-amber-300">Actualisez le chiffrage depuis l’onglet Affiner avant cette étape.</p>}{incomplete && <p className="mt-2 text-xs text-amber-300">Complétez les réponses aux points ouverts dans l’onglet Affiner, puis recalculez.</p>}</div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-slate-700 bg-slate-900 text-white">
        <DialogHeader><DialogTitle>Contrôler avant de créer le devis</DialogTitle><DialogDescription className="text-slate-400">Vérifiez les quantités et les prix du dossier. Sélectionnez le taux de TVA applicable à chaque poste après contrôle de la situation fiscale du chantier.</DialogDescription></DialogHeader>
        <div className="space-y-2">{items.map((item, index) => <div key={index} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 py-2 text-sm"><span className="max-w-sm text-slate-200">{item.poste} · {euros(item.amount_ht)} HT</span><label className="text-slate-400">TVA <select aria-label={`TVA ${item.poste}`} value={selectedRates[index] ?? ''} onChange={(event) => setSelectedRates((current) => ({ ...current, [index]: Number(event.target.value) }))} className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-white"><option value="" disabled>À choisir</option><option value="0">0 %</option><option value="5.5">5,5 %</option><option value="10">10 %</option><option value="20">20 %</option></select></label></div>)}</div>
        <label className="flex items-start gap-3 rounded-lg border border-slate-700 p-3 text-sm text-slate-300"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" /><span>J’ai vérifié les postes, quantités, prix et conditions de réalisation, ainsi que les taux de TVA choisis. Les points encore incertains sont traités dans le devis ou feront l’objet d’un contrôle complémentaire.</span></label>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <Button type="button" onClick={finalize} disabled={saving || !confirmed || Object.keys(selectedRates).length !== items.length} className="bg-cyan-600 text-white hover:bg-cyan-500">{saving ? 'Enregistrement…' : 'Créer le devis vérifié'}</Button>
      </DialogContent>
    </Dialog>
  </div>;
}
