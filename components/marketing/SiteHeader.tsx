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

            <div className="hidden md:flex items-center gap-6">
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

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-brand-darkCard">
                    Tableau de bord
                  </Button>
                </Link>
                <span className="text-sm text-gray-400">{user.email}</span>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-brand-darkCard">
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-brand-green hover:bg-green-600 text-white">
                    Commencer gratuitement
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
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
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-gray-700 text-white">
                      Tableau de bord
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-gray-700 text-white">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-brand-green hover:bg-green-600 text-white">
                        Commencer gratuitement
                      </Button>
                    </Link>
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
