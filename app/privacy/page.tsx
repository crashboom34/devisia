import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">
          Informations sur les données — version bêta
        </h1>

        <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100">
          Les coordonnées complètes de l&apos;éditeur, du responsable de traitement et le contact dédié aux droits
          doivent être renseignés avant toute ouverture commerciale. Cette page décrit uniquement les traitements
          actuellement identifiés pendant la bêta.
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-400 leading-relaxed">
              Devisia traite les informations nécessaires au fonctionnement du compte, à la création de projets et
              à la génération assistée de devis. Cette page sera complétée avant l&apos;ouverture commerciale.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Données collectées</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Nous collectons les données suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Informations de compte et d&apos;authentification gérées par Supabase</li>
              <li>Projets et devis créés</li>
              <li>Données nécessaires au suivi des usages et des limites de formule</li>
              <li>Journaux techniques nécessaires à la sécurité et au diagnostic</li>
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
              L&apos;application s&apos;appuie notamment sur Supabase pour l&apos;authentification et les données, Vercel pour
              l&apos;application web, OpenRouter pour les appels aux modèles et Resend pour les courriels transactionnels.
              Les accès applicatifs sont contrôlés par compte et les données métier sont isolées par organisation.
              La localisation, les durées de conservation et les garanties contractuelles de chaque prestataire
              doivent être documentées dans la version juridique finale.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Partage des données</h2>
            <p className="text-gray-400 leading-relaxed">
              Les données nécessaires au service peuvent être transmises aux catégories de prestataires suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Supabase pour l&apos;authentification et la base de données</li>
              <li>Vercel pour l&apos;hébergement de l&apos;application</li>
              <li>OpenRouter et le modèle sélectionné pour la génération assistée</li>
              <li>Resend pour les courriels d&apos;authentification</li>
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
              Le canal d&apos;exercice de ces droits doit être publié avec l&apos;identité de l&apos;éditeur avant l&apos;ouverture
              commerciale. Pendant la bêta contrôlée, utilisez le canal par lequel votre accès vous a été remis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              L&apos;application utilise les mécanismes de stockage nécessaires à l&apos;authentification et au maintien de
              la session. Aucun outil publicitaire n&apos;est intégré dans le code applicatif actuellement audité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Modifications</h2>
            <p className="text-gray-400 leading-relaxed">
              Cette information évoluera avec la bêta. La version applicable et sa date devront être affichées avant
              l&apos;ouverture commerciale.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
            <p className="text-gray-400 leading-relaxed">
              Le contact légal et vie privée reste à renseigner avant l&apos;ouverture commerciale.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
