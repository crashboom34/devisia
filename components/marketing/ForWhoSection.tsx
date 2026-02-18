import { Wrench, Users, Building2 } from 'lucide-react';

const profiles = [
  {
    icon: Wrench,
    title: 'Artisans solo & auto-entrepreneurs',
    items: [
      'Gagne du temps sur les devis (5 minutes au lieu d\'une heure)',
      'Garde la main sur tes prix et marges',
      'Envoie des devis propres depuis n\'importe où',
      'Ne te bats plus avec Excel',
    ],
  },
  {
    icon: Users,
    title: 'Petites entreprises du BTP (3 à 10 personnes)',
    items: [
      'Centralise ta base de prix et modèles',
      'Garantis la cohérence des prix entre collaborateurs',
      'Vois l\'état de tous les devis en un coup d\'oeil',
      'Suis qui a envoyé quel devis à quel client',
    ],
  },
  {
    icon: Building2,
    title: 'Entreprises structurées et multi-sociétés',
    items: [
      'Pilote plusieurs entités dans le même outil',
      'Applique des règles de prix communes',
      'Vue d\'ensemble sur volumes et taux de signature',
      'Suis la rentabilité estimée à l\'échelle du groupe',
    ],
  },
];

export function ForWhoSection() {
  return (
    <section className="py-24 bg-brand-darkLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12 space-y-3">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-3">
            Pour qui ?
          </span>
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Pour qui est fait Devisia ?</h2>
            <p className="text-lg text-gray-400">
              De l&apos;artisan solo à l&apos;entreprise de construction, Devisia s&apos;adapte à ton organisation et à ton volume de devis.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {profiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <div key={profile.title} className="group rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 md:p-7 flex flex-col gap-3 hover:border-slate-600 hover:shadow-lg transition-all duration-300">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-50">{profile.title}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {profile.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">&#x2022;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-center text-sm text-slate-300">
          Tu te reconnais dans l&apos;un de ces profils ? Devisia parle ton langage : m², ml, fournitures, main-d&apos;oeuvre et marges, pas jargon informatique.
        </div>
      </div>
    </section>
  );
}
