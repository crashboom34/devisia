'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navigation = [
  { name: 'Fonctionnalités', href: '/features' },
  { name: 'Tarifs', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'FAQ', href: '/faq' },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-sm border-b border-gray-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-green">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Devisia</span>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-brand-green ${
                    pathname === item.href ? 'text-brand-green' : 'text-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            {user ? (
              <>
                <Button asChild variant="ghost" className="text-gray-300 hover:bg-brand-darkCard hover:text-white">
                  <Link href="/dashboard">
                    Tableau de bord
                  </Link>
                </Button>
                <span className="text-sm text-gray-400">{user.email}</span>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-gray-300 hover:bg-brand-darkCard hover:text-white">
                  <Link href="/auth/login">
                    Connexion
                  </Link>
                </Button>
                <Button asChild className="bg-brand-green text-white hover:bg-green-600">
                  <Link href="/auth/register">
                    Commencer gratuitement
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="p-2 text-gray-300 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-800 py-4 lg:hidden">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-base font-medium transition-colors ${
                    pathname === item.href ? 'text-brand-green' : 'text-gray-300'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-800">
                {user ? (
                  <Button asChild variant="outline" className="w-full border-gray-700 text-white">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      Tableau de bord
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full border-gray-700 text-white">
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        Connexion
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-brand-green text-white hover:bg-green-600">
                      <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                        Commencer gratuitement
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
