'use client';
/* eslint-disable react/no-unescaped-entities, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  Settings as SettingsIcon,
  FileText,
  Bell,
  Palette,
  Shield,
  Building2,
  Mail,
  User,
  Globe,
  Phone,
  Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';

type SettingsSection = 'general' | 'devis' | 'notifications' | 'appearance' | 'security';

interface UserSettings {
  email_notifications: boolean;
  quote_reminders: boolean;
  marketing_emails: boolean;
  quote_prefix: string;
  default_vat_rate: number;
  default_currency: string;
  payment_terms_days: number;
  default_notes: string;
  company_name: string;
  company_address: string;
  company_vat_number: string;
  company_website: string;
  company_phone: string;
  company_logo_url: string;
  brand_color: string;
}

export default function ParametresPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('notifications');

  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    quote_reminders: true,
    marketing_emails: false,
    quote_prefix: 'DEV',
    default_vat_rate: 20,
    default_currency: 'EUR',
    payment_terms_days: 30,
    default_notes: '',
    company_name: '',
    company_address: '',
    company_vat_number: '',
    company_website: '',
    company_phone: '',
    company_logo_url: '',
    brand_color: '#3b82f6',
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setUser(user);
    await loadSettings(user.id);
    setLoading(false);
  };

  const loadSettings = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setSettings(prev => ({
        ...prev,
        company_name: profile.company_name || '',
      }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: settings.company_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving settings:', error);
        alert('Erreur lors de la sauvegarde des paramètres');
      } else {
        alert('Paramètres sauvegardés avec succès');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      id: 'general' as SettingsSection,
      icon: SettingsIcon,
      title: 'Général',
      subtitle: 'Paramètres généraux de votre compte',
    },
    {
      id: 'devis' as SettingsSection,
      icon: FileText,
      title: 'Devis',
      subtitle: 'Paramètres des devis',
    },
    {
      id: 'notifications' as SettingsSection,
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Paramètres de notification',
    },
    {
      id: 'appearance' as SettingsSection,
      icon: Palette,
      title: 'Apparence',
      subtitle: 'Paramètres d\'apparence',
    },
    {
      id: 'security' as SettingsSection,
      icon: Shield,
      title: 'Sécurité',
      subtitle: 'Paramètres de sécurité',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <DashboardLayout showNewQuoteButton={false}>
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
          <p className="text-slate-400">Gérez les paramètres de votre compte et application</p>
        </div>

        {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Navigation */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;

                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? '' : 'text-slate-400'}`} />
                          <div className="text-left">
                            <div className="font-medium text-sm">{section.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{section.subtitle}</div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-2">
              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                  <CardHeader className="border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                        <Bell className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Paramètres de notification</CardTitle>
                        <CardDescription className="text-slate-400">
                          Gérez les paramètres de notification
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-start justify-between p-4 rounded-lg bg-slate-900 border border-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Bell className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">Notifications par email</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Recevoir les notifications importantes par email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, email_notifications: checked })
                        }
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {/* Quote Reminders */}
                    <div className="flex items-start justify-between p-4 rounded-lg bg-slate-900 border border-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <FileText className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">Rappels de devis</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Recevoir des rappels pour les devis en attente
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.quote_reminders}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, quote_reminders: checked })
                        }
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {/* Marketing Emails */}
                    <div className="flex items-start justify-between p-4 rounded-lg bg-slate-900 border border-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Mail className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">Emails marketing</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Recevoir des informations sur les nouveautés et conseils
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.marketing_emails}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, marketing_emails: checked })
                        }
                        className="data-[state=checked]:bg-slate-500"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>Sauvegarde...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder les préférences
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Devis Section */}
              {activeSection === 'devis' && (
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                  <CardHeader className="border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                        <FileText className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Paramètres des devis</CardTitle>
                        <CardDescription className="text-slate-400">
                          Gérez les paramètres des devis
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quote_prefix" className="text-slate-300 text-sm">
                          Préfixe des devis
                        </Label>
                        <Input
                          id="quote_prefix"
                          value={settings.quote_prefix}
                          onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
                          placeholder="DEV"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        />
                        <p className="text-xs text-slate-500">
                          Exemple: "DEV" donnera des numéros comme DEV-0001
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vat_rate" className="text-slate-300 text-sm">
                          TVA par défaut (%)
                        </Label>
                        <Input
                          id="vat_rate"
                          type="number"
                          value={settings.default_vat_rate}
                          onChange={(e) => setSettings({ ...settings, default_vat_rate: parseFloat(e.target.value) })}
                          placeholder="20"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-slate-300 text-sm">
                          Devise par défaut
                        </Label>
                        <Select value={settings.default_currency} onValueChange={(value) => setSettings({ ...settings, default_currency: value })}>
                          <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#242424] border-[#2a2a2a]">
                            <SelectItem value="EUR" className="text-white">EUR (€)</SelectItem>
                            <SelectItem value="USD" className="text-white">USD ($)</SelectItem>
                            <SelectItem value="GBP" className="text-white">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_terms" className="text-slate-300 text-sm">
                          Délai de paiement (jours)
                        </Label>
                        <Input
                          id="payment_terms"
                          type="number"
                          value={settings.payment_terms_days}
                          onChange={(e) => setSettings({ ...settings, payment_terms_days: parseInt(e.target.value) })}
                          placeholder="30"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default_notes" className="text-slate-300 text-sm">
                        Notes par défaut
                      </Label>
                      <Textarea
                        id="default_notes"
                        value={settings.default_notes}
                        onChange={(e) => setSettings({ ...settings, default_notes: e.target.value })}
                        placeholder="Notes qui apparaîtront par défaut sur vos devis..."
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[120px]"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>Sauvegarde...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder les modifications
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* General Section */}
              {activeSection === 'general' && (
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                  <CardHeader className="border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                        <SettingsIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Paramètres généraux</CardTitle>
                        <CardDescription className="text-slate-400">
                          Gérez vos informations personnelles et d'entreprise
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Informations du compte
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <Label className="text-slate-300 text-sm">Logo de l'entreprise</Label>
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-20 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                                <div className="text-center">
                                  <Upload className="h-6 w-6 text-slate-500 mx-auto" />
                                  <p className="text-xs text-orange-400 mt-1">Logo non configuré</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="border-[#2a2a2a] text-slate-300 bg-transparent hover:bg-[#1a1a1a]">
                                <Upload className="h-4 w-4 mr-2" />
                                Ajouter un logo
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                              Formats acceptés : JPG, PNG, WebP. Taille max : 5MB
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                              <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
                                <Mail className="h-3 w-3" />
                                EMAIL
                              </div>
                              <p className="text-white text-sm">{user?.email}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                              <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
                                <User className="h-3 w-3" />
                                NOM COMPLET
                              </div>
                              <p className="text-white text-sm">Alex Mira</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    <div>
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Informations de l'entreprise
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company_name" className="text-slate-300 text-sm flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              Nom de l'entreprise
                            </Label>
                            <Input
                              id="company_name"
                              value={settings.company_name}
                              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                              placeholder="Ex: Devisia Technologies"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vat_number" className="text-slate-300 text-sm">
                              # Numéro de TVA
                            </Label>
                            <Input
                              id="vat_number"
                              value={settings.company_vat_number}
                              onChange={(e) => setSettings({ ...settings, company_vat_number: e.target.value })}
                              placeholder="FR12345678901"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            />
                            <p className="text-xs text-slate-500">
                              Format: Code pays + II chiffres (ex: FR12345678901)
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_address" className="text-slate-300 text-sm flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            Adresse de l'entreprise
                          </Label>
                          <Textarea
                            id="company_address"
                            value={settings.company_address}
                            onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                            placeholder="123 Rue de la Technologie 75001 Paris, France"
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            rows={3}
                          />
                          <p className="text-xs text-slate-500">
                            Cette adresse apparaîtra sur vos documents officiels
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website" className="text-slate-300 text-sm flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              Site web
                            </Label>
                            <Input
                              id="website"
                              value={settings.company_website}
                              onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
                              placeholder="https://votre-site.com"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-slate-300 text-sm flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              Téléphone
                            </Label>
                            <Input
                              id="phone"
                              value={settings.company_phone}
                              onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                              placeholder="+33 1 23 45 67 89"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="brand_color" className="text-slate-300 text-sm flex items-center gap-2">
                            <Palette className="h-3 w-3" />
                            Couleur principale de l'entreprise
                          </Label>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-16 h-10 rounded-lg border border-[#2a2a2a]"
                              style={{ backgroundColor: settings.brand_color }}
                            />
                            <Input
                              id="brand_color"
                              value={settings.brand_color}
                              onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                              placeholder="#3b82f6"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-white flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>Sauvegarde...</>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder les modifications
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                        <Shield className="h-10 w-10 text-red-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">Paramètres de sécurité</h2>
                      <p className="text-slate-400 mb-6">Cette section sera bientôt disponible</p>
                      <p className="text-sm text-slate-500">
                        Futurs paramètres : Authentification à deux facteurs, Gestion des sessions, Historique de connexion
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <Card className="bg-gradient-to-br from-slate-800/90 to-slate-800/50 border-slate-700/50 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
                        <Palette className="h-10 w-10 text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3">Paramètres d'apparence</h2>
                      <p className="text-slate-400 mb-6">Cette section sera bientôt disponible</p>
                      <p className="text-sm text-slate-500">
                        Futurs paramètres : Thème sombre/clair, Taille de police, Couleurs personnalisées
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
