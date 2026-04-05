'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CTASection } from '@/components/marketing/CTASection';
import { MobileCTABar } from '@/components/marketing/MobileCTABar';
import { Check, FileText, Users, Crown, Gift } from 'lucide-react';
import { PLAN_PRICES, PLAN_FEATURES } from '@/lib/tier-model';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  key: 'starter' | 'business' | 'pro';
  name: string;
  description: string;
  icon: React.ElementType;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    key: 'starter',
    name: 'Starter',
    description: 'Ideal pour les artisans solo',
    icon: FileText,
  },
  {
    key: 'business',
    name: 'Business',
    description: 'Pour les artisans avec plusieurs chantiers',
    icon: Users,
    popular: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Pour les equipes et gros volumes',
    icon: Crown,
  },
];

function formatPrice(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(2).replace('.', ',');
}

const pricingFaqs = [
  {
    q: 'Puis-je changer de plan a tout moment ?',
    a: "Oui, vous pouvez changer de plan ou annuler votre abonnement a tout moment sans frais supplementaires.",
  },
  {
    q: 'Comment fonctionne la facturation annuelle ?',
    a: "En choisissant la facturation annuelle, vous payez 10 mois et beneficiez de 12 mois d'acces -- soit 2 mois offerts.",
  },
  {
    q: 'Ou sont hebergees mes donnees ?',
    a: 'Toutes vos donnees sont hebergees en France avec des serveurs conformes RGPD. Vos informations sont chiffrees et securisees.',
  },
  {
    q: "Dois-je installer quelque chose ?",
    a: "Non, Devisia fonctionne directement dans votre navigateur. Rien a installer, aucune configuration technique. Vous creez un compte et vous commencez.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="pt-20 pb-12 bg-brand-light">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Des tarifs simples et transparents
            </h1>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10">
              Choisissez le plan qui correspond a vos besoins. 14 jours d&apos;essai gratuit sur tous les plans.
            </p>

            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billing === 'monthly'
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  billing === 'yearly'
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Annuel
                <span className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green text-xs px-2 py-0.5 rounded-full font-medium">
                  <Gift className="h-3 w-3" />
                  -2 mois
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PLANS.map((plan) => {
                const prices = PLAN_PRICES[plan.key];
                const features = PLAN_FEATURES[plan.key];
                const Icon = plan.icon;

                return (
                  <div
                    key={plan.key}
                    className={`relative flex flex-col rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 ${
                      plan.popular
                        ? 'ring-2 ring-brand-green shadow-xl shadow-brand-green/10 border-brand-green/40'
                        : 'border-gray-200 hover:border-brand-green/30 hover:shadow-lg'
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
                        <span className="flex items-center gap-1 bg-brand-green/10 text-brand-green text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Gift className="h-3 w-3" />
                          2 mois offerts
                        </span>
                      </div>
                    )}

                    <div className="p-8 pb-6">
                      <div className="inline-flex p-2 rounded-lg bg-brand-green/10 mb-4">
                        <Icon className="h-5 w-5 text-brand-green" />
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                      <div className="mb-1">
                        {billing === 'monthly' ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold text-gray-900">
                                {formatPrice(prices.monthly)} &euro;
                              </span>
                              <span className="text-gray-400 text-sm">/mois</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              ou {prices.yearly} &euro;/an (2 mois offerts)
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold text-gray-900">
                                {prices.yearly} &euro;
                              </span>
                              <span className="text-gray-400 text-sm">/an</span>
                            </div>
                            <p className="text-xs text-brand-green mt-1 font-medium">
                              soit {formatPrice(prices.monthlyEquiv)} &euro;/mois
                            </p>
                          </>
                        )}
                      </div>

                      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-green/5 border border-brand-green/15">
                        <span className="text-xs text-brand-green font-medium">14 jours d&apos;essai gratuit</span>
                      </div>
                    </div>

                    <div className="px-8 pb-8 flex flex-col flex-1">
                      <ul className="space-y-3 mb-8 flex-1">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/auth/register?plan=${plan.key}&billing=${billing}`}
                        className={`block w-full text-center py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 ${
                          plan.popular
                            ? 'bg-brand-green hover:bg-brand-greenDark text-white shadow-lg shadow-brand-green/20'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        14 jours gratuits
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-500 mb-1">
                Toutes les formules incluent l&apos;acces complet aux fonctionnalites de Devisia.
              </p>
              <p className="text-gray-400 text-sm">
                Aucun engagement. Annulation en 1 clic.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-brand-light">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Questions sur les tarifs
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {pricingFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-gray-200 rounded-xl px-6 bg-white hover:border-brand-green/30 transition-colors"
                >
                  <AccordionTrigger className="text-gray-900 hover:text-brand-green text-left font-medium py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <CTASection
          title="Pret a commencer ?"
          description="Essayez Devisia gratuitement pendant 14 jours. Aucune carte bancaire requise."
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
