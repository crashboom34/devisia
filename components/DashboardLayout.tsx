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
    <div className="min-h-screen bg-[#020617] flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-slate-900/98 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 h-14 lg:h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Devisia</span>
            </Link>

            <div className="hidden lg:block flex-1" />

            <div className="flex items-center gap-2.5">
              {showNewQuoteButton && (
                <Link href="/project/new" className="hidden sm:block">
                  <Button variant="primary" size="sm">
                    Nouveau Devis
                  </Button>
                </Link>
              )}
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 lg:py-8 pb-24 lg:pb-8">
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}
