import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { CTASection } from '@/components/marketing/CTASection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Comment fonctionne Devisia ?',
    a: "Devisia utilise l'intelligence artificielle pour generer automatiquement des devis professionnels. Decrivez simplement votre projet (par texte ou a la voix), et l'IA cree un devis detaille avec 3 scenarios tarifaires en quelques minutes.",
  },
  {
    q: "Puis-je essayer gratuitement ?",
    a: "Oui, tous les plans incluent un essai gratuit de 14 jours. Aucune carte bancaire n'est requise pour commencer.",
  },
  {
    q: 'Puis-je personnaliser mes devis ?',
    a: "Absolument. Vous pouvez ajouter votre logo, personnaliser les couleurs, modifier les mentions legales, ajuster la TVA, et editer chaque ligne du devis selon vos besoins.",
  },
  {
    q: 'Mes donnees sont-elles securisees ?',
    a: 'Oui, toutes vos donnees sont hebergees en France sur des serveurs securises et conformes RGPD.',
  },
  {
    q: 'Comment fonctionne la dictee vocale ?',
    a: "Cliquez simplement sur le bouton microphone et decrivez votre projet a voix haute. L'IA transcrit automatiquement vos paroles et les structure en un devis professionnel.",
  },
  {
    q: 'Puis-je exporter mes devis en PDF ?',
    a: 'Oui, tous les devis peuvent etre exportes instantanement au format PDF professionnel, prets a etre envoyes a vos clients.',
  },
  {
    q: 'Quels types de travaux sont supportes ?',
    a: "Devisia propose 10 templates BTP incluant renovation, construction neuve, plomberie, electricite, maconnerie, menuiserie, peinture et plus encore. L'IA s'adapte a votre secteur.",
  },
  {
    q: 'Puis-je changer de plan a tout moment ?',
    a: "Oui, vous pouvez changer de plan ou annuler votre abonnement a tout moment sans frais supplementaires.",
  },
  {
    q: "Dois-je installer quelque chose ?",
    a: "Non, Devisia fonctionne directement dans votre navigateur. Rien a installer, aucune configuration technique.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="pt-20 pb-12 bg-brand-light">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Questions frequentes
            </h1>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Tout ce que vous devez savoir sur Devisia
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
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

        <CTASection
          title="Une question ? Contactez-nous"
          description="Notre equipe repond en francais sous 24h."
          cta={{
            label: "Demarrer l'essai gratuit",
            href: '/auth/register',
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
