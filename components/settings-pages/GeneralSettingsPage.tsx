'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Upload, Save, User, Building2, Globe, Phone } from 'lucide-react';

interface GeneralSettingsPageProps {
  isActive: boolean;
  onNavigate?: (page: string) => void;
}

export function GeneralSettingsPage({ isActive }: GeneralSettingsPageProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyVat, setCompanyVat] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [brandColor, setBrandColor] = useState('#3b82f6');

  useEffect(() => {
    if (isActive) {
      loadSettings();
    }
  }, [isActive]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setCompanyName(profile.company_name || '');
        setCompanyAddress(profile.company_address || '');
        setCompanyVat(profile.company_vat || '');
        setCompanyWebsite(profile.company_website || '');
        setCompanyPhone(profile.company_phone || '');
        setBrandColor(profile.brand_color || '#3b82f6');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          company_name: companyName,
          company_address: companyAddress,
          company_vat: companyVat,
          company_website: companyWebsite,
          company_phone: companyPhone,
          brand_color: brandColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres généraux</h2>
            <p className="text-slate-400 text-sm">
              Gérez vos informations personnelles et d'entreprise
            </p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              Informations du compte
            </h3>

            {/* Logo Upload */}
            <div className="mb-6">
              <Label className="text-slate-300 mb-2 block">Logo de l'entreprise</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-orange-500">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="border-[#2a2a2a] text-slate-300">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter un logo
                  </Button>
                  <p className="text-xs text-slate-500">
                    Formats acceptés : JPG, PNG, WebP. Taille max : 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md">
                  <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                    EMAIL
                  </span>
                  <span className="text-white">{email}</span>
                </div>
                <p className="text-xs text-slate-500">L'email ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nom complet
                  </span>
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  placeholder="Alex Mira"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-400" />
              Informations de l'entreprise
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Nom de l'entreprise
                  </span>
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  placeholder="Ex: Devisia Technologies"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300"># Numéro de TVA</Label>
                <Input
                  value={companyVat}
                  onChange={(e) => setCompanyVat(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  placeholder="FR12345678901"
                />
                <p className="text-xs text-slate-500">
                  Format: Code pays + 11 chiffres (ex: FR12345678901)
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label className="text-slate-300">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Adresse de l'entreprise
                </span>
              </Label>
              <Textarea
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                placeholder="123 Rue de la Technologie 75001 Paris, France"
                rows={3}
              />
              <p className="text-xs text-slate-500">
                Cette adresse apparaîtra sur vos documents officiels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Site web
                  </span>
                </Label>
                <Input
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  placeholder="https://votre-site.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Téléphone
                  </span>
                </Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Settings */}
      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Couleur principale de l'entreprise
          </h3>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg border border-[#2a2a2a]"
              style={{ backgroundColor: brandColor }}
            />
            <Input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-24 h-12 bg-[#1a1a1a] border-[#2a2a2a]"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-white"
              placeholder="#3b82f6"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les modifications'}
        </Button>
      </div>
    </div>
  );
}
