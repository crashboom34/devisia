'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { supabase } from '@/lib/supabase';
import { Building2, Mail, Phone, MapPin, ArrowLeft, CreditCard as Edit } from 'lucide-react';

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
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClient = async () => {
      setError('');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

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
  }, [params.clientId, router]);

  const statusBadge = client?.status !== 'inactive'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-gray-100 text-gray-600 border-gray-200';

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
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux clients
                </Button>
              </Link>
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <Button className="bg-brand-green text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le client
                </Button>
              </Link>
            </div>
          ) : undefined}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green" />
          </div>
        ) : error || !client ? (
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-lg font-semibold">Client introuvable</p>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-100">
                  Retour aux clients
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-gray-200 text-gray-900">
            <CardHeader className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{client.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{client.company || '—'}</p>
                </div>
                <Badge className={`${statusBadge} border`}>
                  {client.status !== 'inactive' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="text-gray-800 hover:text-brand-green">
                      {client.email}
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="text-gray-800 hover:text-brand-green">
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-800">{client.contact_name || client.company || '—'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                  <div className="text-gray-800 space-y-1">
                    <p>{client.address || 'Adresse non renseignée'}</p>
                    <p>{client.postal_code || '—'} {client.city || ''}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-600">Notes</p>
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 min-h-[120px]">
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
