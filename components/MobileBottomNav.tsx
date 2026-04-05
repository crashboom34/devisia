'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FileText, Receipt, Users, FilePlus, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'dashboard',
    label: 'Accueil',
    href: '/dashboard',
    icon: LayoutDashboard,
    matchExact: true,
  },
  {
    id: 'new-quote',
    label: 'Nouveau',
    href: '/project/new',
    icon: FilePlus,
    isPrimary: true,
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
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.matchExact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-white/98 backdrop-blur-xl border-t border-gray-200">
        <div className="flex items-end justify-around px-1 pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab);

            if (tab.isPrimary) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className="flex flex-col items-center justify-center -mt-4 relative"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-green flex items-center justify-center shadow-lg shadow-brand-green/30 active:scale-95 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-brand-green mt-1">
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px] rounded-xl transition-all duration-200 active:scale-95',
                  active ? 'text-brand-green' : 'text-gray-400'
                )}
              >
                <div className={cn(
                  'relative p-1.5 rounded-xl transition-all duration-200',
                  active && 'bg-brand-green/10'
                )}>
                  <Icon className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    active ? 'text-brand-green' : 'text-gray-400'
                  )} />
                  {active && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-green" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium mt-0.5 transition-colors duration-200',
                  active ? 'text-brand-green' : 'text-gray-400'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
