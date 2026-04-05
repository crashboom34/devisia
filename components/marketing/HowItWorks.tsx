'use client';

import { Mic, Sparkles, Send } from 'lucide-react';

const steps = [
  {
    icon: Mic,
    number: '1',
    title: 'Decrivez',
    description: 'Par ecrit ou a la voix, meme en deplacement sur chantier.',
  },
  {
    icon: Sparkles,
    number: '2',
    title: "L'IA genere",
    description: '3 scenarios de prix, marges calculees, mise en page professionnelle.',
  },
  {
    icon: Send,
    number: '3',
    title: 'Envoyez',
    description: 'Export PDF en 1 clic, pret a envoyer a votre client.',
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 bg-brand-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Aussi simple que 1, 2, 3
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            De la description du chantier a l&apos;envoi du devis en moins de 2 minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-green/20 via-brand-green/40 to-brand-green/20" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative text-center group">
                <div className="inline-flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green/15 transition-colors">
                      <Icon className="h-7 w-7 text-brand-green" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
