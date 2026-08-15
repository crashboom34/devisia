'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { supabase } from '@/lib/supabase';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Building2, Mail, Phone, MapPin, ArrowLeft, Edit } from 'lucide-react';

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
}

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { user, loading: authLoading } = useAuthGuard();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchClient = async () => {
      setError('');

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', params.clientId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setClient(data as Client);
      } catch (err) {
        console.error('Error fetching client detail', err);
        setError('Client introuvable.');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [params.clientId, authLoading, user]);

  const statusBadge = client?.status !== 'inactive'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-5xl mx-auto space-y-8">
        <PageHeader
          title="Fiche client"
          subtitle={client?.name || 'Détails du client'}
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Clients', href: '/dashboard/clients' },
            { label: client?.name || 'Client' },
          ]}
          actions={client ? (
            <div className="flex gap-3">
              <Link href="/dashboard/clients">
                <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux clients
                </Button>
              </Link>
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <Button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le client
                </Button>
              </Link>
            </div>
          ) : undefined}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
          </div>
        ) : error || !client ? (
          <Card className="bg-slate-900/70 border-slate-800 text-white">
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-lg font-semibold">Client introuvable</p>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
                  Retour aux clients
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/40 border-slate-800 text-white">
            <CardHeader className="border-b border-slate-800 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{client.name}</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">{client.company || '—'}</p>
                </div>
                <Badge className={`${statusBadge} border`}>
                  {client.status !== 'inactive' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="text-slate-100 hover:text-cyan-400">
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-400" />
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-slate-100 hover:text-cyan-400">
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-100">{client.contact_name || client.company || '—'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-1" />
                  <div className="text-slate-100 space-y-1">
                    <p>{client.address || 'Adresse non renseignée'}</p>
                    <p>{client.postal_code || '—'} {client.city || ''}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-300">Notes</p>
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 min-h-[120px]">
                  {client.notes?.trim() ? client.notes : 'Aucune note pour ce client.'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
