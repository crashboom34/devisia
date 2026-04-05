'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Euro, CircleCheck as CheckCircle2, Clock, Eye, Download, Trash2, Mail, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EmptyState } from '@/components/dashboard/EmptyState';

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
      loadMockInvoices();
      setLoading(false);
    }
  };

  const loadMockInvoices = () => {
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

    return { total, paidCount: paid.length, overdueCount: overdue.length, revenue, pendingAmount, paymentRate };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-orange-50 text-orange-700 border-orange-200',
      overdue: 'bg-red-50 text-red-700 border-red-200',
      draft: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    const labels: Record<string, string> = {
      paid: 'Payee', pending: 'En attente', overdue: 'Echue', draft: 'Brouillon',
    };
    return (
      <Badge className={`${styles[status] || styles.draft} border text-[10px] sm:text-xs`}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-7xl mx-auto space-y-5 lg:space-y-8">
        <PageHeader
          title="Factures"
          subtitle="Gerez vos factures et telecharges les PDFs."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Factures' },
          ]}
        />

        {/* KPI Cards */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6 sm:overflow-visible scrollbar-hide">
            <KpiCard title="Total Factures" value={stats.total} subtitle={`${stats.paidCount} payees`} icon={FileText} iconColor="text-brand-green" />
            <KpiCard title="Chiffre d'Affaires" value={`${stats.revenue.toFixed(2)} EUR`} valueColor="text-emerald-600" subtitle="Payees" icon={Euro} iconColor="text-emerald-600" />
            <KpiCard title="En Attente" value={`${stats.pendingAmount.toFixed(2)} EUR`} valueColor="text-orange-500" subtitle="A encaisser" icon={Clock} iconColor="text-orange-500" />
            <KpiCard title="Taux Paiement" value={`${stats.paymentRate}%`} valueColor="text-emerald-600" subtitle="Payees" icon={CheckCircle2} iconColor="text-emerald-600" />
          </div>
        </div>

        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Rechercher..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onRefresh={loadMockInvoices}
        />

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          </div>
        ) : filteredInvoices.length === 0 && invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune facture"
            description="Convertissez un devis en facture pour voir vos donnees ici."
            action={{
              label: 'Creer une facture',
              onClick: () => router.push('/project/new'),
            }}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-2.5 lg:hidden">
              {filteredInvoices.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Aucune facture avec ces filtres</p>
              ) : (
                filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-3.5 rounded-xl bg-white border border-gray-200 active:scale-[0.99] transition-all hover:shadow-md">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium text-sm text-gray-900 truncate">{invoice.client_name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{invoice.number}</p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(invoice.issue_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {invoice.amount_ttc.toFixed(2)} EUR
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N. Facture</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emission</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Echeance</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                      <th className="px-6 py-3.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">Aucune facture avec ces filtres</td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-brand-green/10">
                                <FileText className="h-4 w-4 text-brand-green" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{invoice.number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5"><span className="text-sm text-gray-700 font-medium">{invoice.client_name}</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-gray-500">{new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap"><span className="text-sm text-gray-500">{new Date(invoice.due_date).toLocaleDateString('fr-FR')}</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right"><span className="text-sm font-bold text-gray-900">{invoice.amount_ttc.toFixed(2)} EUR</span></td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-center">{getStatusBadge(invoice.status)}</td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-gray-900"><Eye className="h-4 w-4" /></Button>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-gray-900"><Download className="h-4 w-4" /></Button>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-orange-500"><Mail className="h-4 w-4" /></Button>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredInvoices.length > 0 && (
                <div className="px-6 py-3.5 border-t border-gray-100 text-sm text-gray-500">
                  {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
