'use client';

import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { CTASection } from '@/components/marketing/CTASection';
import { Sparkles, Clock, Mic, FileText, ChartBar as BarChart3, Download, CreditCard as Edit3, Users, Shield, Zap } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main>
        <section className="pt-24 pb-12 bg-gradient-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Fonctionnalités conçues pour accélérer votre succès
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Découvrez les outils qui structurent la préparation, la révision et le suivi de vos devis BTP.
            </p>
          </div>
        </section>

        <section className="py-20 bg-brand-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={Sparkles}
                title="Intelligence Artificielle Avancée"
                description="Notre IA analyse votre description et génère automatiquement des devis détaillés, structurés et professionnels adaptés à votre secteur."
              />
              <FeatureCard
                icon={Clock}
                title="Base de travail structurée"
                description="Partez d'une proposition organisée, puis concentrez votre temps sur les contrôles et ajustements métier."
              />
              <FeatureCard
                icon={Mic}
                title="Dictée Vocale Intelligente"
                description="Décrivez votre projet à la voix, même sur chantier ou en déplacement. L'IA transcrit et structure automatiquement."
              />
              <FeatureCard
                icon={BarChart3}
                title="3 Scénarios Automatiques"
                description="Comparez les versions Éco, Standard et Premium lorsque le projet génère plusieurs scénarios."
              />
              <FeatureCard
                icon={FileText}
                title="10 Templates BTP Professionnels"
                description="Modèles pré-configurés pour rénovation, construction, plomberie, électricité et plus encore. Prêts à l'emploi."
              />
              <FeatureCard
                icon={Download}
                title="Export PDF Instantané"
                description="Téléchargez vos devis au format PDF professionnel en un clic. Prêts à envoyer à vos clients immédiatement."
              />
              <FeatureCard
                icon={Edit3}
                title="Éditeur Intuitif"
                description="Modifiez les lignes, quantités, prix et informations du devis avant sa validation finale."
              />
              <FeatureCard
                icon={Users}
                title="Gestion de Clients"
                description="Organisez vos contacts et infos client pour pré-remplir automatiquement vos devis et gagner encore plus de temps."
              />
              <FeatureCard
                icon={Shield}
                title="Données Sécurisées"
                description="Les accès applicatifs sont contrôlés par compte et les données métier sont isolées par organisation. La sécurité reste vérifiée en continu pendant la bêta."
              />
              <FeatureCard
                icon={Zap}
                title="Moteur adapté à votre plan"
                description="Chaque plan embarque un moteur de génération calibré pour son niveau d'usage, du chantier simple au devis complexe multi-lots."
              />
            </div>
          </div>
        </section>

        <CTASection
          title="Prêt à découvrir toutes les fonctionnalités ?"
          description="Commencez gratuitement et explorez tous les outils Devisia."
          cta={{
            label: 'Créer mon compte',
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
