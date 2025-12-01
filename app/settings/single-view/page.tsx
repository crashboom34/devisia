'use client';

import { SettingsPageManager } from '@/components/SettingsPageManager';
import { GeneralSettingsPage } from '@/components/settings-pages/GeneralSettingsPage';
import { NotificationsSettingsPage } from '@/components/settings-pages/NotificationsSettingsPage';
import {
  Settings,
  FileText,
  Bell,
  Palette,
  Shield,
} from 'lucide-react';

/**
 * Single-View Settings Page
 *
 * This page demonstrates the SettingsPageManager component
 * which ensures only ONE settings page is visible at a time.
 *
 * Key Features:
 * - Only the active page is rendered in the DOM
 * - Smooth transitions between pages
 * - State persistence (URL + localStorage)
 * - Keyboard navigation (Alt+1, Alt+2, etc.)
 * - Responsive design
 */

// Placeholder components for other pages
function DevisSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres des devis</h2>
            <p className="text-slate-400 text-sm">Configuration des devis et factures</p>
          </div>
        </div>
      </div>
      <div className="text-white">Contenu des paramètres de devis...</div>
    </div>
  );
}

function AppearanceSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Palette className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres d'apparence</h2>
            <p className="text-slate-400 text-sm">Personnalisez l'interface</p>
          </div>
        </div>
      </div>
      <div className="text-white">Contenu des paramètres d'apparence...</div>
    </div>
  );
}

function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#2a2a2a] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres de sécurité</h2>
            <p className="text-slate-400 text-sm">Protection de votre compte</p>
          </div>
        </div>
      </div>
      <div className="text-white">Contenu des paramètres de sécurité...</div>
    </div>
  );
}

export default function SingleViewSettingsPage() {
  const pages = [
    {
      id: 'general' as const,
      title: 'Général',
      description: 'Paramètres généraux de votre compte',
      icon: <Settings className="h-5 w-5" />,
      component: GeneralSettingsPage,
    },
    {
      id: 'devis' as const,
      title: 'Devis',
      description: 'Paramètres des devis',
      icon: <FileText className="h-5 w-5" />,
      component: DevisSettingsPage,
    },
    {
      id: 'notifications' as const,
      title: 'Notifications',
      description: 'Paramètres de notification',
      icon: <Bell className="h-5 w-5" />,
      component: NotificationsSettingsPage,
    },
    {
      id: 'appearance' as const,
      title: 'Apparence',
      description: 'Paramètres d\'apparence',
      icon: <Palette className="h-5 w-5" />,
      component: AppearanceSettingsPage,
    },
    {
      id: 'security' as const,
      title: 'Sécurité',
      description: 'Paramètres de sécurité',
      icon: <Shield className="h-5 w-5" />,
      component: SecuritySettingsPage,
    },
  ];

  return (
    <SettingsPageManager
      pages={pages}
      defaultPage="general"
      persistState={true}
      onPageChange={(pageId) => {
        console.log('Navigated to:', pageId);
      }}
    />
  );
}
