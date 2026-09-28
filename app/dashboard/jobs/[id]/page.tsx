'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, Clock3, Euro, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { supabase } from '@/lib/supabase';
import { calculateJobProfitability, estimatedCostAtCompletion, type ActualCostLine, type PlannedCostLine, type TimeCostLine } from '@/lib/job-costing';
import { formatCurrencyEUR } from '@/lib/pricing/engine';

type CostCategory = ActualCostLine['category'];

interface Job {
  id: string; organization_id: string; name: string; client_name: string | null; address: string | null;
  status: string; sold_total_ht_cents: number; initial_budget_cents: number;
}
interface Budget { material_cents: number; labor_cents: number; subcontract_cents: number; equipment_cents: number; other_cents: number }
interface CostRow { id: string; category: CostCategory; description: string; amount_ht_cents: number; incurred_on: string }
interface TimeRow { id: string; minutes: number; hourly_cost_cents_snapshot: number; work_date: string; employees?: { first_name: string; last_name: string } | null }
interface Employee { id: string; first_name: string; last_name: string; direct_hourly_cost_cents: number | null; employer_monthly_cost_cents: number | null }

const costCategories: Array<{ value: CostCategory; label: string }> = [
  { value: 'material', label: 'Matériaux' }, { value: 'subcontract', label: 'Sous-traitance' },
  { value: 'equipment', label: 'Matériel' }, { value: 'transport', label: 'Transport' },
  { value: 'consumable', label: 'Consommables' }, { value: 'other', label: 'Autre' },
];

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthGuard();
  const [job, setJob] = useState<Job | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [time, setTime] = useState<TimeRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [costCategory, setCostCategory] = useState<CostCategory>('material');
  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [hours, setHours] = useState('');
  const [progress, setProgress] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const jobResult = await supabase.from('jobs').select('*').eq('id', params.id).maybeSingle();
    if (jobResult.error) throw jobResult.error;
    if (!jobResult.data) { setLoading(false); return; }
    const loadedJob = jobResult.data as Job;
    const [budgetResult, costsResult, timeResult, employeesResult] = await Promise.all([
      supabase.from('job_budget_snapshots').select('material_cents, labor_cents, subcontract_cents, equipment_cents, other_cents').eq('job_id', params.id).order('version', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('job_cost_entries').select('id, category, description, amount_ht_cents, incurred_on').eq('job_id', params.id).order('incurred_on', { ascending: false }),
      supabase.from('time_entries').select('id, minutes, hourly_cost_cents_snapshot, work_date, employees(first_name,last_name)').eq('job_id', params.id).order('work_date', { ascending: false }),
      supabase.from('employees').select('id, first_name, last_name, direct_hourly_cost_cents, employer_monthly_cost_cents').eq('organization_id', loadedJob.organization_id).eq('status', 'active').order('last_name'),
    ]);
    setJob(loadedJob);
    setBudget((budgetResult.data || null) as Budget | null);
    setCosts((costsResult.data || []) as CostRow[]);
    setTime((timeResult.data || []) as unknown as TimeRow[]);
    setEmployees((employeesResult.data || []) as Employee[]);
    setLoading(false);
  }, [params.id, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    load().catch((error) => { console.error('[job] loading failed', error); toast.error('Chargement du chantier impossible'); setLoading(false); });
  }, [authLoading, user, load]);

  const profitability = useMemo(() => {
    if (!job) return null;
    const planned: PlannedCostLine[] = budget ? [
      { category: 'material', quantity: 1, unitCostCents: budget.material_cents },
      { category: 'labor', plannedMinutes: 60, hourlyCostCents: budget.labor_cents },
      { category: 'subcontract', otherCostCents: budget.subcontract_cents },
      { category: 'equipment', otherCostCents: budget.equipment_cents },
      { category: 'other', otherCostCents: budget.other_cents },
    ] : [];
    const actual: ActualCostLine[] = costs.map((entry) => ({ category: entry.category, amountHtCents: entry.amount_ht_cents }));
    const timeCosts: TimeCostLine[] = time.map((entry) => ({ minutes: entry.minutes, hourlyCostCentsSnapshot: entry.hourly_cost_cents_snapshot }));
    return calculateJobProfitability(job.sold_total_ht_cents, planned, actual, timeCosts);
  }, [job, budget, costs, time]);

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
    setCostAmount(''); setCostDescription(''); await load(); toast.success('Coût réel enregistré');
  };

  const addTime = async (event: FormEvent) => {
    event.preventDefault();
    if (!job || !user) return;
    const employee = employees.find((item) => item.id === employeeId);
    const minutes = Math.round(Number(hours.replace(',', '.')) * 60);
    const hourly = employee?.direct_hourly_cost_cents ?? (employee?.employer_monthly_cost_cents ? Math.round(employee.employer_monthly_cost_cents / 151.67) : null);
    if (!employee || !hourly || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440) return toast.error('Salarié, durée ou coût horaire invalide');
    const { error } = await supabase.from('time_entries').insert({
      organization_id: job.organization_id, job_id: job.id, employee_id: employee.id,
      work_date: new Date().toISOString().slice(0, 10), minutes, hourly_cost_cents_snapshot: hourly,
      source: 'manual', created_by: user.id,
    });
    if (error) return toast.error(error.message);
    setHours(''); await load(); toast.success('Temps enregistré avec son coût horaire figé');
  };

  if (loading) return <DashboardLayout><div className="py-20 text-center text-slate-400">Chargement…</div></DashboardLayout>;
  if (!job || !profitability) return <DashboardLayout><div className="py-20 text-center text-slate-400">Chantier introuvable ou non accessible.</div></DashboardLayout>;
  const forecast = estimatedCostAtCompletion(profitability.actualCostCents, Number(progress));

  const metrics = [
    { label: 'Vendu HT', value: profitability.soldCents, icon: Euro, color: 'text-cyan-400' },
    { label: 'Budget initial', value: profitability.plannedCostCents, icon: ReceiptText, color: 'text-slate-200' },
    { label: 'Dépensé réel', value: profitability.actualCostCents, icon: TrendingDown, color: 'text-amber-400' },
    { label: 'Marge actuelle', value: profitability.currentMarginCents, icon: TrendingUp, color: profitability.currentMarginCents >= 0 ? 'text-emerald-400' : 'text-red-400' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title={job.name} subtitle={[job.client_name, job.address].filter(Boolean).join(' · ') || 'Pilotage du chantier'} breadcrumbs={[{ label: 'Chantiers', href: '/dashboard/jobs' }, { label: job.name }]} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map(({ label, value, icon: Icon, color }) => <Card key={label} className="bg-slate-800/50 border-slate-700/40"><CardContent className="p-4"><Icon className={`h-4 w-4 ${color} mb-2`} /><p className="text-xs text-slate-500">{label}</p><p className={`text-lg font-bold ${color}`}>{formatCurrencyEUR(value / 100)}</p></CardContent></Card>)}
        </div>

        {profitability.actualCostCents > profitability.plannedCostCents && <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertTriangle className="h-5 w-5 shrink-0" /><span>Les coûts réels dépassent le budget initial de {formatCurrencyEUR(profitability.varianceCents / 100)}.</span></div>}

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardHeader><CardTitle className="text-white text-base">Ajouter un coût réel</CardTitle></CardHeader>
            <CardContent><form onSubmit={addCost} className="space-y-3">
              <div><Label>Catégorie</Label><Select value={costCategory} onValueChange={(value) => setCostCategory(value as CostCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{costCategories.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="cost-description">Description</Label><Input id="cost-description" value={costDescription} onChange={(event) => setCostDescription(event.target.value)} maxLength={160} required /></div>
              <div><Label htmlFor="cost-amount">Montant HT (€)</Label><Input id="cost-amount" inputMode="decimal" value={costAmount} onChange={(event) => setCostAmount(event.target.value)} required /></div>
              <Button type="submit" variant="primary" className="w-full">Enregistrer le coût</Button>
            </form></CardContent>
          </Card>

          <Card className="bg-slate-800/40 border-slate-700/40">
            <CardHeader><CardTitle className="text-white text-base">Ajouter du temps</CardTitle></CardHeader>
            <CardContent>{employees.length ? <form onSubmit={addTime} className="space-y-3">
              <div><Label>Salarié</Label><Select value={employeeId} onValueChange={setEmployeeId}><SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger><SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="hours">Heures aujourd’hui</Label><Input id="hours" inputMode="decimal" value={hours} onChange={(event) => setHours(event.target.value)} required /></div>
              <Button type="submit" variant="primary" className="w-full"><Clock3 className="h-4 w-4 mr-2" />Enregistrer le temps</Button>
            </form> : <p className="text-sm text-slate-400">Ajoutez d’abord un salarié dans Équipe. Cette fonction est réservée à Pro.</p>}</CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardHeader><CardTitle className="text-white text-base">Projection fin de chantier</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-[1fr_auto] gap-4 items-end"><div><Label htmlFor="progress">Avancement physique (%)</Label><Input id="progress" inputMode="numeric" value={progress} onChange={(event) => setProgress(event.target.value)} placeholder="Ex. 70" /></div><div className="min-w-52"><p className="text-xs text-slate-500">Coût estimé à terminaison</p><p className="text-xl font-bold text-white">{forecast === null ? '—' : formatCurrencyEUR(forecast / 100)}</p></div></CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="bg-slate-800/40 border-slate-700/40"><CardHeader><CardTitle className="text-white text-base">Derniers coûts</CardTitle></CardHeader><CardContent className="space-y-2">{costs.length ? costs.slice(0, 8).map((entry) => <div key={entry.id} className="flex justify-between gap-3 border-b border-slate-700/40 py-2 text-sm"><span className="text-slate-300 truncate">{entry.description}</span><span className="text-white whitespace-nowrap">{formatCurrencyEUR(entry.amount_ht_cents / 100)}</span></div>) : <p className="text-sm text-slate-500">Aucun coût saisi.</p>}</CardContent></Card>
          <Card className="bg-slate-800/40 border-slate-700/40"><CardHeader><CardTitle className="text-white text-base">Derniers temps</CardTitle></CardHeader><CardContent className="space-y-2">{time.length ? time.slice(0, 8).map((entry) => <div key={entry.id} className="flex justify-between gap-3 border-b border-slate-700/40 py-2 text-sm"><span className="text-slate-300">{entry.employees ? `${entry.employees.first_name} ${entry.employees.last_name}` : 'Salarié'} · {entry.work_date}</span><span className="text-white whitespace-nowrap">{(entry.minutes / 60).toLocaleString('fr-FR')} h</span></div>) : <p className="text-sm text-slate-500">Aucun temps saisi.</p>}</CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
