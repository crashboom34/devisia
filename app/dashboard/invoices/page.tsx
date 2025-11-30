'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Euro, CheckCircle2, Clock, TrendingUp, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function InvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Refresh logic here
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white">Devisia</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/project/new">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm font-medium">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Convertir un devis</span>
                <span className="sm:hidden">Facture</span>
              </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Page Header */}
        <PageHeader
          title="Factures"
          subtitle="Gérez vos factures et téléchargez les PDFs légaux."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Factures' },
          ]}
          actions={
            <Link href="/project/new">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Convertir un devis
              </Button>
            </Link>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Factures"
            value={0}
            subtitle="0 payées, 0 échues"
            icon={FileText}
          />
          <KpiCard
            title="Chiffre d'Affaires"
            value="0,00 €"
            valueColor="text-green-400"
            subtitle="Factures payées"
            icon={Euro}
          />
          <KpiCard
            title="En Attente"
            value="0,00 €"
            valueColor="text-orange-400"
            subtitle="À encaisser"
            icon={Clock}
          />
          <KpiCard
            title="Taux de Paiement"
            value="0%"
            valueColor="text-green-400"
            subtitle="Factures payées"
            icon={CheckCircle2}
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
        />

        {/* Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <>
            <EmptyState
              icon={FileText}
              title="Aucune facture"
              description="Commencez par convertir un devis en facture pour voir vos données ici."
              action={{
                label: 'Créer votre première facture',
                onClick: () => router.push('/project/new'),
              }}
            />

            {/* Table structure (for when invoices exist) */}
            <div className="hidden bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-700">
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
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
                  <tbody className="divide-y divide-slate-700">
                    {/* Rows would go here */}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
