'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Users, Search, RefreshCw, Mail, Phone, Building2, Eye, Edit, Trash2, TrendingUp, Euro, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { KpiCard } from '@/components/dashboard/KpiCard';

// Mock client data structure
interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  total_quotes: number;
  total_revenue: number;
  status: 'active' | 'inactive';
}

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchValue]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    } else {
      setUser(user);
      // Load mock data for demonstration
      loadMockClients();
      setLoading(false);
    }
  };

  const loadMockClients = () => {
    // Mock data - in production this would come from Supabase
    const mockData: Client[] = [];
    setClients(mockData);
  };

  const filterClients = () => {
    let filtered = [...clients];

    if (searchValue) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        client.email.toLowerCase().includes(searchValue.toLowerCase()) ||
        client.company.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const calculateStats = () => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const totalRevenue = clients.reduce((sum, client) => sum + client.total_revenue, 0);
    const avgRevenue = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      active,
      totalRevenue,
      avgRevenue,
    };
  };

  const stats = calculateStats();

  const handleRefresh = () => {
    loadMockClients();
  };

  const handleCreateClient = () => {
    // Navigate to client creation or show modal
    console.log('Create client');
  };

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Clients"
          subtitle={`${stats.total} client${stats.total > 1 ? 's' : ''} au total`}
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Clients' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Clients"
            value={stats.total}
            subtitle={`${stats.active} actifs`}
            icon={Users}
            iconColor="text-cyan-400"
          />
          <KpiCard
            title="CA Total"
            value={`${stats.totalRevenue.toFixed(2)} €`}
            valueColor="text-emerald-400"
            subtitle="Tous clients"
            icon={Euro}
            iconColor="text-emerald-400"
          />
          <KpiCard
            title="CA Moyen"
            value={`${stats.avgRevenue.toFixed(2)} €`}
            valueColor="text-cyan-400"
            subtitle="Par client"
            icon={TrendingUp}
            iconColor="text-cyan-400"
          />
          <KpiCard
            title="Clients Actifs"
            value={stats.active}
            valueColor="text-emerald-400"
            subtitle="Ce mois"
            icon={FileCheck}
            iconColor="text-emerald-400"
          />
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-12 bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 focus:border-cyan-500/50 text-white placeholder:text-slate-500 h-12 text-base rounded-xl transition-colors"
            />
          </div>
        </div>

        {/* Table or Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : filteredClients.length === 0 && clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description="Commencez par ajouter votre premier client pour gérer vos relations et suivre vos projets."
            action={{
              label: 'Créer votre premier client',
              onClick: handleCreateClient,
            }}
          />
        ) : (
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Devis
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      CA Total
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
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Aucun client trouvé avec ces filtres
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-900/50 transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {client.name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Building2 className="h-4 w-4 text-slate-500" />
                            {client.company}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Phone className="h-4 w-4 text-slate-500" />
                            {client.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-white">
                            {client.total_quotes}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-emerald-400">
                            {client.total_revenue.toFixed(2)} €
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={`${
                            client.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          } border`}>
                            {client.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                              <Edit className="h-4 w-4" />
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
            {filteredClients.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  <span className="font-medium text-white">{filteredClients.length}</span> client{filteredClients.length > 1 ? 's' : ''} au total
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
      </div>
    </DashboardLayout>
  );
}
