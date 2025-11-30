'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Euro, CheckCircle2, Clock, AlertCircle, Eye, Download, Trash2, MoreVertical, Mail, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EmptyState } from '@/components/dashboard/EmptyState';

// Mock invoice data structure
interface Invoice {
  id: string;
  number: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  amount_ttc: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
}

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchValue, statusFilter]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
      // Load mock data for demonstration
      loadMockInvoices();
      setLoading(false);
    }
  };

  const loadMockInvoices = () => {
    // Mock data - in production this would come from Supabase
    const mockData: Invoice[] = [];
    setInvoices(mockData);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchValue) {
      filtered = filtered.filter(inv =>
        inv.client_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        inv.number.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const calculateStats = () => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.status === 'paid');
    const overdue = invoices.filter(i => i.status === 'overdue');
    const pending = invoices.filter(i => i.status === 'pending');

    const revenue = paid.reduce((sum, inv) => sum + inv.amount_ttc, 0);
    const pendingAmount = pending.reduce((sum, inv) => sum + inv.amount_ttc, 0);
    const paymentRate = total > 0 ? ((paid.length / total) * 100).toFixed(0) : 0;

    return {
      total,
      paidCount: paid.length,
      overdueCount: overdue.length,
      revenue,
      pendingAmount,
      paymentRate,
    };
  };

  const stats = calculateStats();

  const handleRefresh = () => {
    loadMockInvoices();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
      draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    const labels = {
      paid: 'Payée',
      pending: 'En attente',
      overdue: 'Échue',
      draft: 'Brouillon',
    };

    return (
      <Badge className={`${styles[status as keyof typeof styles]} border`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
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
                <span className="hidden sm:inline">Convertir un devis</span>
                <span className="sm:hidden">Facture</span>
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Factures"
          subtitle="Gérez vos factures et téléchargez les PDFs légaux."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Factures' },
          ]}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Factures"
            value={stats.total}
            subtitle={`${stats.paidCount} payées, ${stats.overdueCount} échues`}
            icon={FileText}
            iconColor="text-cyan-400"
          />
          <KpiCard
            title="Chiffre d'Affaires"
            value={`${stats.revenue.toFixed(2)} €`}
            valueColor="text-emerald-400"
            subtitle="Factures payées"
            icon={Euro}
            iconColor="text-emerald-400"
          />
          <KpiCard
            title="En Attente"
            value={`${stats.pendingAmount.toFixed(2)} €`}
            valueColor="text-orange-400"
            subtitle="À encaisser"
            icon={Clock}
            iconColor="text-orange-400"
          />
          <KpiCard
            title="Taux de Paiement"
            value={`${stats.paymentRate}%`}
            valueColor="text-emerald-400"
            subtitle="Factures payées"
            icon={CheckCircle2}
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
              className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          }
        />

        {/* Table or Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : filteredInvoices.length === 0 && invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune facture"
            description="Commencez par convertir un devis en facture pour voir vos données ici."
            action={{
              label: 'Créer votre première facture',
              onClick: () => router.push('/project/new'),
            }}
          />
        ) : (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      N° Facture
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date émission
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
                <tbody className="divide-y divide-slate-700/50">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Aucune facture trouvée avec ces filtres
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-900/50 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-cyan-500/10">
                              <FileText className="h-4 w-4 text-cyan-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {invoice.number}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-300 font-medium">
                            {invoice.client_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">
                            {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">
                            {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-white">
                            {invoice.amount_ttc.toFixed(2)} €
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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

            {/* Footer with pagination info */}
            {filteredInvoices.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-white">{filteredInvoices.length}</span> facture{filteredInvoices.length > 1 ? 's' : ''} au total
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:bg-slate-800">
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:bg-slate-800">
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
