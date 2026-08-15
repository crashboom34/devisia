'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { supabase } from '@/lib/supabase';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface ClientFormData {
  name: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  notes: string;
}

export default function EditClientPage({ params }: { params: { clientId: string } }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    company: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    notes: '',
  });

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchClient = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.clientId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('Error loading client for edit', error);
        setError('Client introuvable.');
      } else {
        setFormData({
          name: data.name || '',
          company: data.company || '',
          contactName: data.contact_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          postalCode: data.postal_code || '',
          city: data.city || '',
          notes: data.notes || '',
        });
      }

      setLoading(false);
    };

    fetchClient();
  }, [params.clientId, authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Le nom ou la raison sociale est requis.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          company: formData.company,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          postal_code: formData.postalCode,
          city: formData.city,
          notes: formData.notes,
        })
        .eq('id', params.clientId)
        .eq('user_id', user.id);

      if (error) throw error;

      router.push(`/dashboard/clients/${params.clientId}`);
    } catch (err) {
      console.error('Update client Supabase error', err);
      setError('Une erreur est survenue lors de la mise à jour du client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-5xl mx-auto space-y-10">
        <PageHeader
          title="Modifier le client"
          subtitle="Mettez à jour les informations du client."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Clients', href: '/dashboard/clients' },
            { label: 'Modifier le client' },
          ]}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
          </div>
        ) : error ? (
          <Card className="bg-slate-900/70 border-slate-800 text-white">
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-lg font-semibold">{error}</p>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="border-slate-800">Retour aux clients</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/40 border-slate-800 text-white shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-6">
              <CardTitle className="text-xl">Informations du client</CardTitle>
              <p className="text-sm text-slate-400">Modifiez les informations clés pour ce contact.</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom / Raison sociale *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: SARL Dupont Rénovation"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise</Label>
                    <Input
                      id="company"
                      placeholder="Nom commercial"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact</Label>
                    <Input
                      id="contactName"
                      placeholder="Nom du contact"
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@email.fr"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      placeholder="Numéro et rue"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      placeholder="75000"
                      value={formData.postalCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      placeholder="Paris"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Précisions ou besoins spécifiques du client"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-900/60 border-slate-800 focus:border-cyan-500/70 text-white"
                    rows={4}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link href={`/dashboard/clients/${params.clientId}`} className="w-full sm:w-auto">
                    <Button type="button" variant="outline" className="w-full sm:w-auto border-slate-800" disabled={saving}>
                      Annuler
                    </Button>
                  </Link>
                  <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg" disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
