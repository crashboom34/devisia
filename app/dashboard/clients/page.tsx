'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, RefreshCw, Mail, Phone, Building2, Eye, CreditCard as Edit, Trash2, TrendingUp, Euro, FileCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { KpiCard } from '@/components/dashboard/KpiCard';

interface Client {
  id: string;
  user_id?: string;
  name: string;
  company?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  total_quotes?: number;
  total_revenue?: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      await loadClients(user.id);
    };

    initialize();
  }, [router]);

  useEffect(() => {
    let filtered = [...clients];

    if (searchValue) {
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchValue]);

  const loadClients = async (userId: string) => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((client) => ({
        ...client,
        status: client.status || 'active',
        total_quotes: client.total_quotes || 0,
        total_revenue: client.total_revenue || 0,
      }));

      setClients(formatted as Client[]);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = clients.length;
    const active = clients.filter(c => c.status !== 'inactive').length;
    const totalRevenue = clients.reduce((sum, client) => sum + (client.total_revenue || 0), 0);
    const avgRevenue = total > 0 ? totalRevenue / total : 0;

    return { total, active, totalRevenue, avgRevenue };
  };

  const stats = calculateStats();

  const handleRefresh = async () => {
    if (user?.id) {
      await loadClients(user.id);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const confirmed = window.confirm('Supprimer ce client ?');
    if (!confirmed) return;

    setDeletingId(clientId);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadClients(user.id);
    } catch (err) {
      console.error('Delete client error', err);
      setError('Impossible de supprimer ce client.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-7xl mx-auto space-y-5 lg:space-y-8">
        <PageHeader
          title="Clients"
          subtitle={`${stats.total} client${stats.total > 1 ? 's' : ''}`}
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Clients' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8 text-gray-400">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Link href="/dashboard/clients/new">
                <Button size="xs" variant="primary">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Nouveau client</span>
                  <span className="sm:hidden">Nouveau</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* KPI Cards */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6 sm:overflow-visible scrollbar-hide">
            <KpiCard title="Total Clients" value={stats.total} subtitle={`${stats.active} actifs`} icon={Users} iconColor="text-brand-green" />
            <KpiCard title="CA Total" value={`${stats.totalRevenue.toFixed(2)} EUR`} valueColor="text-emerald-600" subtitle="Tous clients" icon={Euro} iconColor="text-emerald-600" />
            <KpiCard title="CA Moyen" value={`${stats.avgRevenue.toFixed(2)} EUR`} valueColor="text-brand-green" subtitle="Par client" icon={TrendingUp} iconColor="text-brand-green" />
            <KpiCard title="Clients Actifs" value={stats.active} valueColor="text-emerald-600" subtitle="Ce mois" icon={FileCheck} iconColor="text-emerald-600" />
          </div>
        </div>

        {/* Search */}
        <div className="p-3 lg:p-4 bg-white rounded-xl border border-gray-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900 text-sm placeholder:text-gray-500 h-10 lg:h-11 rounded-lg"
            />
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          </div>
        ) : filteredClients.length === 0 && clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description="Ajoutez votre premier client pour gerer vos relations."
            action={{
              label: 'Ajouter un client',
              onClick: () => router.push('/dashboard/clients/new'),
            }}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-2.5 lg:hidden">
              {filteredClients.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Aucun client avec ces filtres</p>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3.5 rounded-xl bg-white border border-gray-200 active:scale-[0.99] transition-all"
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-emerald-500 flex items-center justify-center text-gray-900 text-sm font-semibold shrink-0">
                        {client.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{client.name}</p>
                        {client.company && (
                          <p className="text-[10px] text-gray-500 truncate">{client.company}</p>
                        )}
                      </div>
                      <Badge className={`shrink-0 text-[10px] ${
                        client.status !== 'inactive'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      } border`}>
                        {client.status !== 'inactive' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {client.email && (
                          <span className="flex items-center gap-1 truncate max-w-[140px]">
                            <Mail className="h-3 w-3 shrink-0" />
                            {client.email}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        {(client.total_revenue || 0).toFixed(0)} EUR
                      </span>
                    </div>
                  </div>
                ))
              )}
              {filteredClients.length > 0 && (
                <p className="text-center text-xs text-gray-500 pt-2">
                  {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entreprise</th>
                      <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Devis</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">CA Total</th>
                      <th className="px-6 py-3.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 text-sm">Aucun client avec ces filtres</td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-green to-emerald-500 flex items-center justify-center text-gray-900 font-semibold text-sm">
                                {client.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {client.email || '\u2014'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              {client.company || '\u2014'}
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Phone className="h-4 w-4 text-gray-500" />
                              {client.phone || client.contact_name || '\u2014'}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right"><span className="text-sm font-medium text-gray-900">{client.total_quotes || 0}</span></td>
                          <td className="px-6 py-3.5 text-right"><span className="text-sm font-bold text-emerald-600">{(client.total_revenue || 0).toFixed(2)} EUR</span></td>
                          <td className="px-6 py-3.5 text-center">
                            <Badge className={`${client.status !== 'inactive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'} border`}>
                              {client.status !== 'inactive' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-brand-green" onClick={() => router.push(`/dashboard/clients/${client.id}`)}><Eye className="h-4 w-4" /></Button>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-blue-500" onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                              <Button size="xs" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => handleDeleteClient(client.id)} disabled={deletingId === client.id}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredClients.length > 0 && (
                <div className="px-6 py-3.5 border-t border-gray-200 text-sm text-gray-400">
                  {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
