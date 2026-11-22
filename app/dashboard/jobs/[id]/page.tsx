'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, Euro, FilePlus2, History, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { getOrganizationEntitlements, hasEntitlement } from '@/lib/entitlements';
import { supabase } from '@/lib/supabase';
import { estimatedCostAtCompletion, validateDailyMinutes, type ActualCostLine, type CostCategory as JobCostCategory } from '@/lib/job-costing';
import type { ChangeOrderStatus } from '@/lib/job-intelligence';
import { normalizeJobCostCatalogKey } from '@/lib/job-cost-catalog';
import { formatCurrencyEUR } from '@/lib/pricing/engine';

type CostCategory = ActualCostLine['category'];

interface Job {
  id: string; organization_id: string; name: string; client_name: string | null; address: string | null;
  status: string; source_project_id: string;
}
const budgetCategories = ['material', 'labor', 'subcontract', 'equipment', 'other'] as const;
type BudgetCategory = typeof budgetCategories[number];
interface FinancialSummary {
  initial_sold_total_ht_cents: number;
  initial_budget_cents: number;
  approved_change_order_count: number;
  approved_sold_delta_cents: number;
  approved_budget_delta_cents: number;
  revised_sold_total_ht_cents: number;
  revised_budget_cents: number;
  actual_cost_cents: number;
  planned_margin_cents: number;
  current_margin_cents: number;
  planned_by_category: Record<BudgetCategory, number>;
  actual_by_category: Record<BudgetCategory, number>;
}
interface CostRow { id: string; category: CostCategory; description: string; amount_ht_cents: number; incurred_on: string }
interface CatalogRow { id: string; category: CostCategory; description: string; description_key: string; amount_ht_cents: number; use_count: number }
interface TimeRow { id: string; minutes: number; work_date: string; employees?: { first_name: string; last_name: string } | null }
interface Employee { id: string; first_name: string; last_name: string; direct_hourly_cost_cents: number | null; employer_monthly_cost_cents: number | null; contracted_weekly_minutes: number | null }
interface ChangeOrderRow {
  id: string; title: string; description: string | null; status: ChangeOrderStatus;
  sold_delta_cents: number; planned_cost_delta_cents: number; cost_category: JobCostCategory;
  approved_on: string | null; created_at: string;
}
interface PerformanceSnapshotRow {
  id: string; version: number; snapshot_kind: 'progress' | 'completion'; progress_percent: number;
  revised_sold_total_ht_cents: number; revised_budget_cents: number; actual_cost_cents: number;
  forecast_cost_cents: number; projected_margin_cents: number; projected_margin_variance_cents: number;
  classification_snapshot: { project_type?: string } | null; captured_at: string;
}

const costCategories: Array<{ value: CostCategory; label: string }> = [
  { value: 'material', label: 'Matériaux' }, { value: 'subcontract', label: 'Sous-traitance' },
  { value: 'equipment', label: 'Matériel' }, { value: 'transport', label: 'Transport' },
  { value: 'consumable', label: 'Consommables' }, { value: 'other', label: 'Autre' },
];

const categoryLabels: Record<JobCostCategory, string> = {
  material: 'Matériaux', labor: 'Main-d’œuvre', subcontract: 'Sous-traitance',
  equipment: 'Matériel', transport: 'Transport', consumable: 'Consommables', other: 'Autres',
};

function signedEurosToCents(value: string): number | null {
  const amount = Number(value.replace(',', '.'));
  if (!Number.isFinite(amount)) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthGuard();
  const [job, setJob] = useState<Job | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogError, setCatalogError] = useState(false);
  const [time, setTime] = useState<TimeRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrderRow[]>([]);
  const [snapshots, setSnapshots] = useState<PerformanceSnapshotRow[]>([]);
  const [historicalReferences, setHistoricalReferences] = useState<PerformanceSnapshotRow[]>([]);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [canUseHistory, setCanUseHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [costCategory, setCostCategory] = useState<CostCategory>('material');
  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [hours, setHours] = useState('');
  const [progress, setProgress] = useState('');
  const [changeOrderTitle, setChangeOrderTitle] = useState('');
  const [changeOrderDescription, setChangeOrderDescription] = useState('');
  const [changeOrderStatus, setChangeOrderStatus] = useState<ChangeOrderStatus>('approved');
  const [changeOrderSold, setChangeOrderSold] = useState('');
  const [changeOrderCost, setChangeOrderCost] = useState('');
  const [changeOrderCategory, setChangeOrderCategory] = useState<JobCostCategory>('other');
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const jobResult = await supabase.from('jobs').select('id, organization_id, name, client_name, address, status, source_project_id').eq('id', params.id).maybeSingle();
    if (jobResult.error) throw jobResult.error;
    if (!jobResult.data) { setJob(null); setSummary(null); return; }
    const loadedJob = jobResult.data as Job;
    const access = await getOrganizationEntitlements(loadedJob.organization_id);
    const historyEnabled = hasEntitlement(access.entitlements, 'historical_cost_learning');
    const [summaryResult, costsResult, timeResult, employeesResult, changeOrdersResult, classificationResult] = await Promise.all([
      supabase.rpc('get_job_financial_summary', { p_job_id: params.id }),
      supabase.from('job_cost_entries').select('id, category, description, amount_ht_cents, incurred_on').eq('job_id', params.id).order('incurred_on', { ascending: false }).order('id', { ascending: false }).limit(8),
      supabase.from('time_entries').select('id, minutes, work_date, employees(first_name,last_name)').eq('job_id', params.id).order('work_date', { ascending: false }).order('id', { ascending: false }).limit(8),
      supabase.from('employees').select('id, first_name, last_name, direct_hourly_cost_cents, employer_monthly_cost_cents, contracted_weekly_minutes').eq('organization_id', loadedJob.organization_id).eq('status', 'active').order('last_name'),
      supabase.from('job_change_orders').select('id, title, description, status, sold_delta_cents, planned_cost_delta_cents, cost_category, approved_on, created_at').eq('job_id', params.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(6),
      supabase.from('quote_classifications').select('project_type').eq('project_id', loadedJob.source_project_id).maybeSingle(),
    ]);
    const firstError = [summaryResult, costsResult, timeResult, employeesResult, changeOrdersResult, classificationResult]
      .find((result) => result.error)?.error;
    if (firstError) throw firstError;
    let loadedSnapshots: PerformanceSnapshotRow[] = [];
    let loadedHistory: PerformanceSnapshotRow[] = [];
    if (historyEnabled) {
      const [snapshotsResult, historyResult] = await Promise.all([
        supabase.from('job_performance_snapshots').select('id, version, snapshot_kind, progress_percent, revised_sold_total_ht_cents, revised_budget_cents, actual_cost_cents, forecast_cost_cents, projected_margin_cents, projected_margin_variance_cents, classification_snapshot, captured_at').eq('job_id', params.id).order('version', { ascending: false }).limit(8),
        supabase.from('job_performance_snapshots').select('id, version, snapshot_kind, progress_percent, revised_sold_total_ht_cents, revised_budget_cents, actual_cost_cents, forecast_cost_cents, projected_margin_cents, projected_margin_variance_cents, classification_snapshot, captured_at').eq('organization_id', loadedJob.organization_id).eq('snapshot_kind', 'completion').neq('job_id', params.id).order('captured_at', { ascending: false }).limit(20),
      ]);
      if (snapshotsResult.error) throw snapshotsResult.error;
      if (historyResult.error) throw historyResult.error;
      loadedSnapshots = (snapshotsResult.data || []) as unknown as PerformanceSnapshotRow[];
      loadedHistory = (historyResult.data || []) as unknown as PerformanceSnapshotRow[];
    }
    const financials = summaryResult.data as FinancialSummary | null;
    if (!financials || ![
      financials.initial_sold_total_ht_cents, financials.initial_budget_cents, financials.approved_change_order_count,
      financials.approved_sold_delta_cents, financials.approved_budget_delta_cents,
      financials.revised_sold_total_ht_cents, financials.revised_budget_cents, financials.actual_cost_cents,
      financials.planned_margin_cents, financials.current_margin_cents,
      ...budgetCategories.flatMap((category) => [
        financials.planned_by_category?.[category], financials.actual_by_category?.[category],
      ]),
    ].every(Number.isSafeInteger)) {
      throw new Error('Invalid job financial summary');
    }
    setJob(loadedJob);
    setSummary(financials);
    setCosts((costsResult.data || []) as CostRow[]);
    setTime((timeResult.data || []) as unknown as TimeRow[]);
    setEmployees((employeesResult.data || []) as Employee[]);
    setChangeOrders((changeOrdersResult.data || []) as ChangeOrderRow[]);
    setCanUseHistory(historyEnabled);
    setSnapshots(loadedSnapshots);
    const loadedProjectType = classificationResult.data?.project_type || null;
    setProjectType(loadedProjectType);
    setHistoricalReferences(loadedHistory
      .filter((snapshot) => !loadedProjectType || snapshot.classification_snapshot?.project_type === loadedProjectType)
      .slice(0, 5));
  }, [params.id, user]);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      await load();
    } catch (error) {
      console.error('[job] loading failed', error);
      setSummary(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (authLoading || !user) return;
    void refresh();
  }, [authLoading, user, refresh]);

  useEffect(() => {
    if (!job) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      let query = supabase.from('job_cost_catalog')
        .select('id, category, description, description_key, amount_ht_cents, use_count')
        .eq('organization_id', job.organization_id)
        .eq('category', costCategory)
        .order('last_used_at', { ascending: false })
        .limit(8);
      const searchKey = normalizeJobCostCatalogKey(catalogQuery).slice(0, 80);
      if (searchKey) query = query.ilike('description_key', `%${searchKey}%`);
      const result = await query;
      if (!active) return;
      setCatalog((result.data || []) as CatalogRow[]);
      setCatalogError(Boolean(result.error));
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [job, costCategory, catalogQuery, costs]);

  const searchKey = normalizeJobCostCatalogKey(catalogQuery);
  const catalogMatches = catalog.filter((entry) => entry.category === costCategory && entry.description_key.includes(searchKey));

  const addCost = async (event: FormEvent) => {
    event.preventDefault();
    if (!job || !user) return;
    const cents = Math.round(Number(costAmount.replace(',', '.')) * 100);
    if (!Number.isSafeInteger(cents) || cents < 0 || !costDescription.trim()) return toast.error('Coût ou description invalide');
    const { error } = await supabase.from('job_cost_entries').insert({
      organization_id: job.organization_id, job_id: job.id, category: costCategory,
      description: costDescription.trim(), amount_ht_cents: cents, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    setCostAmount(''); setCostDescription(''); setCatalogQuery('');
    toast.success('Coût réel enregistré');
    await refresh();
  };

  const addTime = async (event: FormEvent) => {
    event.preventDefault();
    if (!job || !user) return;
    const employee = employees.find((item) => item.id === employeeId);
    const minutes = Math.round(Number(hours.replace(',', '.')) * 60);
    const monthlyHours = employee?.contracted_weekly_minutes ? employee.contracted_weekly_minutes / 60 * 52 / 12 : 35 * 52 / 12;
    const currentHourly = employee?.direct_hourly_cost_cents ?? (employee?.employer_monthly_cost_cents !== null && employee?.employer_monthly_cost_cents !== undefined ? Math.round(employee.employer_monthly_cost_cents / monthlyHours) : null);
    try { validateDailyMinutes(0, minutes); } catch { return toast.error('Salarié, durée ou coût horaire invalide'); }
    if (!employee || currentHourly === null) return toast.error('Salarié, durée ou coût horaire invalide');
    const workDate = new Date().toISOString().slice(0, 10);
    const existingResult = await supabase.from('time_entries')
      .select('id')
      .eq('employee_id', employee.id).eq('job_id', job.id).eq('work_date', workDate)
      .maybeSingle();
    if (existingResult.error) return toast.error(existingResult.error.message);
    const mutation = existingResult.data
      ? await supabase.from('time_entries').update({ minutes, source: 'manual' }).eq('id', existingResult.data.id)
      : await supabase.from('time_entries').insert({
          organization_id: job.organization_id, job_id: job.id, employee_id: employee.id,
          work_date: workDate, minutes, hourly_cost_cents_snapshot: currentHourly,
          source: 'manual', created_by: user.id,
        });
    const { error } = mutation;
    if (error) return toast.error(error.message);
    setHours(''); await refresh(); toast.success('Temps du jour mis à jour avec son coût horaire historique');
  };

  const addChangeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!job || !user) return;
    const soldDeltaCents = signedEurosToCents(changeOrderSold);
    const plannedCostDeltaCents = signedEurosToCents(changeOrderCost);
    if (!changeOrderTitle.trim() || soldDeltaCents === null || plannedCostDeltaCents === null ||
        (soldDeltaCents === 0 && plannedCostDeltaCents === 0)) {
      return toast.error('Titre et montants d’avenant invalides');
    }
    const { error } = await supabase.from('job_change_orders').insert({
      organization_id: job.organization_id,
      job_id: job.id,
      title: changeOrderTitle.trim(),
      description: changeOrderDescription.trim() || null,
      status: changeOrderStatus,
      sold_delta_cents: soldDeltaCents,
      planned_cost_delta_cents: plannedCostDeltaCents,
      cost_category: changeOrderCategory,
      approved_on: changeOrderStatus === 'approved' ? new Date().toISOString().slice(0, 10) : null,
      created_by: user.id,
    });
    if (error) return toast.error(error.message);
    setChangeOrderTitle(''); setChangeOrderDescription(''); setChangeOrderSold(''); setChangeOrderCost('');
    await refresh(); toast.success(changeOrderStatus === 'approved' ? 'Avenant accepté intégré au budget révisé' : 'Avenant enregistré à valider');
  };

  const captureSnapshot = async (complete: boolean) => {
    if (!job) return;
    const progressPercent = Number(progress.replace(',', '.'));
    if (forecastCostCents === null) {
      return toast.error('Saisissez un avancement de 0,01 à 100 % avec deux décimales au maximum');
    }
    if (complete && progressPercent !== 100) return toast.error('Un chantier clôturé doit être à 100 %');
    setSavingSnapshot(true);
    const { error } = await supabase.rpc('capture_job_performance_snapshot', {
      p_job_id: job.id,
      p_progress_percent: progressPercent,
      p_complete: complete,
    });
    setSavingSnapshot(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success(complete ? 'Chantier clôturé et résultat historique archivé' : 'État du chantier archivé');
  };

  if (loading || authLoading || !user) return <DashboardLayout><div className="py-20 text-center text-slate-400">Chargement…</div></DashboardLayout>;
  if (loadError) return <DashboardLayout><div role="alert" className="py-20 text-center text-slate-400">Les données financières sont indisponibles. <button type="button" className="text-cyan-400 underline" onClick={() => void refresh()}>Réessayer</button></div></DashboardLayout>;
  if (!job || job.id !== params.id || !summary) return <DashboardLayout><div className="py-20 text-center text-slate-400">Chantier introuvable ou non accessible.</div></DashboardLayout>;
  let forecastCostCents: number | null = null;
  let forecastTooLarge = false;
  try {
    forecastCostCents = estimatedCostAtCompletion(summary.actual_cost_cents, Number(progress.replace(',', '.')));
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    forecastTooLarge = true;
  }
  const projectedMarginCents = forecastCostCents === null ? null : summary.revised_sold_total_ht_cents - forecastCostCents;
  const projectedVarianceCents = forecastCostCents === null ? null : summary.revised_budget_cents - forecastCostCents;
  const actualVarianceCents = summary.actual_cost_cents - summary.revised_budget_cents;
  const metrics = [
    { label: summary.approved_change_order_count ? 'Vendu révisé' : 'Vendu HT', value: summary.revised_sold_total_ht_cents, icon: Euro, color: 'text-cyan-400' },
    { label: summary.approved_change_order_count ? 'Budget révisé' : 'Budget initial', value: summary.revised_budget_cents, icon: ReceiptText, color: 'text-slate-200' },
    { label: 'Dépensé réel', value: summary.actual_cost_cents, icon: TrendingDown, color: 'text-amber-400' },
    { label: 'Marge actuelle', value: summary.current_margin_cents, icon: TrendingUp, color: summary.current_margin_cents >= 0 ? 'text-emerald-400' : 'text-red-400' },
  ];
  const categoryVariances = budgetCategories.map((category) => {
    const plannedCents = summary.planned_by_category[category];
    const actualCents = summary.actual_by_category[category];
    return { category, plannedCents, actualCents, varianceCents: actualCents - plannedCents };
  }).filter(({ plannedCents, actualCents }) => plannedCents !== 0 || actualCents !== 0)
    .sort((left, right) => right.varianceCents - left.varianceCents);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title={job.name} subtitle={[job.client_name, job.address].filter(Boolean).join(' · ') || 'Pilotage du chantier'} breadcrumbs={[{ label: 'Chantiers', href: '/dashboard/jobs' }, { label: job.name }]} />
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map(({ label, value, icon: Icon, color }) => <Card key={label} className="bg-slate-800/50 border-slate-700/40 min-w-0"><CardContent className="p-4 min-w-0"><Icon className={`h-4 w-4 ${color} mb-2`} /><p className="text-xs text-slate-500">{label}</p><p className={`text-base sm:text-lg font-bold break-words ${color}`}>{formatCurrencyEUR(value / 100)}</p></CardContent></Card>)}
        </div>

        {summary.approved_change_order_count > 0 && <div className="flex gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100"><CheckCircle2 className="h-5 w-5 shrink-0" /><span>{summary.approved_change_order_count} avenant{summary.approved_change_order_count > 1 ? 's' : ''} accepté{summary.approved_change_order_count > 1 ? 's' : ''} : vendu {formatCurrencyEUR(summary.initial_sold_total_ht_cents / 100)} → {formatCurrencyEUR(summary.revised_sold_total_ht_cents / 100)}, budget {formatCurrencyEUR(summary.initial_budget_cents / 100)} → {formatCurrencyEUR(summary.revised_budget_cents / 100)}.</span></div>}

        {summary.actual_cost_cents > summary.revised_budget_cents && <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" /><span>Les coûts réels dépassent le budget de référence de {formatCurrencyEUR(actualVarianceCents / 100)}.</span></div>}

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardHeader><CardTitle className="text-white text-base">Ajouter un coût réel</CardTitle></CardHeader>
            <CardContent><form onSubmit={addCost} className="space-y-3">
              <div><Label>Catégorie</Label><Select value={costCategory} onValueChange={(value) => { setCostCategory(value as CostCategory); setCatalogQuery(''); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{costCategories.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 space-y-2">
                <Label htmlFor="catalog-search">Retrouver un produit déjà saisi</Label>
                <Input id="catalog-search" type="search" value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Rechercher dans cette catégorie" aria-controls="catalog-results" />
                <div id="catalog-results" className="max-h-48 overflow-y-auto space-y-1" aria-live="polite">
                  {catalogMatches.length ? catalogMatches.map((entry) => <button key={entry.id} type="button" onClick={() => { setCostDescription(entry.description); setCostAmount(String(entry.amount_ht_cents / 100)); setCatalogQuery(entry.description); }} className="w-full min-h-11 rounded-lg border border-slate-700/50 px-3 py-2 text-left flex items-center justify-between gap-3 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"><span className="text-sm text-slate-200 break-words min-w-0">{entry.description}</span><span className="text-sm font-medium text-cyan-300 whitespace-nowrap">{formatCurrencyEUR(entry.amount_ht_cents / 100)} HT</span></button>) : <p className="text-xs text-slate-500">{catalogError ? 'Catalogue indisponible pour le moment.' : 'Aucun produit enregistré dans cette catégorie.'}</p>}
                </div>
              </div>
              <div><Label htmlFor="cost-description">Description</Label><Input id="cost-description" value={costDescription} onChange={(event) => setCostDescription(event.target.value)} maxLength={160} required /></div>
              <div><Label htmlFor="cost-amount">Montant HT (€)</Label><Input id="cost-amount" inputMode="decimal" value={costAmount} onChange={(event) => setCostAmount(event.target.value)} required /></div>
              <p className={catalogError ? 'text-xs text-amber-300' : 'text-xs text-slate-500'}>{catalogError ? 'Catalogue indisponible : ce coût peut être enregistré, mais sa réutilisation n’est pas garantie.' : 'La description et le montant HT seront mémorisés automatiquement dans le catalogue de cette catégorie pour les prochains chantiers.'}</p>
              <Button type="submit" variant="primary" className="w-full min-h-11">Enregistrer le coût</Button>
            </form></CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardHeader><CardTitle className="text-white text-base">Ajouter du temps</CardTitle></CardHeader>
            <CardContent>{employees.length ? <form onSubmit={addTime} className="space-y-3">
              <div><Label>Salarié</Label><Select value={employeeId} onValueChange={setEmployeeId}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}{employee.direct_hourly_cost_cents === null && employee.employer_monthly_cost_cents === null ? ' · coût à renseigner' : ''}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="hours">Heures aujourd’hui (total sur ce chantier)</Label><Input id="hours" inputMode="decimal" value={hours} onChange={(event) => setHours(event.target.value)} required /></div>
              <Button type="submit" variant="primary" className="w-full"><Clock3 className="h-4 w-4 mr-2" />Enregistrer le temps</Button>
            </form> : <p className="text-sm text-slate-400">Ajoutez d’abord un salarié dans Équipe. Cette fonction est réservée à Pro.</p>}</CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><FilePlus2 className="h-4 w-4 text-cyan-400" />Avenants</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={addChangeOrder} className="space-y-3">
                <div><Label htmlFor="change-order-title">Objet de l’avenant</Label><Input id="change-order-title" value={changeOrderTitle} onChange={(event) => setChangeOrderTitle(event.target.value)} maxLength={160} placeholder="Ex. Remplacement du receveur" required /></div>
                <div><Label htmlFor="change-order-description">Précision facultative</Label><Input id="change-order-description" value={changeOrderDescription} onChange={(event) => setChangeOrderDescription(event.target.value)} maxLength={1000} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>État</Label><Select value={changeOrderStatus} onValueChange={(value) => setChangeOrderStatus(value as ChangeOrderStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Accepté</SelectItem><SelectItem value="draft">À valider</SelectItem></SelectContent></Select></div>
                  <div><Label>Catégorie de coût</Label><Select value={changeOrderCategory} onValueChange={(value) => setChangeOrderCategory(value as JobCostCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[...costCategories, { value: 'labor' as JobCostCategory, label: 'Main-d’œuvre' }].map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="change-order-sold">Vendu HT ajouté (€)</Label><Input id="change-order-sold" inputMode="decimal" value={changeOrderSold} onChange={(event) => setChangeOrderSold(event.target.value)} placeholder="Ex. 850" required /></div>
                  <div><Label htmlFor="change-order-cost">Coût prévu ajouté (€)</Label><Input id="change-order-cost" inputMode="decimal" value={changeOrderCost} onChange={(event) => setChangeOrderCost(event.target.value)} placeholder="Ex. 420" required /></div>
                </div>
                <p className="text-xs text-slate-500">Une valeur négative représente une réduction. Seuls les avenants acceptés modifient les indicateurs.</p>
                <Button type="submit" variant="primary" className="w-full">Enregistrer l’avenant</Button>
              </form>
              <div className="space-y-2">
                {changeOrders.length ? changeOrders.map((entry) => <div key={entry.id} className="rounded-lg border border-slate-700/50 p-3 text-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-white">{entry.title}</p><p className="text-xs text-slate-500">{entry.status === 'approved' ? 'Accepté' : entry.status === 'draft' ? 'À valider' : 'Rejeté'} · {categoryLabels[entry.cost_category]}</p></div><span className={entry.status === 'approved' ? 'text-cyan-300' : 'text-slate-400'}>{entry.sold_delta_cents >= 0 ? '+' : ''}{formatCurrencyEUR(entry.sold_delta_cents / 100)}</span></div><p className="mt-1 text-xs text-slate-400">Impact budget : {entry.planned_cost_delta_cents >= 0 ? '+' : ''}{formatCurrencyEUR(entry.planned_cost_delta_cents / 100)}</p></div>) : <p className="text-sm text-slate-500">Aucun avenant enregistré.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-400" />Analyse des écarts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {categoryVariances.length ? categoryVariances.map(({ category, plannedCents, actualCents, varianceCents }) => <div key={category} className="rounded-lg border border-slate-700/50 p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-200">{categoryLabels[category]}</span><span className={varianceCents > 0 ? 'text-red-300' : varianceCents < 0 ? 'text-emerald-300' : 'text-slate-400'}>{varianceCents > 0 ? '+' : ''}{formatCurrencyEUR(varianceCents / 100)}</span></div><div className="mt-1 flex justify-between text-xs text-slate-500"><span>Prévu {formatCurrencyEUR(plannedCents / 100)}</span><span>Réel {formatCurrencyEUR(actualCents / 100)}</span></div></div>) : <p className="text-sm text-slate-500">Les écarts apparaîtront dès que le budget ou le réel sera renseigné.</p>}
              <div className="border-t border-slate-700/50 pt-3 text-sm"><div className="flex justify-between"><span className="text-slate-400">Marge initiale</span><span className="font-semibold text-white">{formatCurrencyEUR((summary.initial_sold_total_ht_cents - summary.initial_budget_cents) / 100)}</span></div><div className="mt-2 flex justify-between"><span className="text-slate-400">Marge prévue révisée</span><span className="font-semibold text-white">{formatCurrencyEUR(summary.planned_margin_cents / 100)}</span></div>{projectedMarginCents !== null && projectedVarianceCents !== null && <><div className="mt-2 flex justify-between"><span className="text-slate-400">Marge finale estimée</span><span className={projectedMarginCents >= 0 ? 'font-semibold text-emerald-300' : 'font-semibold text-red-300'}>{formatCurrencyEUR(projectedMarginCents / 100)}</span></div><div className="mt-2 flex justify-between"><span className="text-slate-400">Écart de marge projeté</span><span className={projectedVarianceCents >= 0 ? 'text-emerald-300' : 'text-red-300'}>{projectedVarianceCents > 0 ? '+' : ''}{formatCurrencyEUR(projectedVarianceCents / 100)}</span></div></>}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardHeader><CardTitle className="text-white text-base">Projection fin de chantier</CardTitle></CardHeader>
          <CardContent className="space-y-4"><div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end"><div><Label htmlFor="progress">Avancement physique (%)</Label><Input id="progress" inputMode="decimal" value={progress} onChange={(event) => setProgress(event.target.value)} placeholder="Ex. 70" /></div><div className="min-w-52"><p className="text-xs text-slate-500">Coût estimé à terminaison</p><p className="text-xl font-bold text-white">{forecastCostCents === null ? '—' : formatCurrencyEUR(forecastCostCents / 100)}</p>{forecastTooLarge && <p role="alert" className="text-xs text-amber-300">La projection dépasse le montant calculable.</p>}</div></div>{canUseHistory ? <><div className="flex flex-col sm:flex-row gap-3"><Button type="button" variant="outline" className="flex-1" disabled={savingSnapshot || forecastCostCents === null} onClick={() => captureSnapshot(false)}><History className="mr-2 h-4 w-4" />Archiver cet état</Button>{Number(progress.replace(',', '.')) === 100 && job.status !== 'completed' && <Button type="button" variant="primary" className="flex-1" disabled={savingSnapshot} onClick={() => captureSnapshot(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Clôturer le chantier</Button>}</div>{snapshots[0] && <p className="text-xs text-slate-500">Dernier état archivé : version {snapshots[0].version}, {Number(snapshots[0].progress_percent).toLocaleString('fr-FR')} % le {new Date(snapshots[0].captured_at).toLocaleDateString('fr-FR')}.</p>}</> : <p className="text-xs text-slate-500">L’archivage des états et l’apprentissage historique sont disponibles avec l’offre Pro.</p>}</CardContent>
        </Card>

        {canUseHistory && <Card className="bg-slate-800/40 border-slate-700/40">
          <CardHeader><CardTitle className="text-white text-base">Références historiques comparables</CardTitle></CardHeader>
          <CardContent className="space-y-2">{historicalReferences.length ? historicalReferences.map((snapshot) => <div key={snapshot.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-slate-700/50 p-3 text-sm"><div><p className="text-xs text-slate-500">Type</p><p className="text-slate-200">{snapshot.classification_snapshot?.project_type || 'Chantier'}</p></div><div><p className="text-xs text-slate-500">Vendu final</p><p className="text-white">{formatCurrencyEUR(snapshot.revised_sold_total_ht_cents / 100)}</p></div><div><p className="text-xs text-slate-500">Coût réel</p><p className="text-white">{formatCurrencyEUR(snapshot.actual_cost_cents / 100)}</p></div><div><p className="text-xs text-slate-500">Marge finale</p><p className={snapshot.projected_margin_cents >= 0 ? 'text-emerald-300' : 'text-red-300'}>{formatCurrencyEUR(snapshot.projected_margin_cents / 100)}</p></div></div>) : <p className="text-sm text-slate-500">Aucun chantier {projectType ? `« ${projectType} » ` : ''}clôturé n’est encore disponible. Les futurs résultats resteront isolés dans votre entreprise.</p>}</CardContent>
        </Card>}

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="min-w-0 bg-slate-800/40 border-slate-700/40"><CardHeader><CardTitle className="text-white text-base">Derniers coûts</CardTitle></CardHeader><CardContent className="space-y-2">{costs.length ? costs.map((entry) => <div key={entry.id} className="flex justify-between gap-3 border-b border-slate-700/40 py-2 text-sm"><span className="min-w-0 text-slate-300 truncate">{entry.description}</span><span className="text-white whitespace-nowrap">{formatCurrencyEUR(entry.amount_ht_cents / 100)}</span></div>) : <p className="text-sm text-slate-500">Aucun coût saisi.</p>}</CardContent></Card>
          <Card className="min-w-0 bg-slate-800/40 border-slate-700/40"><CardHeader><CardTitle className="text-white text-base">Derniers temps</CardTitle></CardHeader><CardContent className="space-y-2">{time.length ? time.map((entry) => <div key={entry.id} className="flex justify-between gap-3 border-b border-slate-700/40 py-2 text-sm"><span className="min-w-0 text-slate-300 truncate">{entry.employees ? `${entry.employees.first_name} ${entry.employees.last_name}` : 'Salarié'} · {entry.work_date}</span><span className="text-white whitespace-nowrap">{(entry.minutes / 60).toLocaleString('fr-FR')} h</span></div>) : <p className="text-sm text-slate-500">Aucun temps saisi.</p>}</CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
