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

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }
    };

    checkUser();
  }, [router]);

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

      const { error } = await supabase.from('clients').insert({
        user_id: user.id,
        name: formData.name,
        company: formData.company,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        postal_code: formData.postalCode,
        city: formData.city,
        notes: formData.notes,
        status: 'active',
        total_quotes: 0,
        total_revenue: 0,
      });

      if (error) throw error;

      router.push('/dashboard/clients');
    } catch (err) {
      console.error('Create client error', err);
      setError('Une erreur est survenue lors de l’enregistrement du client. Veuillez vérifier les informations et réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-5xl mx-auto space-y-10">
        <PageHeader
          title="Nouveau client"
          subtitle="Ajoutez un client pour suivre vos devis et factures."
          breadcrumbs={[
            { label: 'dashboard', href: '/dashboard' },
            { label: 'Clients', href: '/dashboard/clients' },
            { label: 'Nouveau client' },
          ]}
        />

        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/40 border-slate-800 text-white shadow-2xl">
          <CardHeader className="border-b border-slate-800 pb-6">
            <CardTitle className="text-xl">Informations du client</CardTitle>
            <p className="text-sm text-slate-400">Renseignez les informations clés pour ce contact.</p>
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
                <Link href="/dashboard/clients" className="w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto border-slate-800" disabled={saving}>
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer le client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
