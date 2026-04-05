'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Gift, FileText, Users, Crown } from 'lucide-react';
import { PLAN_PRICES, PLAN_FEATURES } from '@/lib/tier-model';

type BillingPeriod = 'monthly' | 'yearly';

const PLANS = [
  {
    key: 'starter' as const,
    name: 'Starter',
    description: 'Ideal pour les artisans solo',
    icon: FileText,
  },
  {
    key: 'business' as const,
    name: 'Business',
    description: 'Pour les artisans avec plusieurs chantiers',
    icon: Users,
    popular: true,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    description: 'Pour les equipes et gros volumes',
    icon: Crown,
  },
];

function formatPrice(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(2).replace('.', ',');
}

export function HomePricing() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly');

  return (
    <section id="tarifs" className="py-20 bg-brand-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Des tarifs simples, a la mesure de votre activite
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Tous les plans incluent 14 jours d&apos;essai gratuit. Sans carte bancaire.
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

                <div className="p-7 pb-5">
                  <div className="inline-flex p-2 rounded-lg bg-brand-green/10 mb-4">
                    <Icon className="h-5 w-5 text-brand-green" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>

                  <div className="mb-1">
                    {billing === 'monthly' ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(prices.monthly)} &euro;
                        </span>
                        <span className="text-gray-400 text-sm">/mois</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-gray-900">
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
                </div>

                <div className="px-7 pb-7 flex flex-col flex-1">
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
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

        <p className="text-center text-sm text-gray-400 mt-8">
          Aucun engagement. Annulation en 1 clic.
        </p>
      </div>
    </section>
  );
}
