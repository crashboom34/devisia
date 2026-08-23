'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Eye, FileText, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageError, PageLoading } from '@/components/dashboard/PageState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  name: string;
  company?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: 'active' | 'inactive' | null;
  total_quotes?: number | null;
}

function ClientStatus({ status }: { status?: Client['status'] }) {
  const active = status !== 'inactive';
  return (
    <Badge className={active
      ? 'border border-success/30 bg-success/10 text-success'
      : 'border border-border bg-surface-elevated text-muted-foreground'
    }>
      {active ? 'Actif' : 'Inactif'}
    </Badge>
  );
}

export default function ClientsPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const loadClients = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('clients')
        .select('id, name, company, contact_name, email, phone, status, total_quotes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setClients((data ?? []) as Client[]);
    } catch (loadError) {
      console.error('Error loading clients:', loadError);
      setError('Impossible de charger les clients pour le moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadClients(user.id);
  }, [authLoading, loadClients, user]);

  const filteredClients = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase('fr');
    if (!query) return clients;

    return clients.filter((client) =>
      client.name.toLocaleLowerCase('fr').includes(query)
      || client.email?.toLocaleLowerCase('fr').includes(query)
      || client.company?.toLocaleLowerCase('fr').includes(query)
      || client.phone?.toLocaleLowerCase('fr').includes(query)
    );
  }, [clients, searchValue]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((client) => client.status !== 'inactive').length,
    contactable: clients.filter((client) => client.email || client.phone).length,
    quotes: clients.reduce((total, client) => total + (client.total_quotes ?? 0), 0),
  }), [clients]);

  const handleDeleteClient = async (clientId: string) => {
    if (!user || !window.confirm('Supprimer définitivement ce client ?')) return;

    setDeletingId(clientId);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      setClients((current) => current.filter((client) => client.id !== clientId));
    } catch (deleteError) {
      console.error('Delete client error:', deleteError);
      setError('Impossible de supprimer ce client.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout showNewQuoteButton={false}>
        <PageContainer>
          <PageLoading label={authLoading ? 'Vérification de votre accès…' : 'Redirection…'} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <PageContainer>
        <PageHeader
          title="Clients"
          subtitle="Centralisez les coordonnées utiles à vos dossiers."
          breadcrumbs={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Clients' },
          ]}
          actions={(
            <Button asChild size="sm">
              <Link href="/dashboard/clients/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nouveau client
              </Link>
            </Button>
          )}
        />

        {!error && !loading && (
          <section aria-label="Synthèse des clients" className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
              <KpiCard title="Clients" value={stats.total} subtitle="Tous les contacts" icon={Users} />
              <KpiCard title="Actifs" value={stats.active} subtitle="Statut actif" icon={Users} iconColor="text-success" />
              <KpiCard title="Joignables" value={stats.contactable} subtitle="Email ou téléphone" icon={Mail} />
              <KpiCard title="Devis associés" value={stats.quotes} subtitle="Donnée enregistrée" icon={FileText} />
            </div>
          </section>
        )}

        <div className="rounded-xl border border-border bg-surface p-3 shadow-panel lg:p-4">
          <div className="relative">
            <label htmlFor="client-search" className="sr-only">Rechercher un client</label>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="client-search"
              type="search"
              placeholder="Rechercher par nom, email, entreprise ou téléphone…"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-11 bg-surface-elevated pl-10"
            />
          </div>
        </div>

        {error && (
          <PageError description={error} onRetry={() => void loadClients(user.id)} />
        )}

        {loading ? (
          <PageLoading label="Chargement des clients…" />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description="Ajoutez un premier client pour centraliser ses coordonnées."
            action={{ label: 'Ajouter un client', href: '/dashboard/clients/new' }}
          />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {filteredClients.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Aucun client ne correspond à cette recherche.
                </p>
              ) : filteredClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="block rounded-xl border border-border bg-surface p-4 shadow-panel transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">
                      {client.name.charAt(0).toLocaleUpperCase('fr') || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{client.name}</p>
                          {client.company && <p className="mt-0.5 truncate text-xs text-muted-foreground">{client.company}</p>}
                        </div>
                        <ClientStatus status={client.status} />
                      </div>
                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        {client.email && (
                          <p className="flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {client.email}
                          </p>
                        )}
                        {client.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {client.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-panel lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <caption className="sr-only">Liste des clients</caption>
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated">
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entreprise</th>
                      <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Devis</th>
                      <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</th>
                      <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">Aucun client ne correspond à cette recherche.</td>
                      </tr>
                    ) : filteredClients.map((client) => (
                      <tr key={client.id} className="transition-colors hover:bg-surface-elevated">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">
                              {client.name.charAt(0).toLocaleUpperCase('fr') || '?'}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{client.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{client.email || 'Aucun email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" aria-hidden="true" />
                            {client.company || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            {client.phone || client.contact_name || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-foreground">{client.total_quotes ?? 0}</td>
                        <td className="px-6 py-4 text-center"><ClientStatus status={client.status} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild size="icon" variant="ghost">
                              <Link href={`/dashboard/clients/${client.id}`} aria-label={`Voir ${client.name}`}>
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </Button>
                            <Button asChild size="icon" variant="ghost">
                              <Link href={`/dashboard/clients/${client.id}/edit`} aria-label={`Modifier ${client.name}`}>
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => void handleDeleteClient(client.id)}
                              disabled={deletingId === client.id}
                              aria-label={`Supprimer ${client.name}`}
                              className="hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border px-6 py-3 text-sm text-muted-foreground">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} affiché{filteredClients.length > 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
