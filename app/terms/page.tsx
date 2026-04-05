import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Conditions Générales d&apos;Utilisation
        </h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) définissent les conditions dans lesquelles
              vous pouvez utiliser Devisia, plateforme de génération de devis assistée par intelligence artificielle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Acceptation des CGU</h2>
            <p className="text-gray-600 leading-relaxed">
              L&apos;utilisation de Devisia implique l&apos;acceptation pleine et entière des présentes CGU.
              Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Services fournis</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Devisia propose les services suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Génération automatique de devis via intelligence artificielle</li>
              <li>Gestion de projets et de clients</li>
              <li>Export de devis au format PDF</li>
              <li>Stockage sécurisé des données</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Inscription et compte utilisateur</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour utiliser Devisia, vous devez créer un compte en fournissant des informations exactes et à jour.
              Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées
              sur votre compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              Tous les éléments de Devisia (logiciel, design, contenu) sont protégés par le droit d&apos;auteur
              et restent la propriété exclusive de Devisia. Les devis que vous créez vous appartiennent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation de responsabilité</h2>
            <p className="text-gray-600 leading-relaxed">
              Devisia s&apos;efforce de fournir un service de qualité mais ne peut garantir l&apos;exactitude absolue
              des devis générés. Il appartient à l&apos;utilisateur de vérifier et valider tous les devis avant envoi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modification des CGU</h2>
            <p className="text-gray-600 leading-relaxed">
              Devisia se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
              informés des modifications par email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question concernant ces CGU, vous pouvez nous contacter à : support@devisia.fr
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
