'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Plus, TrendingUp, Euro, CheckCircle2, BarChart3, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
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

  const handleRefresh = () => {
    loadEstimates();
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">Devisia</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/project/new">
              <Button className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg shadow-cyan-600/20 font-medium transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouveau devis</span>
                <span className="sm:hidden">Devis</span>
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Devis"
          subtitle="Gérez vos devis et suivez leur statut de validation."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Devis' },
          ]}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Devis"
            value={stats.total}
            subtitle={`${stats.approvedCount} approuvés, ${stats.expiredCount} expirés`}
            icon={FileText}
            iconColor="text-cyan-400"
          />
          <KpiCard
            title="Valeur Totale"
            value={`${stats.totalValue.toFixed(2)} €`}
            valueColor="text-cyan-400"
            subtitle="Tous devis confondus"
            icon={Euro}
            iconColor="text-cyan-400"
          />
          <KpiCard
            title="Valeur Approuvée"
            value={`${stats.approvedValue.toFixed(2)} €`}
            valueColor="text-emerald-400"
            subtitle="Devis acceptés"
            icon={CheckCircle2}
            iconColor="text-emerald-400"
          />
          <KpiCard
            title="Taux de Conversion"
            value={`${stats.conversionRate}%`}
            valueColor="text-emerald-400"
            subtitle="Devis acceptés"
            icon={TrendingUp}
            iconColor="text-emerald-400"
          />
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher par numéro ou client..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onRefresh={handleRefresh}
          additionalActions={
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Afficher colonnes 7/7
            </Button>
          }
        />

        {/* Table or Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : filteredEstimates.length === 0 && estimates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun devis"
            description="Commencez par créer votre premier devis pour voir vos données ici."
            action={{
              label: 'Créer votre premier devis',
              onClick: () => router.push('/project/new'),
            }}
          />
        ) : (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      N° Devis
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date création
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Échéance
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Montant TTC
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredEstimates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Aucun devis trouvé avec ces filtres
                      </td>
                    </tr>
                  ) : (
                    filteredEstimates.map((estimate) => (
                      <tr key={estimate.id} className="hover:bg-slate-900/50 transition-all duration-200 border-b border-slate-800/50 last:border-0 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-white">
                            #{estimate.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-300">
                            {estimate.projects?.title || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">
                            {new Date(estimate.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">
                            {new Date(new Date(estimate.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-white">
                            {estimate.total_ttc?.toFixed(2) || '0.00'} €
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            estimate.status === 'approved'
                              ? 'bg-green-500/10 text-green-400'
                              : estimate.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400'
                              : estimate.status === 'sent'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {estimate.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/project/${estimate.project_id}`}>
                              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination placeholder */}
            {filteredEstimates.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {filteredEstimates.length} devis au total
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
