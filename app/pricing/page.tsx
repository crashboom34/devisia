import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { PricingCard } from '@/components/marketing/PricingCard';
import { CTASection } from '@/components/marketing/CTASection';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main>
        <section className="pt-24 pb-12 bg-gradient-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Tarifs simples et transparents
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
            </p>
          </div>
        </section>

        <section className="py-20 bg-brand-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard
                name="Starter"
                price="9,99 €/mois"
                description="Pour les artisans qui débutent ou qui veulent tester"
                icon="file"
                features={[
                  "IA GPT-4.1 Mini pour des devis précis",
                  "Ajoutez votre logo, mentions légales et TVA",
                  "Retrouvez facilement tous vos devis, accessibles partout",
                  "Support par email",
                  "Jusqu'à 10 devis par mois",
                  "Jusqu'à 20 clients",
                ]}
                cta={{
                  label: 'Choisir Starter',
                  href: '/auth/register?plan=starter',
                }}
              />

              <PricingCard
                name="Business"
                price="19,99 €/mois"
                description="Choisi par la majorité des artisans Devisia"
                icon="users"
                popular={true}
                features={[
                  "IA Mistral Large 2 pour devis complexes",
                  "Gestion complète des contacts et clients",
                  "Exports PDF illimités et professionnels",
                  "Transformation devis en factures instantanée",
                  "Jusqu'à 30 devis par mois",
                  "Jusqu'à 60 clients",
                ]}
                cta={{
                  label: 'Choisir Business',
                  href: '/auth/register?plan=business',
                }}
              />

              <PricingCard
                name="Pro"
                price="29,99 €/mois"
                description="Pour les entreprises et artisans qui gèrent beaucoup de clients"
                icon="crown"
                features={[
                  "IA GPT-4.1 pour l'excellence maximale",
                  "Devis illimités pour forte demande",
                  "Suivi complet du portefeuille client",
                  "Collaboration d'équipe avancée",
                  "Support prioritaire",
                  "Clients illimités",
                ]}
                cta={{
                  label: 'Choisir Pro',
                  href: '/auth/register?plan=pro',
                }}
              />
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-400 mb-4">
                Toutes les formules incluent l&apos;accès complet aux fonctionnalités principales de Devisia.
              </p>
              <p className="text-gray-500 text-sm">
                Facturation mensuelle ou annuelle. Aucun engagement. Annulez quand vous voulez.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-brand-darkLight">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              <div className="bg-brand-darkCard border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Puis-je changer de plan à tout moment ?
                </h3>
                <p className="text-gray-400">
                  Oui, vous pouvez changer de plan ou annuler votre abonnement à tout moment sans frais supplémentaires.
                </p>
              </div>

              <div className="bg-brand-darkCard border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Comment fonctionne l&apos;essai gratuit ?
                </h3>
                <p className="text-gray-400">
                  Vous pouvez tester Devisia gratuitement pendant 14 jours sans carte bancaire. Explorez toutes les fonctionnalités avant de vous engager.
                </p>
              </div>

              <div className="bg-brand-darkCard border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Où sont hébergées mes données ?
                </h3>
                <p className="text-gray-400">
                  Toutes vos données sont hébergées en Europe avec des serveurs conformes RGPD. Vos informations sont chiffrées et sécurisées.
                </p>
              </div>

              <div className="bg-brand-darkCard border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Puis-je utiliser ma propre clé API ?
                </h3>
                <p className="text-gray-400">
                  Oui, vous pouvez utiliser votre propre clé API OpenAI ou Anthropic si vous préférez gérer directement les coûts d&apos;IA.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CTASection
          title="Prêt à commencer ?"
          description="Essayez Devisia gratuitement pendant 14 jours. Aucune carte bancaire requise."
          cta={{
            label: 'Démarrer l&apos;essai gratuit',
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
