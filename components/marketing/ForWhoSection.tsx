'use client';

import { Wrench, Users, Building2 } from 'lucide-react';

const profiles = [
  {
    icon: Wrench,
    title: 'Artisans solo',
    subtitle: 'Ideal si vous travaillez seul',
    items: [
      'Un devis pro en 2 minutes, meme entre deux chantiers',
      'Gardez la main sur vos prix et vos marges',
      'Envoyez des devis soignes depuis votre telephone',
      'Fini les soirs sur Excel',
    ],
  },
  {
    icon: Users,
    title: 'Petites entreprises',
    subtitle: '3 a 10 personnes',
    items: [
      'Centralisez vos modeles et votre base de prix',
      'Garantissez la coherence entre collaborateurs',
      'Suivez tous les devis en un coup d\'oeil',
      'Transformez vos devis en factures',
    ],
  },
  {
    icon: Building2,
    title: 'Entreprises structurees',
    subtitle: 'Equipes et multi-sites',
    items: [
      'Pilotez plusieurs entites dans le meme outil',
      'Appliquez des regles de prix communes',
      'Vue d\'ensemble sur volumes et taux de signature',
      'Support prioritaire et collaboration avancee',
    ],
  },
];

export function ForWhoSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Que vous soyez seul ou en equipe
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Devisia s&apos;adapte a votre activite et a votre volume de devis.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {profiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <div
                key={profile.title}
                className="group rounded-2xl border border-gray-200 bg-white p-6 md:p-7 flex flex-col gap-3 hover:border-brand-green/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 group-hover:bg-brand-green/15 transition-colors">
                  <Icon className="h-5 w-5 text-brand-green" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{profile.title}</h3>
                <p className="text-sm text-gray-500 -mt-2">{profile.subtitle}</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  {profile.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-brand-green mt-0.5 font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
