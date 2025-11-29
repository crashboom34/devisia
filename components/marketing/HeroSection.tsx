import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCTA: {
    label: string;
    href: string;
  };
  secondaryCTA?: {
    label: string;
    href: string;
  };
  image?: React.ReactNode;
}

export function HeroSection({
  badge,
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  image,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-dark pt-20 pb-32 sm:pt-32 sm:pb-40">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1FBF7310_1px,transparent_1px),linear-gradient(to_bottom,#1FBF7310_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {badge && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-darkCard border border-brand-green/20 px-4 py-2 text-sm text-gray-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green"></span>
              </span>
              {badge}
            </div>
          )}

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl mb-6 animate-fade-in">
            {title}
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link href={primaryCTA.href}>
              <Button size="lg" className="bg-gradient-cta hover:opacity-90 text-white text-base px-8 py-6 h-auto">
                {primaryCTA.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {secondaryCTA && (
              <Link href={secondaryCTA.href}>
                <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-brand-darkCard text-base px-8 py-6 h-auto">
                  {secondaryCTA.label}
                </Button>
              </Link>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Aucun engagement. Annulable à tout moment. Données hébergées en Europe.
          </p>
        </div>

        {image && (
          <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {image}
          </div>
        )}
      </div>
    </section>
  );
}
