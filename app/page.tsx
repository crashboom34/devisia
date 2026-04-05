'use client';

import { HeroSection } from '@/components/marketing/HeroSection';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { ReassuranceBar } from '@/components/marketing/ReassuranceBar';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { HomePricing } from '@/components/marketing/HomePricing';
import { ForWhoSection } from '@/components/marketing/ForWhoSection';
import { HomeFAQ } from '@/components/marketing/HomeFAQ';
import { CTASection } from '@/components/marketing/CTASection';
import { MobileCTABar } from '@/components/marketing/MobileCTABar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <HeroSection />
        <ReassuranceBar />
        <HowItWorks />

        <HomePricing />

        <ForWhoSection />

        <HomeFAQ />

        <CTASection
          title="Pret a gagner du temps sur vos devis ?"
          description="Votre premier devis en 2 minutes."
          cta={{
            label: "Demarrer l'essai gratuit",
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
      <MobileCTABar />
    </div>
  );
}
