'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldAlert, UserRoundPlus, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { getOrganizationEntitlements, hasEntitlement } from '@/lib/entitlements';
import { formatCurrencyEUR } from '@/lib/pricing/engine';
import { buildEmployerCostEstimate, buildManualEmployerCostEstimate, eurosToCents, fetchUrssafEmployerCost } from '@/lib/team-cost';
import { supabase } from '@/lib/supabase';

interface Employee {
  id: string; first_name: string; last_name: string; job_title: string | null;
  gross_monthly_salary_cents: number | null; employer_monthly_cost_cents: number | null;
  other_monthly_employer_cost_cents: number; contracted_weekly_minutes: number | null;
  direct_hourly_cost_cents: number | null;
  cost_source: 'urssaf' | 'manual' | 'legacy';
  revision: number;
}

function hasCompleteCost(employee: Employee): boolean {
  return employee.cost_source !== 'legacy' && employee.gross_monthly_salary_cents !== null
    && employee.employer_monthly_cost_cents !== null && employee.direct_hourly_cost_cents !== null;
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [organizationId, setOrganizationId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRevision, setEditingRevision] = useState<number | null>(null);
  const [grossSalary, setGrossSalary] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('35');
  const [otherCosts, setOtherCosts] = useState('0');
  const [calculationMode, setCalculationMode] = useState<'automatic' | 'manual'>('automatic');
  const [manualHourlyCost, setManualHourlyCost] = useState('');
  const [urssafCost, setUrssafCost] = useState<number | null>(null);
  const [calculatedGrossCents, setCalculatedGrossCents] = useState<number | null>(null);
  const [calculatedWeeklyHours, setCalculatedWeeklyHours] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const membership = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).in('role', ['owner', 'admin']).limit(1).maybeSingle();
    if (membership.error) throw membership.error;
    const orgId = membership.data?.organization_id || '';
    setOrganizationId(orgId);
    if (!orgId) { setAllowed(false); setLoading(false); return; }
    const access = await getOrganizationEntitlements(orgId);
    const canManage = hasEntitlement(access.entitlements, 'team_management');
    setAllowed(canManage);
    if (!canManage) { setLoading(false); return; }
    if (orgId) {
      const result = await supabase.from('employees').select('id, first_name, last_name, job_title, gross_monthly_salary_cents, employer_monthly_cost_cents, other_monthly_employer_cost_cents, contracted_weekly_minutes, direct_hourly_cost_cents, cost_source, revision').eq('organization_id', orgId).eq('status', 'active').order('last_name');
      if (result.error) throw result.error;
      setEmployees((result.data || []) as Employee[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    load().catch(() => { console.error('[team] loading failed'); toast.error('Chargement de l’équipe impossible'); setLoading(false); });
  }, [authLoading, user, load]);

  const grossCents = eurosToCents(grossSalary);
  const extraCents = eurosToCents(otherCosts);
  const manualHourlyCents = eurosToCents(manualHourlyCost);
  const hours = Number(weeklyHours.replace(',', '.'));

  useEffect(() => {
    setUrssafCost(null);
    setCalculatedGrossCents(null);
    setCalculatedWeeklyHours(null);
    setCalculationError('');
    if (calculationMode === 'manual' || grossCents === null || grossCents <= 0 || !Number.isFinite(hours) || hours <= 0 || hours > 60) { setCalculating(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCalculating(true);
      try {
        const cost = await fetchUrssafEmployerCost(grossCents, hours, controller.signal);
        if (!controller.signal.aborted) { setUrssafCost(cost); setCalculatedGrossCents(grossCents); setCalculatedWeeklyHours(hours); }
      }
      catch (error) { if (!controller.signal.aborted) setCalculationError(error instanceof Error ? error.message : 'Calcul impossible'); }
      finally { if (!controller.signal.aborted) setCalculating(false); }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [grossCents, hours, calculationMode]);

  const estimate = useMemo(() => {
    if (grossCents === null || extraCents === null) return null;
    if (calculationMode === 'manual') return manualHourlyCents === null ? null : buildManualEmployerCostEstimate(grossCents, hours, manualHourlyCents, extraCents);
    return calculatedGrossCents === grossCents && calculatedWeeklyHours === hours && urssafCost !== null
      ? buildEmployerCostEstimate(grossCents, urssafCost, hours, extraCents) : null;
  }, [calculationMode, grossCents, extraCents, manualHourlyCents, hours, calculatedGrossCents, calculatedWeeklyHours, urssafCost]);
  const monthlyTotal = employees.reduce((total, employee) => total + (hasCompleteCost(employee) ? employee.employer_monthly_cost_cents || 0 : 0), 0);
  const missingCosts = employees.filter((employee) => !hasCompleteCost(employee)).length;

  const resetForm = () => {
    setEditingId(null); setEditingRevision(null); setFirstName(''); setLastName(''); setJobTitle('');
    setGrossSalary(''); setWeeklyHours('35'); setOtherCosts('0');
    setCalculationMode('automatic'); setManualHourlyCost('');
  };

  const startEditing = (employee: Employee) => {
    setEditingId(employee.id); setEditingRevision(employee.revision); setFirstName(employee.first_name); setLastName(employee.last_name);
    setJobTitle(employee.job_title || '');
    setGrossSalary(employee.gross_monthly_salary_cents === null ? '' : String(employee.gross_monthly_salary_cents / 100));
    setWeeklyHours(String((employee.contracted_weekly_minutes || 2100) / 60));
    setOtherCosts(String((employee.other_monthly_employer_cost_cents || 0) / 100));
    setCalculationMode(employee.cost_source === 'manual' ? 'manual' : 'automatic');
    setManualHourlyCost(employee.cost_source === 'manual' && employee.direct_hourly_cost_cents !== null ? String(employee.direct_hourly_cost_cents / 100) : '');
    document.getElementById('team-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!organizationId || !firstName.trim() || !lastName.trim() || !estimate || calculating || !Number.isInteger(hours * 60)) return toast.error('Saisissez le brut et un coût horaire chargé valide, ou attendez le calcul Urssaf');
    if (editingId && editingRevision === null) return toast.error('Rechargez cette fiche avant de la modifier.');
    const payload = {
      first_name: firstName.trim(), last_name: lastName.trim(), job_title: jobTitle.trim() || null,
      gross_monthly_salary_cents: estimate.grossMonthlyCents,
      other_monthly_employer_cost_cents: estimate.extraMonthlyCostCents,
      contracted_weekly_minutes: Math.round(hours * 60),
      employer_monthly_cost_cents: estimate.totalMonthlyCostCents,
      direct_hourly_cost_cents: estimate.hourlyCostCents,
      hourly_cost_is_estimated: estimate.source === 'urssaf',
      cost_source: estimate.source,
    };
    setSaving(true);
    try {
      const { data, error } = editingId
        ? await supabase.from('employees').update(payload).eq('id', editingId).eq('organization_id', organizationId).eq('revision', editingRevision).select('id').maybeSingle()
        : await supabase.from('employees').insert({ ...payload, organization_id: organizationId }).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Cette fiche a été modifiée ailleurs. Rechargez la page avant de réessayer.');
      const wasEditing = Boolean(editingId);
      resetForm();
      toast.success(wasEditing ? 'Salarié mis à jour' : 'Salarié ajouté');
      try { await load(); } catch { toast.warning('Enregistré, mais la liste n’a pas pu être actualisée. Rechargez la page.'); }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-5 min-w-0">
        <PageHeader title="Équipe" subtitle="Salaires et coûts internes. Ces données ne figurent jamais sur le devis client." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Équipe' }]} />
        {!loading && allowed === false ? (
          <Card className="bg-slate-800/40 border-slate-700/40"><CardContent className="p-8 text-center"><ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-3" /><h2 className="text-lg font-semibold text-white">Gestion d’équipe réservée à Pro</h2><p className="text-sm text-slate-400 mt-2">La restriction est appliquée dans l’interface et dans les politiques RLS.</p></CardContent></Card>
        ) : loading ? <div className="py-16 text-center text-slate-400">Chargement…</div> : (<>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="bg-slate-800/40 border-slate-700/40"><CardContent className="p-4"><p className="text-sm text-slate-400">{missingCosts ? 'Coût connu / mois (incomplet)' : 'Coût total de l’équipe / mois'}</p><p className="text-2xl font-bold text-white break-words">{formatCurrencyEUR(monthlyTotal / 100)}</p></CardContent></Card>
            <Card className="bg-slate-800/40 border-slate-700/40"><CardContent className="p-4"><p className="text-sm text-slate-400">{missingCosts ? 'Projection connue / an (incomplète)' : 'Projection annuelle de l’équipe (×12)'}</p><p className="text-2xl font-bold text-cyan-300 break-words">{formatCurrencyEUR(monthlyTotal * 12 / 100)}</p></CardContent></Card>
          </div>
          {missingCosts > 0 && <p className="text-xs text-amber-300">{missingCosts} fiche(s) anciennes ou incomplètes sont exclues des totaux. Vérifiez leur salaire brut puis enregistrez-les pour recalculer les charges.</p>}
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] gap-5 min-w-0">
            <Card className="bg-slate-800/40 border-slate-700/40">
              <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><UsersRound className="h-4 w-4 text-cyan-400" />Salariés actifs</CardTitle></CardHeader>
              <CardContent className="space-y-3">{employees.length ? employees.map((employee) => {
                const complete = hasCompleteCost(employee);
                return <div key={employee.id} className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-white break-words">{employee.first_name} {employee.last_name}</p><p className="text-xs text-slate-500">{employee.job_title || 'Métier non précisé'}</p></div><Button type="button" variant="outline" size="sm" onClick={() => startEditing(employee)}>Modifier</Button></div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div><p className="text-xs text-slate-500">Brut mensuel</p><p className="text-slate-200">{employee.gross_monthly_salary_cents === null ? 'À renseigner' : formatCurrencyEUR(employee.gross_monthly_salary_cents / 100)}</p></div>
                    <div><p className="text-xs text-slate-500">Coût employeur / mois</p><p className="text-slate-200">{complete ? formatCurrencyEUR(employee.employer_monthly_cost_cents! / 100) : 'À recalculer'}</p></div>
                    <div><p className="text-xs text-slate-500">Coût employeur / an</p><p className="text-slate-200">{complete ? formatCurrencyEUR(employee.employer_monthly_cost_cents! * 12 / 100) : '—'}</p></div>
                    <div><p className="text-xs text-slate-500">Coût / heure contractuelle</p><p className="font-semibold text-cyan-300">{complete ? `${formatCurrencyEUR(employee.direct_hourly_cost_cents! / 100)}/h` : 'À recalculer'}</p></div>
                  </div>
                  <p className="text-xs text-amber-400 mt-2">{employee.cost_source === 'legacy' ? 'Ancienne fiche : vérifiez le brut et recalculez.' : employee.cost_source === 'manual' ? 'Coût horaire saisi manuellement' : 'Estimation indicative Urssaf'}</p>
                </div>;
              }) : <p className="text-sm text-slate-500">Aucun salarié actif.</p>}</CardContent>
            </Card>
            <Card id="team-form" className="bg-slate-800/40 border-slate-700/40 scroll-mt-20 min-w-0">
              <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><UserRoundPlus className="h-4 w-4 text-cyan-400" />{editingId ? 'Modifier un salarié' : 'Ajouter un salarié'}</CardTitle></CardHeader>
              <CardContent><form onSubmit={addEmployee} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label htmlFor="first-name">Prénom</Label><Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></div><div><Label htmlFor="last-name">Nom</Label><Input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></div></div>
                <div><Label htmlFor="job-title">Métier</Label><Input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Maçon, peintre…" /></div>
                <div><Label htmlFor="gross-salary">Salaire brut mensuel (€)</Label><Input id="gross-salary" inputMode="decimal" value={grossSalary} onChange={(event) => setGrossSalary(event.target.value)} placeholder="Ex. 3000" required /></div>
                <div><Label htmlFor="weekly-hours">Heures contractuelles par semaine</Label><Input id="weekly-hours" inputMode="decimal" value={weeklyHours} onChange={(event) => setWeeklyHours(event.target.value)} required /></div>
                <div><Label htmlFor="other-costs">Autres frais employeur mensuels (€)</Label><Input id="other-costs" inputMode="decimal" value={otherCosts} onChange={(event) => setOtherCosts(event.target.value)} placeholder="Mutuelle, panier, transport…" /><p className="mt-1 text-xs text-slate-500">Facultatif. En saisie manuelle, ces frais doivent déjà être compris dans le coût horaire chargé.</p></div>
                <Button type="button" variant="outline" className="w-full min-h-11" onClick={() => setCalculationMode((mode) => mode === 'automatic' ? 'manual' : 'automatic')}>
                  {calculationMode === 'automatic' ? 'Saisir le coût horaire chargé moi-même' : 'Utiliser le calcul Urssaf'}
                </Button>
                {calculationMode === 'manual' && <div><Label htmlFor="manual-hourly-cost">Coût horaire chargé (€ / h, tous frais compris)</Label><Input id="manual-hourly-cost" inputMode="decimal" value={manualHourlyCost} onChange={(event) => setManualHourlyCost(event.target.value)} placeholder="Ex. 35,50" required /><p className="mt-1 text-xs text-slate-500">Le total mensuel est une projection à partir des heures contractuelles. Les cotisations ne sont pas détaillées.</p></div>}
                <div aria-live="polite" className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4 space-y-2 text-sm">
                  {calculationMode === 'automatic' && calculating ? <p className="text-cyan-200">Calcul des cotisations Urssaf…</p> : calculationMode === 'automatic' && calculationError ? <p className="text-amber-300">{calculationError}. Vous pouvez saisir le coût horaire chargé manuellement.</p> : estimate ? <>
                    <div className="flex justify-between gap-2"><span className="text-slate-400">Brut mensuel</span><span>{formatCurrencyEUR(estimate.grossMonthlyCents / 100)}</span></div>
                    {estimate.employerContributionsCents !== null && <div className="flex justify-between gap-2"><span className="text-slate-400">Cotisations employeur estimées</span><span>{formatCurrencyEUR(estimate.employerContributionsCents / 100)}</span></div>}
                    <div className="flex justify-between gap-2"><span className="text-slate-400">Autres frais</span><span>{formatCurrencyEUR(estimate.extraMonthlyCostCents / 100)}</span></div>
                    <div className="flex justify-between gap-2 border-t border-slate-700 pt-2 font-semibold"><span>Coût employeur / mois</span><span className="text-cyan-300">{formatCurrencyEUR(estimate.totalMonthlyCostCents / 100)}</span></div>
                    <div className="flex justify-between gap-2"><span>Coût horaire ({estimate.paidMonthlyHours.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} h/mois)</span><span className="text-cyan-300">{formatCurrencyEUR(estimate.hourlyCostCents / 100)}/h</span></div>
                    <p className="text-xs text-slate-500">Source : {estimate.source === 'urssaf' ? 'simulation Urssaf' : 'saisie manuelle'}.</p>
                  </> : <p className="text-slate-400">{calculationMode === 'manual' ? 'Saisissez un coût horaire chargé couvrant au moins le brut et les autres frais.' : 'Saisissez le salaire brut pour obtenir une estimation.'}</p>}
                </div>
                <p className="text-xs text-slate-500">Estimation indicative du coût employeur. Le résultat peut varier selon le salarié, l’établissement, les exonérations, les taux AT/MP, le versement mobilité ou les heures supplémentaires. Vérifiez avec votre comptable. En mode automatique, seuls le brut et la durée hebdomadaire sont transmis à l’Urssaf, sans nom.</p>
                <Button type="submit" variant="primary" className="w-full min-h-11" disabled={!estimate || calculating || saving}>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Ajouter le salarié'}</Button>
                {editingId && <Button type="button" variant="outline" className="w-full min-h-11" onClick={resetForm}>Annuler</Button>}
              </form></CardContent>
            </Card>
          </div></>
        )}
      </div>
    </DashboardLayout>
  );
}
