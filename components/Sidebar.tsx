'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Receipt,
  Users,
  Settings,
  CreditCard,
  FilePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-green shadow-lg shadow-brand-green/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Devisia</span>
        </Link>
      </div>

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
                'hover:bg-gray-50 active:scale-[0.98]',
                active
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-brand-green' : 'text-gray-400')} />
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

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-400 text-center">
          v2.0 - Devisia
        </div>
      </div>
    </aside>
  );
}
