import { Calculator, CheckCircle2, FileSearch, PencilLine } from 'lucide-react';

const reviewSteps = [
  {
    icon: FileSearch,
    title: 'Relire le périmètre',
    description: 'Vérifiez que chaque lot et chaque prestation correspondent bien à la visite de chantier.',
  },
  {
    icon: Calculator,
    title: 'Contrôler prix et marge',
    description: 'Ajustez vos coûts, vos prix de vente et votre TVA avec vos propres données.',
  },
  {
    icon: PencilLine,
    title: 'Compléter les mentions',
    description: 'Ajoutez les informations contractuelles et légales adaptées à votre entreprise.',
  },
  {
    icon: CheckCircle2,
    title: 'Valider avant envoi',
    description: 'Le professionnel reste décisionnaire et confirme le devis final destiné au client.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-brand-darkLight py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl space-y-3 text-center">
          <p className="inline-flex items-center rounded-full border border-gray-800 bg-brand-darkCard/80 px-4 py-2 text-sm font-medium text-brand-green">
            Assistance, puis validation humaine
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Un devis assisté ne part jamais sans votre contrôle
          </h2>
          <p className="text-lg text-gray-400">
            Devisia structure une première base. Vous gardez la main sur le contenu, les prix et la décision finale.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {reviewSteps.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-gray-800 bg-brand-darkCard p-6">
              <div className="mb-4 inline-flex rounded-xl bg-brand-green/10 p-3">
                <Icon className="h-5 w-5 text-brand-green" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
