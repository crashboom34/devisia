'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function MobileCTABar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ${
      visible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg">
        <Link href="/auth/register" className="block">
          <Button className="w-full bg-brand-green hover:bg-brand-greenDark text-white py-3 h-auto font-semibold">
            Essai gratuit 14 jours
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-center text-xs text-gray-400 mt-1.5">Sans carte bancaire</p>
      </div>
    </div>
  );
}
