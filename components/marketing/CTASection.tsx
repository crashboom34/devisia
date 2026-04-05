'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  title: string;
  description?: string;
  cta: {
    label: string;
    href: string;
  };
}

export function CTASection({ title, description, cta }: CTASectionProps) {
  return (
    <section className="py-20 bg-brand-green relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          {description && (
            <p className="text-lg text-white/90 mb-8">
              {description}
            </p>
          )}
          <Link href={cta.href}>
            <Button size="lg" className="bg-white text-brand-green hover:bg-gray-100 text-base px-8 py-6 h-auto font-semibold shadow-lg">
              {cta.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-white/80 mt-4">
            14 jours gratuits. Sans carte bancaire. Sans engagement.
          </p>
        </div>
      </div>
    </section>
  );
}
