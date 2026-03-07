'use client';

import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/marketing/HeroSection';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { Sparkles, Clock, FileText, Mic, Zap, BarChart3, CheckCircle, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TestimonialsSection = dynamic(() => import('@/components/marketing/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const LogosSection = dynamic(() => import('@/components/marketing/LogosSection').then(m => ({ default: m.LogosSection })));
const ForWhoSection = dynamic(() => import('@/components/marketing/ForWhoSection').then(m => ({ default: m.ForWhoSection })));
const CTASection = dynamic(() => import('@/components/marketing/CTASection').then(m => ({ default: m.CTASection })));

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main>
        <HeroSection
          badge="Propulsé par l'IA - Créez vos devis en quelques minutes"
          title="Chaque devis mal fait te coûte de l’argent. Devisia corrige ça."
          subtitle="Dicte ton chantier, ajuste tes prix, Devisia génère un devis prêt à être envoyé, avec tes marges déjà intégrées. C’est ton nouveau copilote pour gagner plus en travaillant moins."
          primaryCTA={{
            label: 'Commencer gratuitement',
            href: '/auth/register',
          }}
          secondaryCTA={{
            label: 'Voir comment ça marche',
            href: '#features',
          }}
          image={
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-cta opacity-20 blur-3xl" />
              <Card className="relative bg-brand-darkCard border-gray-800 p-8 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-20 w-20 text-brand-green mx-auto mb-4" />
                    <p className="text-gray-400">Interface de génération de devis</p>
                  </div>
                </div>
              </Card>
            </div>
          }
        />

        <TestimonialsSection />
        <LogosSection />

        <section id="features" className="py-24 bg-brand-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Fonctionnalités conçues pour accélérer votre succès
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Découvrez les outils qui vous permettront de créer des devis professionnels en quelques minutes et d&apos;augmenter vos taux de conversion.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={Sparkles}
                title="IA Avancée"
                description="L'intelligence artificielle génère des devis professionnels adaptés à votre secteur d'activité en quelques secondes."
              />
              <FeatureCard
                icon={Clock}
                title="Gain de temps"
                description="Plus besoin de passer des heures sur Excel. Générez un devis complet en 2 minutes chrono."
              />
              <FeatureCard
                icon={Mic}
                title="Dictée vocale"
                description="Décrivez votre projet à la voix, même sur chantier. L'IA s'occupe de structurer votre devis."
              />
              <FeatureCard
                icon={BarChart3}
                title="3 Scénarios tarifaires"
                description="Proposez automatiquement Éco, Standard et Premium pour maximiser vos opportunités."
              />
              <FeatureCard
                icon={FileText}
                title="10 Templates BTP"
                description="Modèles professionnels pré-configurés pour tous types de travaux : rénovation, construction, etc."
              />
              <FeatureCard
                icon={Download}
                title="Export PDF instant"
                description="Téléchargez vos devis au format PDF prêts à envoyer à vos clients en un clic."
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-brand-darkLight">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Éditeur intuitif
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Notre interface glisser-déposer vous permet de personnaliser chaque aspect de vos devis sans compétences techniques. Ajoutez votre logo, mentions légales et TVA pour un rendu soigné.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Interface intuitive sans courbe d&apos;apprentissage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Modification en temps réel avec aperçu instantané</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Sauvegarde automatique de vos modifications</span>
                    </li>
                  </ul>
                </div>
                <Card className="bg-brand-darkCard border-gray-800 p-6">
                  <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                    <FileText className="h-16 w-16 text-brand-green" />
                  </div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <Card className="bg-brand-darkCard border-gray-800 p-6 md:order-1">
                  <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                    <Zap className="h-16 w-16 text-brand-green" />
                  </div>
                </Card>
                <div className="md:order-2">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Personnalisation complète
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Adaptez tous les éléments à votre charte graphique pour une cohérence parfaite avec votre image de marque. Vos clients reconnaîtront votre professionnalisme au premier coup d&apos;œil.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Logo, couleurs et polices personnalisables</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Gestion des photos par pièce et par projet</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Templates réutilisables pour gagner du temps</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ForWhoSection />

        <CTASection
          title="Prêt à transformer votre façon de créer des devis ?"
          description="Rejoignez les professionnels du bâtiment qui utilisent Devisia pour gagner du temps et augmenter leur taux de conversion."
          cta={{
            label: 'Créer mon compte gratuitement',
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
