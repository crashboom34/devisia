'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Receipt,
  Users,
  Settings,
  CreditCard,
  FilePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sidebar Navigation Component
 *
 * Displays only 6 navigation items:
 * 1. Nouveaux devis (New Quotes)
 * 2. Devis (Quotes)
 * 3. Factures (Invoices)
 * 4. Clients (Clients)
 * 5. Paramètres (Settings)
 * 6. Abonnement (Subscription)
 */

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'new-quote',
    label: 'Nouveaux devis',
    href: '/project/new',
    icon: FilePlus,
  },
  {
    id: 'quotes',
    label: 'Devis',
    href: '/dashboard/quotes',
    icon: FileText,
  },
  {
    id: 'invoices',
    label: 'Factures',
    href: '/dashboard/invoices',
    icon: Receipt,
  },
  {
    id: 'clients',
    label: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    id: 'settings',
    label: 'Paramètres',
    href: '/settings/parametres',
    icon: Settings,
  },
  {
    id: 'subscription',
    label: 'Abonnement',
    href: '/pricing',
    icon: CreditCard,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">Devisia</span>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'hover:bg-slate-800/50',
                active
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-slate-400')} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Optional */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          v2.0 - Devisia
        </div>
      </div>
    </aside>
  );
}
