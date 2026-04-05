'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Comment fonctionne Devisia ?',
    a: "Decrivez simplement votre projet (par texte ou a la voix), et l'IA cree un devis detaille avec 3 scenarios tarifaires en quelques minutes. Vous ajustez si besoin, puis vous exportez en PDF.",
  },
  {
    q: "Puis-je essayer gratuitement ?",
    a: "Oui, tous les plans incluent un essai gratuit de 14 jours. Aucune carte bancaire n'est requise pour commencer.",
  },
  {
    q: 'Mes donnees sont-elles securisees ?',
    a: 'Oui, toutes vos donnees sont hebergees en France sur des serveurs securises et conformes RGPD.',
  },
  {
    q: 'Quels types de travaux sont supportes ?',
    a: "Devisia propose 10 templates BTP incluant renovation, construction neuve, plomberie, electricite, maconnerie, menuiserie, peinture et plus encore. L'IA s'adapte a votre secteur.",
  },
  {
    q: 'Puis-je personnaliser mes devis ?',
    a: 'Absolument. Vous pouvez ajouter votre logo, personnaliser les couleurs, modifier les mentions legales, ajuster la TVA, et editer chaque ligne du devis.',
  },
];

export function HomeFAQ() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Questions frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
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
  );
}
