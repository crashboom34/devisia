import { Card } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Jean, plombier-chauffagiste – Nîmes',
    quote:
      '« Avant, je faisais mes devis le soir sur Excel. Aujourd’hui, je les prépare en 5 minutes entre deux chantiers. Je gagne au moins 2–3 heures par jour. »',
  },
  {
    name: 'Sonia, artisan maçonnerie – Montpellier',
    quote:
      '« Je galérais avec la mise en page et les totaux. Devisia s’occupe de tout, je n’ai plus peur d’envoyer un devis mal calculé. »',
  },
  {
    name: 'Karim, gérant d’une entreprise générale – Béziers',
    quote:
      '« Toute l’équipe utilise les mêmes modèles. On a enfin des devis cohérents, même quand plusieurs personnes les font. »',
  },
  {
    name: 'Lucie, conductrice de travaux – Lunel',
    quote:
      '« Je prépare les devis directement après la visite de chantier. Le client reçoit tout dans la journée, et ça se voit sur le taux de signature. »',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-brand-darkLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <p className="inline-flex items-center rounded-full bg-brand-darkCard/80 px-4 py-2 text-sm font-medium text-brand-green border border-gray-800">
            Crédibilité &amp; preuves
          </p>
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ils utilisent déjà Devisia au quotidien
            </h2>
            <p className="text-lg text-gray-400">Moins de temps sur les devis, plus de temps sur les chantiers.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="bg-brand-darkCard border-gray-800 p-6 h-full shadow-lg shadow-black/30"
            >
              <div className="flex h-full flex-col gap-4">
                <p className="text-gray-100 text-lg leading-relaxed">{testimonial.quote}</p>
                <p className="text-sm font-medium text-gray-300">{testimonial.name}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
