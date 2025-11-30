'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  HelpCircle,
  FileText,
  Lock,
  Eye,
  Download,
  Trash2,
  LogOut,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Zap,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Clock,
  Languages,
  Accessibility,
  Save,
  Upload,
  Key,
  AlertTriangle,
  Info,
  ExternalLink,
  ArrowLeft,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageSwitcher } from '@/components/SettingsNavigation';

interface UserSettings {
  // Account
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_address: string;
  company_vat: string;
  avatar_url: string;

  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  quote_reminders: boolean;
  marketing_emails: boolean;
  sms_notifications: boolean;
  notification_sound: string;

  // Privacy & Security
  two_factor_enabled: boolean;
  session_timeout: number;
  show_profile_publicly: boolean;
  allow_analytics: boolean;

  // Display & Theme
  theme: 'light' | 'dark' | 'auto';
  font_size: 'small' | 'medium' | 'large';
  color_scheme: string;
  compact_mode: boolean;
  animations_enabled: boolean;

  // Language & Region
  language: string;
  timezone: string;
  date_format: string;
  currency: string;

  // Business Settings
  quote_prefix: string;
  default_vat_rate: number;
  payment_terms_days: number;
  default_notes: string;

  // Preferences
  auto_save: boolean;
  sound_effects: boolean;
  keyboard_shortcuts: boolean;
}

export default function CompleteSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  const [settings, setSettings] = useState<UserSettings>({
    // Account
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_address: '',
    company_vat: '',
    avatar_url: '',

    // Notifications
    email_notifications: true,
    push_notifications: true,
    quote_reminders: true,
    marketing_emails: false,
    sms_notifications: false,
    notification_sound: 'default',

    // Privacy & Security
    two_factor_enabled: false,
    session_timeout: 30,
    show_profile_publicly: false,
    allow_analytics: true,

    // Display & Theme
    theme: 'dark',
    font_size: 'medium',
    color_scheme: '#3b82f6',
    compact_mode: false,
    animations_enabled: true,

    // Language & Region
    language: 'fr',
    timezone: 'Europe/Paris',
    date_format: 'DD/MM/YYYY',
    currency: 'EUR',

    // Business Settings
    quote_prefix: 'DEV',
    default_vat_rate: 20,
    payment_terms_days: 30,
    default_notes: '',

    // Preferences
    auto_save: true,
    sound_effects: true,
    keyboard_shortcuts: true,
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
        full_name: profile.full_name || '',
        email: user?.email || '',
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
          full_name: settings.full_name,
          company_name: settings.company_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        alert('Erreur lors de la sauvegarde');
      } else {
        alert('Paramètres sauvegardés avec succès');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    alert('Export des données en cours...');
  };

  const handleDeleteAccount = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      alert('Suppression du compte...');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Paramètres Complets</h1>
                <p className="text-sm text-slate-400">Gérez tous les paramètres de votre compte et application</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PageSwitcher currentPage="complete" />
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs Navigation */}
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 bg-[#0f0f0f] p-2 h-auto">
            <TabsTrigger value="account" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <User className="h-5 w-5" />
              <span className="text-xs">Compte</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <Bell className="h-5 w-5" />
              <span className="text-xs">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <Shield className="h-5 w-5" />
              <span className="text-xs">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <Palette className="h-5 w-5" />
              <span className="text-xs">Apparence</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <Globe className="h-5 w-5" />
              <span className="text-xs">Langue</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <FileText className="h-5 w-5" />
              <span className="text-xs">Entreprise</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <Database className="h-5 w-5" />
              <span className="text-xs">Données</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-blue-600">
              <HelpCircle className="h-5 w-5" />
              <span className="text-xs">Aide</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-400" />
                    Informations personnelles
                  </h2>

                  {/* Avatar */}
                  <div className="mb-6">
                    <Label className="text-slate-300 mb-2 block">Photo de profil</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {settings.full_name.charAt(0) || 'U'}
                      </div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="border-[#2a2a2a] text-slate-300">
                          <Upload className="h-4 w-4 mr-2" />
                          Changer la photo
                        </Button>
                        <p className="text-xs text-slate-500">JPG, PNG ou GIF. Max 5MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Nom complet</Label>
                      <Input
                        value={settings.full_name}
                        onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="Alex Mira"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Email</Label>
                      <Input
                        value={user?.email}
                        disabled
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-slate-400"
                      />
                      <p className="text-xs text-slate-500">L'email ne peut pas être modifié</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Téléphone</Label>
                      <Input
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Entreprise</Label>
                      <Input
                        value={settings.company_name}
                        onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label className="text-slate-300">Adresse de l'entreprise</Label>
                    <Textarea
                      value={settings.company_address}
                      onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      placeholder="123 Rue de la Technologie, 75001 Paris"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label className="text-slate-300">Numéro de TVA</Label>
                    <Input
                      value={settings.company_vat}
                      onChange={(e) => setSettings({ ...settings, company_vat: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-400" />
                    Changer le mot de passe
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Mot de passe actuel</Label>
                      <Input
                        type="password"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Nouveau mot de passe</Label>
                        <Input
                          type="password"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Confirmer le mot de passe</Label>
                        <Input
                          type="password"
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      <Key className="h-4 w-4 mr-2" />
                      Mettre à jour le mot de passe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-400" />
                    Préférences de notification
                  </h2>

                  <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-orange-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Notifications par email</h3>
                          <p className="text-sm text-slate-400">Recevoir les notifications importantes par email</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Smartphone className="h-5 w-5 text-orange-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Notifications push</h3>
                          <p className="text-sm text-slate-400">Notifications en temps réel sur votre appareil</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.push_notifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, push_notifications: checked })}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {/* Quote Reminders */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-orange-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Rappels de devis</h3>
                          <p className="text-sm text-slate-400">Recevoir des rappels pour les devis en attente</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.quote_reminders}
                        onCheckedChange={(checked) => setSettings({ ...settings, quote_reminders: checked })}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-orange-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Notifications SMS</h3>
                          <p className="text-sm text-slate-400">Alertes par SMS pour les actions critiques</p>
                          <Badge variant="outline" className="mt-1 border-blue-500 text-blue-400 text-xs">Premium</Badge>
                        </div>
                      </div>
                      <Switch
                        checked={settings.sms_notifications}
                        onCheckedChange={(checked) => setSettings({ ...settings, sms_notifications: checked })}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>

                    {/* Marketing Emails */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Emails marketing</h3>
                          <p className="text-sm text-slate-400">Recevoir des informations sur les nouveautés</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.marketing_emails}
                        onCheckedChange={(checked) => setSettings({ ...settings, marketing_emails: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Son des notifications</h3>
                  <Select value={settings.notification_sound} onValueChange={(value) => setSettings({ ...settings, notification_sound: value })}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="default" className="text-white">Son par défaut</SelectItem>
                      <SelectItem value="chime" className="text-white">Carillon</SelectItem>
                      <SelectItem value="bell" className="text-white">Cloche</SelectItem>
                      <SelectItem value="silent" className="text-white">Silencieux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    Sécurité et confidentialité
                  </h2>

                  <div className="space-y-4">
                    {/* Two-Factor Auth */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Key className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Authentification à deux facteurs</h3>
                          <p className="text-sm text-slate-400">Sécurisez votre compte avec la 2FA</p>
                          <Badge variant="outline" className="mt-1 border-green-500 text-green-400 text-xs">Recommandé</Badge>
                        </div>
                      </div>
                      <Switch
                        checked={settings.two_factor_enabled}
                        onCheckedChange={(checked) => setSettings({ ...settings, two_factor_enabled: checked })}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>

                    {/* Public Profile */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Eye className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Profil public</h3>
                          <p className="text-sm text-slate-400">Rendre votre profil visible publiquement</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.show_profile_publicly}
                        onCheckedChange={(checked) => setSettings({ ...settings, show_profile_publicly: checked })}
                      />
                    </div>

                    {/* Analytics */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-purple-400 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-white">Autoriser les analyses</h3>
                          <p className="text-sm text-slate-400">Aidez-nous à améliorer l'application</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.allow_analytics}
                        onCheckedChange={(checked) => setSettings({ ...settings, allow_analytics: checked })}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Délai d'expiration de session</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">{settings.session_timeout} minutes</span>
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {settings.session_timeout < 15 ? 'Court' : settings.session_timeout < 45 ? 'Moyen' : 'Long'}
                      </Badge>
                    </div>
                    <Slider
                      value={[settings.session_timeout]}
                      onValueChange={(value) => setSettings({ ...settings, session_timeout: value[0] })}
                      min={5}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500">
                      Vous serez déconnecté après {settings.session_timeout} minutes d'inactivité
                    </p>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-300 mb-1">Sessions actives</h4>
                      <p className="text-sm text-yellow-200/80 mb-3">3 appareils connectés à votre compte</p>
                      <Button variant="outline" size="sm" className="border-yellow-700 text-yellow-300 hover:bg-yellow-900/30">
                        <Monitor className="h-4 w-4 mr-2" />
                        Gérer les sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display & Theme Tab */}
          <TabsContent value="display" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-400" />
                    Apparence et affichage
                  </h2>

                  {/* Theme Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300 mb-3 block">Thème</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setSettings({ ...settings, theme: 'light' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.theme === 'light'
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-[#2a2a2a] bg-[#1a1a1a]'
                          }`}
                        >
                          <Sun className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                          <p className="text-sm text-white font-medium">Clair</p>
                        </button>
                        <button
                          onClick={() => setSettings({ ...settings, theme: 'dark' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.theme === 'dark'
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-[#2a2a2a] bg-[#1a1a1a]'
                          }`}
                        >
                          <Moon className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm text-white font-medium">Sombre</p>
                        </button>
                        <button
                          onClick={() => setSettings({ ...settings, theme: 'auto' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            settings.theme === 'auto'
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-[#2a2a2a] bg-[#1a1a1a]'
                          }`}
                        >
                          <Zap className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                          <p className="text-sm text-white font-medium">Auto</p>
                        </button>
                      </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    {/* Font Size */}
                    <div>
                      <Label className="text-slate-300 mb-3 block">Taille de police</Label>
                      <Select value={settings.font_size} onValueChange={(value: any) => setSettings({ ...settings, font_size: value })}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="small" className="text-white">Petite</SelectItem>
                          <SelectItem value="medium" className="text-white">Moyenne</SelectItem>
                          <SelectItem value="large" className="text-white">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    {/* Color Scheme */}
                    <div>
                      <Label className="text-slate-300 mb-3 block">Couleur d'accentuation</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-16 h-12 rounded-lg border border-[#2a2a2a]"
                          style={{ backgroundColor: settings.color_scheme }}
                        />
                        <Input
                          type="color"
                          value={settings.color_scheme}
                          onChange={(e) => setSettings({ ...settings, color_scheme: e.target.value })}
                          className="w-24 h-12 bg-[#1a1a1a] border-[#2a2a2a]"
                        />
                        <Input
                          value={settings.color_scheme}
                          onChange={(e) => setSettings({ ...settings, color_scheme: e.target.value })}
                          className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-white"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    {/* Display Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-white">Mode compact</span>
                        </div>
                        <Switch
                          checked={settings.compact_mode}
                          onCheckedChange={(checked) => setSettings({ ...settings, compact_mode: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-white">Animations</span>
                        </div>
                        <Switch
                          checked={settings.animations_enabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, animations_enabled: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-white">Effets sonores</span>
                        </div>
                        <Switch
                          checked={settings.sound_effects}
                          onCheckedChange={(checked) => setSettings({ ...settings, sound_effects: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language & Region Tab */}
          <TabsContent value="language" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Langue et région
                  </h2>

                  <div className="space-y-4">
                    {/* Language */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Langue de l'interface</Label>
                      <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="fr" className="text-white">🇫🇷 Français</SelectItem>
                          <SelectItem value="en" className="text-white">🇬🇧 English</SelectItem>
                          <SelectItem value="es" className="text-white">🇪🇸 Español</SelectItem>
                          <SelectItem value="de" className="text-white">🇩🇪 Deutsch</SelectItem>
                          <SelectItem value="it" className="text-white">🇮🇹 Italiano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Fuseau horaire</Label>
                      <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="Europe/Paris" className="text-white">Europe/Paris (GMT+1)</SelectItem>
                          <SelectItem value="Europe/London" className="text-white">Europe/London (GMT)</SelectItem>
                          <SelectItem value="America/New_York" className="text-white">America/New_York (GMT-5)</SelectItem>
                          <SelectItem value="America/Los_Angeles" className="text-white">America/Los_Angeles (GMT-8)</SelectItem>
                          <SelectItem value="Asia/Tokyo" className="text-white">Asia/Tokyo (GMT+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Format de date</Label>
                      <Select value={settings.date_format} onValueChange={(value) => setSettings({ ...settings, date_format: value })}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="DD/MM/YYYY" className="text-white">DD/MM/YYYY (31/12/2025)</SelectItem>
                          <SelectItem value="MM/DD/YYYY" className="text-white">MM/DD/YYYY (12/31/2025)</SelectItem>
                          <SelectItem value="YYYY-MM-DD" className="text-white">YYYY-MM-DD (2025-12-31)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Devise</Label>
                      <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="EUR" className="text-white">EUR (€)</SelectItem>
                          <SelectItem value="USD" className="text-white">USD ($)</SelectItem>
                          <SelectItem value="GBP" className="text-white">GBP (£)</SelectItem>
                          <SelectItem value="CHF" className="text-white">CHF (Fr)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <p className="font-semibold mb-1">Localisation automatique</p>
                      <p>Ces paramètres affectent l'affichage des dates, heures et montants dans l'application.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Settings Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    Paramètres métier
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Préfixe des devis</Label>
                      <Input
                        value={settings.quote_prefix}
                        onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="DEV"
                      />
                      <p className="text-xs text-slate-500">Ex: DEV-0001</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">TVA par défaut (%)</Label>
                      <Input
                        type="number"
                        value={settings.default_vat_rate}
                        onChange={(e) => setSettings({ ...settings, default_vat_rate: parseFloat(e.target.value) })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Délai de paiement (jours)</Label>
                      <Input
                        type="number"
                        value={settings.payment_terms_days}
                        onChange={(e) => setSettings({ ...settings, payment_terms_days: parseInt(e.target.value) })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        placeholder="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Devise par défaut</Label>
                      <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                        <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="EUR" className="text-white">EUR (€)</SelectItem>
                          <SelectItem value="USD" className="text-white">USD ($)</SelectItem>
                          <SelectItem value="GBP" className="text-white">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label className="text-slate-300">Notes par défaut sur les devis</Label>
                    <Textarea
                      value={settings.default_notes}
                      onChange={(e) => setSettings({ ...settings, default_notes: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      placeholder="Ces notes apparaîtront automatiquement sur tous vos nouveaux devis..."
                      rows={4}
                    />
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Préférences de travail</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-white">Sauvegarde automatique</span>
                      </div>
                      <Switch
                        checked={settings.auto_save}
                        onCheckedChange={(checked) => setSettings({ ...settings, auto_save: checked })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-white">Raccourcis clavier</span>
                      </div>
                      <Switch
                        checked={settings.keyboard_shortcuts}
                        onCheckedChange={(checked) => setSettings({ ...settings, keyboard_shortcuts: checked })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-400" />
                    Gestion des données
                  </h2>

                  {/* Export Data */}
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white mb-1">Exporter vos données</h3>
                        <p className="text-sm text-slate-400">
                          Téléchargez une copie de toutes vos données au format JSON
                        </p>
                      </div>
                      <Button
                        onClick={handleExportData}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </div>

                  {/* Storage Usage */}
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <h3 className="font-semibold text-white mb-3">Utilisation du stockage</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Documents et fichiers</span>
                          <span className="text-white font-medium">45 MB / 5 GB</span>
                        </div>
                        <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: '15%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Base de données</span>
                          <span className="text-white font-medium">12 MB</span>
                        </div>
                        <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '8%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cache Management */}
                  <div className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white mb-1">Vider le cache</h3>
                        <p className="text-sm text-slate-400">
                          Libérez de l'espace en supprimant les données temporaires
                        </p>
                      </div>
                      <Button variant="outline" className="border-[#2a2a2a] text-slate-300">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Vider
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* Danger Zone */}
                <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-300 mb-1">Zone dangereuse</h3>
                      <p className="text-sm text-red-200/80">
                        Actions irréversibles qui affectent définitivement votre compte
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-red-700 text-red-300 hover:bg-red-900/30"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Help & Support Tab */}
          <TabsContent value="help" className="space-y-6">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-400" />
                    Aide et support
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Documentation */}
                    <a
                      href="#"
                      className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-blue-500 transition-colors group"
                    >
                      <FileText className="h-8 w-8 text-blue-400 mb-3" />
                      <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400">Documentation</h3>
                      <p className="text-sm text-slate-400">Guides et tutoriels complets</p>
                      <ExternalLink className="h-4 w-4 text-slate-500 mt-2" />
                    </a>

                    {/* FAQ */}
                    <a
                      href="#"
                      className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-emerald-500 transition-colors group"
                    >
                      <HelpCircle className="h-8 w-8 text-emerald-400 mb-3" />
                      <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400">FAQ</h3>
                      <p className="text-sm text-slate-400">Questions fréquemment posées</p>
                      <ExternalLink className="h-4 w-4 text-slate-500 mt-2" />
                    </a>

                    {/* Contact Support */}
                    <a
                      href="#"
                      className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 transition-colors group"
                    >
                      <Mail className="h-8 w-8 text-purple-400 mb-3" />
                      <h3 className="font-semibold text-white mb-1 group-hover:text-purple-400">Contacter le support</h3>
                      <p className="text-sm text-slate-400">Obtenez de l'aide personnalisée</p>
                      <ExternalLink className="h-4 w-4 text-slate-500 mt-2" />
                    </a>

                    {/* Community */}
                    <a
                      href="#"
                      className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-orange-500 transition-colors group"
                    >
                      <Users className="h-8 w-8 text-orange-400 mb-3" />
                      <h3 className="font-semibold text-white mb-1 group-hover:text-orange-400">Communauté</h3>
                      <p className="text-sm text-slate-400">Rejoignez notre communauté</p>
                      <ExternalLink className="h-4 w-4 text-slate-500 mt-2" />
                    </a>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* App Info */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Informations de l'application</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Version</span>
                      <span className="text-white font-mono">2.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dernière mise à jour</span>
                      <span className="text-white">30 Novembre 2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Environnement</span>
                      <Badge variant="outline" className="border-green-600 text-green-400">Production</Badge>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* Legal Links */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Mentions légales</h3>
                  <div className="space-y-2">
                    <Link href="/terms" className="block text-sm text-blue-400 hover:underline">
                      Conditions d'utilisation
                    </Link>
                    <Link href="/privacy" className="block text-sm text-blue-400 hover:underline">
                      Politique de confidentialité
                    </Link>
                    <a href="#" className="block text-sm text-blue-400 hover:underline">
                      Licences open source
                    </a>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* Logout */}
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6"
                  onClick={() => {
                    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                      supabase.auth.signOut();
                      router.push('/auth/login');
                    }
                  }}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Se déconnecter
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
