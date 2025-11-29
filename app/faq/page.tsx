import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main>
        <section className="pt-24 pb-12 bg-gradient-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Questions Fréquentes
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Tout ce que vous devez savoir sur Devisia
            </p>
          </div>
        </section>

        <section className="py-20 bg-brand-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Comment fonctionne Devisia ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Devisia utilise l&apos;intelligence artificielle pour générer automatiquement des devis professionnels.
                  Décrivez simplement votre projet (par texte ou voix), et l&apos;IA crée un devis détaillé avec 3 scénarios
                  tarifaires en quelques minutes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Ai-je besoin d&apos;une clé API ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Non, nos formules payantes incluent l&apos;accès à l&apos;IA. Cependant, vous pouvez utiliser votre propre
                  clé API OpenAI ou Anthropic si vous préférez gérer directement les coûts.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Puis-je personnaliser mes devis ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Absolument ! Vous pouvez ajouter votre logo, personnaliser les couleurs, modifier les mentions légales,
                  ajuster la TVA, et éditer chaque ligne du devis selon vos besoins.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Mes données sont-elles sécurisées ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Oui, toutes vos données sont hébergées en Europe sur des serveurs sécurisés et conformes RGPD.
                  Nous utilisons le chiffrement de bout en bout pour protéger vos informations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Puis-je essayer avant d&apos;acheter ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Oui, nous offrons un essai gratuit de 14 jours sur tous nos plans. Aucune carte bancaire n&apos;est requise
                  pour commencer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Comment fonctionne la dictée vocale ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Cliquez simplement sur le bouton microphone et décrivez votre projet à voix haute. L&apos;IA transcrit
                  automatiquement vos paroles et les structure en un devis professionnel.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Puis-je exporter mes devis en PDF ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Oui, tous les devis peuvent être exportés instantanément au format PDF professionnel, prêts à être
                  envoyés à vos clients par email.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-brand-darkCard border border-gray-800 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-brand-green">
                  Quels types de travaux sont supportés ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Devisia propose 10 templates BTP incluant rénovation, construction neuve, plomberie, électricité,
                  maçonnerie, menuiserie, peinture et plus encore. L&apos;IA s&apos;adapte à votre secteur.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
