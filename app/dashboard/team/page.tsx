'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';

interface Employee {
  id: string; first_name: string; last_name: string; job_title: string | null;
  employer_monthly_cost_cents: number | null; direct_hourly_cost_cents: number | null; hourly_cost_is_estimated: boolean;
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
  const [monthlyCost, setMonthlyCost] = useState('');
  const [hourlyCost, setHourlyCost] = useState('');

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
      const result = await supabase.from('employees').select('id, first_name, last_name, job_title, employer_monthly_cost_cents, direct_hourly_cost_cents, hourly_cost_is_estimated').eq('organization_id', orgId).eq('status', 'active').order('last_name');
      if (result.error) throw result.error;
      setEmployees((result.data || []) as Employee[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    load().catch((error) => { console.error('[team] loading failed', error); toast.error('Chargement de l’équipe impossible'); setLoading(false); });
  }, [authLoading, user, load]);

  const addEmployee = async (event: FormEvent) => {
    event.preventDefault();
    const monthly = monthlyCost ? Math.round(Number(monthlyCost.replace(',', '.')) * 100) : null;
    const hourly = hourlyCost ? Math.round(Number(hourlyCost.replace(',', '.')) * 100) : monthly ? Math.round(monthly / 151.67) : null;
    if (!organizationId || !firstName.trim() || !lastName.trim() || !hourly || hourly < 0) return toast.error('Nom et coût employeur requis');
    const { error } = await supabase.from('employees').insert({
      organization_id: organizationId, first_name: firstName.trim(), last_name: lastName.trim(),
      job_title: jobTitle.trim() || null, employer_monthly_cost_cents: monthly,
      direct_hourly_cost_cents: hourly, hourly_cost_is_estimated: !hourlyCost,
    });
    if (error) return toast.error(error.message);
    setFirstName(''); setLastName(''); setJobTitle(''); setMonthlyCost(''); setHourlyCost('');
    await load(); toast.success('Salarié ajouté');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader title="Équipe" subtitle="Coûts horaires internes et temps chantier. Ces données ne figurent jamais sur le devis client." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Équipe' }]} />
        {!loading && allowed === false ? (
          <Card className="bg-slate-800/40 border-slate-700/40"><CardContent className="p-8 text-center"><ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-3" /><h2 className="text-lg font-semibold text-white">Gestion d’équipe réservée à Pro</h2><p className="text-sm text-slate-400 mt-2">La restriction est appliquée dans l’interface et dans les politiques RLS.</p></CardContent></Card>
        ) : loading ? <div className="py-16 text-center text-slate-400">Chargement…</div> : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] gap-5">
            <Card className="bg-slate-800/40 border-slate-700/40">
              <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><UsersRound className="h-4 w-4 text-cyan-400" />Salariés actifs</CardTitle></CardHeader>
              <CardContent className="space-y-3">{employees.length ? employees.map((employee) => <div key={employee.id} className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4 flex items-center justify-between gap-3"><div><p className="font-medium text-white">{employee.first_name} {employee.last_name}</p><p className="text-xs text-slate-500">{employee.job_title || 'Métier non précisé'}</p></div><div className="text-right"><p className="text-sm font-semibold text-cyan-300">{formatCurrencyEUR((employee.direct_hourly_cost_cents || 0) / 100)}/h</p>{employee.hourly_cost_is_estimated && <p className="text-[10px] text-amber-400">estimé</p>}</div></div>) : <p className="text-sm text-slate-500">Aucun salarié actif.</p>}</CardContent>
            </Card>
            <Card className="bg-slate-800/40 border-slate-700/40">
              <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><UserRoundPlus className="h-4 w-4 text-cyan-400" />Ajouter un salarié</CardTitle></CardHeader>
              <CardContent><form onSubmit={addEmployee} className="space-y-3">
                <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="first-name">Prénom</Label><Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></div><div><Label htmlFor="last-name">Nom</Label><Input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required /></div></div>
                <div><Label htmlFor="job-title">Métier</Label><Input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Maçon, peintre…" /></div>
                <div><Label htmlFor="monthly-cost">Coût employeur mensuel (€)</Label><Input id="monthly-cost" inputMode="decimal" value={monthlyCost} onChange={(event) => setMonthlyCost(event.target.value)} placeholder="Ex. 4200" /></div>
                <div><Label htmlFor="hourly-cost">Coût horaire direct (€), facultatif</Label><Input id="hourly-cost" inputMode="decimal" value={hourlyCost} onChange={(event) => setHourlyCost(event.target.value)} placeholder="Calculé sur 151,67 h si vide" /></div>
                <Button type="submit" variant="primary" className="w-full">Ajouter</Button>
              </form></CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
