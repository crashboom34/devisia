'use client';

import { Sidebar } from './Sidebar';
import UserMenu from './UserMenu';
import { Button } from './ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showNewQuoteButton?: boolean;
}

export function DashboardLayout({ children, showNewQuoteButton = true }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#020617] flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-30 shadow-2xl">
          <div className="px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-end gap-3">
            {showNewQuoteButton && (
              <Link href="/project/new">
                <Button variant="primary" size="sm" className="lg:text-base">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouveau Devis</span>
                  <span className="sm:hidden">Devis</span>
                </Button>
              </Link>
            )}
            <UserMenu />
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
