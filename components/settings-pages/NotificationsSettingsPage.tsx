'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Bell, Mail, Smartphone, FileText, Phone, Save } from 'lucide-react';

interface NotificationsSettingsPageProps {
  isActive: boolean;
}

export function NotificationsSettingsPage({ isActive }: NotificationsSettingsPageProps) {
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [quoteReminders, setQuoteReminders] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [notificationSound, setNotificationSound] = useState('default');

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Préférences de notification sauvegardées');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Bell className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres de notification</h2>
            <p className="text-slate-400 text-sm">
              Gérez les paramètres de notification
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Notifications par email</h3>
                <p className="text-sm text-slate-400">Recevoir les notifications importantes par email</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Notifications push</h3>
                <p className="text-sm text-slate-400">Notifications en temps réel sur votre appareil</p>
              </div>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Rappels de devis</h3>
                <p className="text-sm text-slate-400">Recevoir des rappels pour les devis en attente</p>
              </div>
            </div>
            <Switch
              checked={quoteReminders}
              onCheckedChange={setQuoteReminders}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Notifications SMS</h3>
                <p className="text-sm text-slate-400">Alertes par SMS pour les actions critiques</p>
              </div>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white">Emails marketing</h3>
                <p className="text-sm text-slate-400">Recevoir des informations sur les nouveautés et conseils</p>
              </div>
            </div>
            <Switch
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound Settings */}
      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Son des notifications</h3>
          <Select value={notificationSound} onValueChange={setNotificationSound}>
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
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
        </Button>
      </div>
    </div>
  );
}
