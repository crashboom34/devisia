import { TestimonialCard } from './TestimonialCard';

const testimonials = [
  {
    name: 'Jean M.',
    roleAndCity: 'Plombier-chauffagiste -- Nimes',
    quote:
      '\u00ab Avant, je faisais mes devis le soir sur Excel. Aujourd\'hui, je les prepare en 5 minutes entre deux chantiers. Je gagne au moins 2-3 heures par jour. \u00bb',
    avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
  },
  {
    name: 'Marc D.',
    roleAndCity: 'Artisan maconnerie -- Montpellier',
    quote:
      '\u00ab Je galerais avec la mise en page et les totaux. Devisia s\'occupe de tout, je n\'ai plus peur d\'envoyer un devis mal calcule. \u00bb',
    avatarUrl: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
  },
  {
    name: 'Karim B.',
    roleAndCity: 'Gerant entreprise generale -- Beziers',
    quote:
      '\u00ab Toute l\'equipe utilise les memes modeles. On a enfin des devis coherents, meme quand plusieurs personnes les font. \u00bb',
    avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-brand-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Des artisans comme vous utilisent Devisia
          </h2>
          <p className="text-lg text-gray-500">
            Moins de temps sur les devis, plus de temps sur les chantiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.name}
              quote={testimonial.quote}
              name={testimonial.name}
              roleAndCity={testimonial.roleAndCity}
              avatarUrl={testimonial.avatarUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
