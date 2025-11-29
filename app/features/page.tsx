import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { CTASection } from '@/components/marketing/CTASection';
import { Sparkles, Clock, Mic, FileText, BarChart3, Download, Edit3, Users, Shield, Zap } from 'lucide-react';

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
              Découvrez les outils qui vous permettront de créer des devis professionnels en quelques minutes et d&apos;augmenter vos taux de conversion.
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
                title="Gain de Temps Radical"
                description="Créez un devis complet en 2 minutes au lieu de 2 heures. Concentrez-vous sur votre métier, pas sur la paperasse."
              />
              <FeatureCard
                icon={Mic}
                title="Dictée Vocale Intelligente"
                description="Décrivez votre projet à la voix, même sur chantier ou en déplacement. L'IA transcrit et structure automatiquement."
              />
              <FeatureCard
                icon={BarChart3}
                title="3 Scénarios Automatiques"
                description="Générez instantanément 3 versions (Éco, Standard, Premium) pour proposer plus d'options et maximiser vos ventes."
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
                description="Interface glisser-déposer simple et puissante. Modifiez vos devis sans compétences techniques requises."
              />
              <FeatureCard
                icon={Users}
                title="Gestion de Clients"
                description="Organisez vos contacts et infos client pour pré-remplir automatiquement vos devis et gagner encore plus de temps."
              />
              <FeatureCard
                icon={Shield}
                title="Données Sécurisées"
                description="Vos données sont hébergées en Europe avec chiffrement de bout en bout. Conformité RGPD garantie."
              />
              <FeatureCard
                icon={Zap}
                title="Modèles d'IA Multiples"
                description="Choisissez entre GPT-4, Claude ou d'autres modèles selon vos besoins de précision et de coût."
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
