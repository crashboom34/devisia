import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">
          Politique de Confidentialité
        </h1>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              Chez Devisia, nous prenons très au sérieux la protection de vos données personnelles.
              Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Données collectées</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Nous collectons les données suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Informations de compte (email, mot de passe chiffré)</li>
              <li>Projets et devis créés</li>
              <li>Informations de paiement (via nos prestataires sécurisés)</li>
              <li>Données d&apos;utilisation et statistiques</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Utilisation des données</h2>
            <p className="text-gray-400 leading-relaxed">
              Vos données sont utilisées exclusivement pour :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Fournir et améliorer nos services</li>
              <li>Générer vos devis via l&apos;IA</li>
              <li>Vous envoyer des notifications importantes</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Hébergement et sécurité</h2>
            <p className="text-gray-400 leading-relaxed">
              Toutes vos données sont hébergées en Europe sur des serveurs sécurisés conformes au RGPD.
              Nous utilisons le chiffrement SSL/TLS pour toutes les communications et le chiffrement au repos
              pour le stockage des données sensibles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Partage des données</h2>
            <p className="text-gray-400 leading-relaxed">
              Nous ne vendons jamais vos données. Nous partageons uniquement vos informations avec :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Les fournisseurs d&apos;IA (OpenAI, Anthropic) pour la génération de devis</li>
              <li>Les processeurs de paiement pour les transactions</li>
              <li>Les autorités légales si requis par la loi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Vos droits</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (droit à l&apos;oubli)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition</li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à : privacy@devisia.fr
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              Nous utilisons des cookies essentiels pour le fonctionnement du site et l&apos;authentification.
              Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Modifications</h2>
            <p className="text-gray-400 leading-relaxed">
              Nous pouvons modifier cette politique de confidentialité. Vous serez informé des changements
              importants par email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-gray-400 leading-relaxed">
              Pour toute question concernant cette politique : privacy@devisia.fr
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
