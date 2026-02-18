'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CTASection } from '@/components/marketing/CTASection';
import { Check, FileText, Users, Crown, Sparkles, Gift } from 'lucide-react';
import { PLAN_PRICES, PLAN_FEATURES, TIER_TO_MODEL_LABEL } from '@/lib/tier-model';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  key: 'starter' | 'business' | 'pro';
  name: string;
  description: string;
  icon: React.ElementType;
  popular?: boolean;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

const PLANS: Plan[] = [
  {
    key: 'starter',
    name: 'Starter',
    description: "Pour les artisans qui débutent ou qui veulent tester",
    icon: FileText,
    stripePriceIds: {
      monthly: 'starter_monthly_price_id',
      yearly:  'starter_yearly_price_id',
    },
  },
  {
    key: 'business',
    name: 'Business',
    description: "Choisi par la majorité des artisans Devisia",
    icon: Users,
    popular: true,
    stripePriceIds: {
      monthly: 'business_monthly_price_id',
      yearly:  'business_yearly_price_id',
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    description: "Pour les entreprises et artisans qui gèrent beaucoup de clients",
    icon: Crown,
    stripePriceIds: {
      monthly: 'pro_monthly_price_id',
      yearly:  'pro_yearly_price_id',
    },
  },
];

function formatPrice(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(2).replace('.', ',');
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');

  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main>
        <section className="pt-24 pb-12 bg-gradient-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Tarifs simples et transparents
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
            </p>

            <div className="inline-flex items-center gap-3 bg-gray-900/60 border border-gray-700 rounded-full p-1.5">
              <span className="text-sm text-gray-400 pl-3">Facturation :</span>
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billing === 'monthly'
                    ? 'bg-brand-green text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Mensuelle
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billing === 'yearly'
                    ? 'bg-brand-green text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annuelle
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Gift className="h-3 w-3" />
                  2 mois offerts
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-brand-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {PLANS.map((plan) => {
                const prices = PLAN_PRICES[plan.key];
                const features = PLAN_FEATURES[plan.key];
                const modelLabel = TIER_TO_MODEL_LABEL[plan.key];
                const Icon = plan.icon;
                const priceId = plan.stripePriceIds[billing];

                return (
                  <div
                    key={plan.key}
                    className={`relative flex flex-col rounded-2xl border bg-brand-darkCard transition-all duration-300 hover:-translate-y-1 ${
                      plan.popular
                        ? 'ring-2 ring-brand-green shadow-xl shadow-brand-green/20 border-brand-green/40'
                        : 'border-gray-800 hover:border-brand-green/30'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="bg-brand-green text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
                          Le plus populaire
                        </div>
                      </div>
                    )}

                    {billing === 'yearly' && (
                      <div className="absolute top-4 right-4">
                        <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/25">
                          <Gift className="h-3 w-3" />
                          2 mois offerts
                        </span>
                      </div>
                    )}

                    <div className="p-8 pb-6">
                      <div className="inline-flex p-2 rounded-lg bg-brand-green/10 mb-4">
                        <Icon className="h-5 w-5 text-brand-green" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                      <div className="mb-1">
                        {billing === 'monthly' ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold text-white">
                                {formatPrice(prices.monthly)} €
                              </span>
                              <span className="text-gray-400 text-sm">/mois</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ou {prices.yearly} € / an (2 mois offerts)
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold text-white">
                                {prices.yearly} €
                              </span>
                              <span className="text-gray-400 text-sm">/an</span>
                            </div>
                            <p className="text-xs text-emerald-400 mt-1">
                              équivaut à {formatPrice(prices.monthlyEquiv)} € / mois
                            </p>
                          </>
                        )}
                      </div>

                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
                        <Sparkles className="h-3 w-3 text-brand-green" />
                        <span className="text-xs text-gray-300 font-medium">{modelLabel}</span>
                      </div>
                    </div>

                    <div className="px-8 pb-8 flex flex-col flex-1">
                      <ul className="space-y-3 mb-8 flex-1">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/auth/register?plan=${plan.key}&billing=${billing}&price_id=${priceId}`}
                        className={`block w-full text-center py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 ${
                          plan.popular
                            ? 'bg-brand-green hover:bg-green-600 text-white shadow-lg shadow-brand-green/20'
                            : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                        }`}
                      >
                        {billing === 'monthly'
                          ? `Choisir ${plan.name}`
                          : `Choisir ${plan.name} — ${prices.yearly} € / an`}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-400 mb-2">
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
              {[
                {
                  q: "Puis-je changer de plan à tout moment ?",
                  a: "Oui, vous pouvez changer de plan ou annuler votre abonnement à tout moment sans frais supplémentaires.",
                },
                {
                  q: "Comment fonctionne la facturation annuelle ?",
                  a: "En choisissant la facturation annuelle, vous payez 10 mois et bénéficiez de 12 mois d'accès — soit 2 mois offerts. Le paiement est effectué en une seule fois.",
                },
                {
                  q: "Quelle est la différence entre Mistral Large 3 et GPT-4.1 ?",
                  a: "Mistral Large 3 offre d'excellents devis BTP pour la plupart des projets. GPT-4.1 (plan Pro) est le modèle le plus avancé d'OpenAI, idéal pour les projets complexes, les grandes équipes et les exigences maximales en précision.",
                },
                {
                  q: "Où sont hébergées mes données ?",
                  a: "Toutes vos données sont hébergées en Europe avec des serveurs conformes RGPD. Vos informations sont chiffrées et sécurisées.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-brand-darkCard border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{q}</h3>
                  <p className="text-gray-400">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection
          title="Prêt à commencer ?"
          description="Essayez Devisia gratuitement pendant 14 jours. Aucune carte bancaire requise."
          cta={{
            label: "Démarrer l'essai gratuit",
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
