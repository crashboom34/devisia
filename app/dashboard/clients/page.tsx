'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Users, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import UserMenu from '@/components/UserMenu';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

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

  const handleCreateClient = () => {
    // Navigate to client creation or show modal
    console.log('Create client');
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
            <Button
              onClick={handleCreateClient}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg shadow-cyan-600/20 font-medium transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouveau client</span>
              <span className="sm:hidden">Client</span>
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Clients"
          subtitle="0 client au total"
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Clients' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button
                onClick={handleCreateClient}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau client
              </Button>
            </div>
          }
        />

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

        {/* Empty State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description="Commencez par ajouter votre premier client."
            action={{
              label: 'Créer votre premier client',
              onClick: handleCreateClient,
            }}
          />
        )}

        {/* Table structure (for when clients exist) */}
        <div className="hidden bg-gradient-to-br from-slate-800/90 to-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Téléphone
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
      </main>
    </div>
  );
}
