'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  FilePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  navigationItemIsActive,
  primaryNavigation,
  secondaryNavigation,
  type AppNavigationItem,
} from '@/components/app-navigation';

export function Sidebar() {
  const pathname = usePathname();

  const renderItem = (item: AppNavigationItem) => {
    const Icon = item.icon;
    const active = navigationItemIsActive(pathname, item);

    return (
      <Link
        key={item.id}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-focus">
          <div className="rounded-lg bg-primary p-2 shadow-sm">
            <FileText className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-lg font-bold text-foreground">Devisia</span>
            <span className="block text-[11px] text-muted-foreground">Espace professionnel</span>
          </div>
        </Link>
      </div>

      <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        <Button asChild className="w-full justify-start">
          <Link href="/project/new">
            <FilePlus className="h-5 w-5" aria-hidden="true" />
            Nouveau devis
          </Link>
        </Button>

        <div className="space-y-1">{primaryNavigation.map(renderItem)}</div>

        <div className="mt-auto space-y-1 border-t border-border pt-4">
          {secondaryNavigation.map(renderItem)}
        </div>
      </nav>
    </aside>
  );
}
