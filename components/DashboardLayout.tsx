'use client';

import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import UserMenu from './UserMenu';
import { Button } from './ui/button';
import Link from 'next/link';
import { FileText } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showNewQuoteButton?: boolean;
}

export function DashboardLayout({ children, showNewQuoteButton = true }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:h-16 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
              <div className="rounded-lg bg-primary p-1.5">
                <FileText className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-foreground">Devisia</span>
            </Link>

            <div className="hidden lg:block flex-1" />

            <div className="flex items-center gap-2.5">
              {showNewQuoteButton && (
                <Link href="/project/new" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    Nouveau devis
                  </Button>
                </Link>
              )}
              <UserMenu />
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
