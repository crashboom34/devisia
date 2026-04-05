'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Plus, TrendingUp, Euro, CircleCheck as CheckCircle2, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface Estimate {
  id: string;
  project_id: string;
  scenario_type: string;
  total_ttc: number;
  created_at: string;
  status: string;
  projects?: {
    title: string;
  };
}

export default function QuotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    checkUser();
    loadEstimates();
  }, []);

  useEffect(() => {
    filterEstimates();
  }, [estimates, searchValue, statusFilter]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
    }
  };

  const loadEstimates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          projects (
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstimates(data || []);
    } catch (err) {
      console.error('Error loading estimates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEstimates = () => {
    let filtered = [...estimates];

    if (searchValue) {
      filtered = filtered.filter(est =>
        est.projects?.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
        est.id.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(est => est.status === statusFilter);
    }

    setFilteredEstimates(filtered);
  };

  const calculateStats = () => {
    const total = estimates.length;
    const totalValue = estimates.reduce((sum, est) => sum + (est.total_ttc || 0), 0);
    const approved = estimates.filter(e => e.status === 'approved');
    const approvedValue = approved.reduce((sum, est) => sum + (est.total_ttc || 0), 0);
    const conversionRate = total > 0 ? ((approved.length / total) * 100).toFixed(0) : 0;

    return {
      total,
      totalValue,
      approvedValue,
      approvedCount: approved.length,
      expiredCount: estimates.filter(e => e.status === 'expired').length,
      conversionRate,
    };
  };

  const stats = calculateStats();

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-emerald-50 text-emerald-700',
      rejected: 'bg-red-50 text-red-700',
      sent: 'bg-blue-50 text-blue-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-5 lg:space-y-8">
        <PageHeader
          title="Devis"
          subtitle="Gerez vos devis et suivez leur statut."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Devis' },
          ]}
        />

        {/* KPI Cards - horizontal scroll on mobile */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6 sm:overflow-visible scrollbar-hide">
            <KpiCard title="Total Devis" value={stats.total} subtitle={`${stats.approvedCount} approuves`} icon={FileText} iconColor="text-brand-green" />
            <KpiCard title="Valeur Totale" value={`${stats.totalValue.toFixed(2)} EUR`} valueColor="text-brand-green" subtitle="Tous devis" icon={Euro} iconColor="text-brand-green" />
            <KpiCard title="Valeur Approuvee" value={`${stats.approvedValue.toFixed(2)} EUR`} valueColor="text-emerald-600" subtitle="Acceptes" icon={CheckCircle2} iconColor="text-emerald-600" />
            <KpiCard title="Conversion" value={`${stats.conversionRate}%`} valueColor="text-emerald-600" subtitle="Taux" icon={TrendingUp} iconColor="text-emerald-600" />
          </div>
        </div>

        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onRefresh={loadEstimates}
        />

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          </div>
        ) : filteredEstimates.length === 0 && estimates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun devis"
            description="Creez votre premier devis pour voir vos donnees ici."
            action={{
              label: 'Creer un devis',
              onClick: () => router.push('/project/new'),
            }}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-2.5 lg:hidden">
              {filteredEstimates.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Aucun devis avec ces filtres</p>
              ) : (
                filteredEstimates.map((estimate) => (
                  <Link key={estimate.id} href={`/project/${estimate.project_id}`}>
                    <div className="p-3.5 rounded-xl bg-white border border-gray-200 active:scale-[0.99] transition-all hover:shadow-md">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-medium text-sm text-gray-900 truncate">{estimate.projects?.title || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">#{estimate.id.slice(0, 8)}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusStyle(estimate.status)}`}>
                          {estimate.status || 'draft'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(estimate.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {estimate.total_ttc?.toFixed(2) || '0.00'} EUR
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              {filteredEstimates.length > 0 && (
                <p className="text-center text-xs text-gray-400 pt-2">
                  {filteredEstimates.length} devis
                </p>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N. Devis</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Echeance</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                      <th className="px-6 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEstimates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">Aucun devis avec ces filtres</td>
                      </tr>
                    ) : (
                      filteredEstimates.map((estimate) => (
                        <tr key={estimate.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">#{estimate.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-6 py-3.5"><span className="text-sm text-gray-700">{estimate.projects?.title || 'N/A'}</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-gray-500">{new Date(estimate.created_at).toLocaleDateString('fr-FR')}</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-gray-500">{new Date(new Date(estimate.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right"><span className="text-sm font-semibold text-gray-900">{estimate.total_ttc?.toFixed(2) || '0.00'} EUR</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(estimate.status)}`}>{estimate.status || 'draft'}</span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/project/${estimate.project_id}`}>
                                <Button size="xs" variant="ghost" className="text-gray-400 hover:text-gray-900"><Eye className="h-4 w-4" /></Button>
                              </Link>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-gray-900"><Download className="h-4 w-4" /></Button>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredEstimates.length > 0 && (
                <div className="px-6 py-3.5 border-t border-gray-100 text-sm text-gray-500">
                  {filteredEstimates.length} devis au total
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
