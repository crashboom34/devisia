'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationItemIsActive, primaryNavigation } from '@/components/app-navigation';

const tabs = [primaryNavigation[0], primaryNavigation[1], primaryNavigation[2], primaryNavigation[3]];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl lg:hidden">
      <div className="safe-area-bottom grid grid-cols-5 items-end px-1 pt-1.5">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const active = navigationItemIsActive(pathname, tab);

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="mb-0.5 h-5 w-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          <Link href="/project/new" className="-mt-5 flex min-h-16 flex-col items-center justify-center text-primary" aria-label="Créer un nouveau devis">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <FilePlus className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="mt-0.5 text-[10px] font-semibold">Nouveau</span>
          </Link>

          {tabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            const active = navigationItemIsActive(pathname, tab);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="mb-0.5 h-5 w-5" aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
