'use client';

import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { CTASection } from '@/components/marketing/CTASection';
import { MobileCTABar } from '@/components/marketing/MobileCTABar';
import { Sparkles, Clock, Mic, FileText, ChartBar as BarChart3, Download, CreditCard as Edit3, Users, Shield } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="pt-20 pb-12 bg-brand-light">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Tout ce qu&apos;il faut pour faire des devis pro
            </h1>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Des outils concrets pour creer des devis professionnels en quelques minutes.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={Sparkles}
                title="IA specialisee BTP"
                description="L'IA analyse votre description et genere un devis detaille, structure et adapte a votre secteur d'activite."
              />
              <FeatureCard
                icon={Clock}
                title="Un devis en 2 minutes"
                description="Fini les soirs sur Excel. Generez un devis complet en 2 minutes au lieu de 2 heures."
              />
              <FeatureCard
                icon={Mic}
                title="Dictee vocale"
                description="Decrivez votre projet a la voix, meme sur chantier. L'IA transcrit et structure automatiquement."
              />
              <FeatureCard
                icon={BarChart3}
                title="3 scenarios de prix"
                description="Generez automatiquement 3 versions (Eco, Standard, Premium) pour proposer plus d'options."
              />
              <FeatureCard
                icon={FileText}
                title="10 templates BTP"
                description="Modeles pre-configures pour renovation, construction, plomberie, electricite et plus encore."
              />
              <FeatureCard
                icon={Download}
                title="Export PDF en 1 clic"
                description="Telechargez vos devis au format PDF professionnel, prets a envoyer a vos clients."
              />
              <FeatureCard
                icon={Edit3}
                title="Editeur intuitif"
                description="Modifiez chaque ligne de votre devis facilement. Aucune competence technique requise."
              />
              <FeatureCard
                icon={Users}
                title="Gestion de clients"
                description="Organisez vos contacts pour pre-remplir automatiquement vos devis et gagner du temps."
              />
              <FeatureCard
                icon={Shield}
                title="Donnees securisees"
                description="Vos donnees sont hebergees en France avec chiffrement de bout en bout. Conforme RGPD."
              />
            </div>
          </div>
        </section>

        <CTASection
          title="Pret a tester ?"
          description="14 jours gratuits, sans carte bancaire."
          cta={{
            label: 'Creer mon premier devis gratuit',
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
      <MobileCTABar />
    </div>
  );
}
