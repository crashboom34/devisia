import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SiteHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">
          Conditions d&apos;utilisation — version bêta
        </h1>

        <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100">
          Cette version encadre uniquement une bêta contrôlée. L&apos;identité complète de l&apos;éditeur, ses coordonnées,
          les conditions commerciales et les mentions légales doivent être ajoutées et validées avant toute vente.
        </div>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Objet</h2>
            <p className="text-gray-400 leading-relaxed">
              Ces conditions décrivent l&apos;utilisation de Devisia pendant une phase bêta contrôlée. Le service assiste
              la préparation de devis mais ne remplace ni l&apos;expertise métier ni la validation du professionnel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Acceptation des CGU</h2>
            <p className="text-gray-400 leading-relaxed">
              En utilisant l&apos;accès bêta qui vous a été remis, vous acceptez ces conditions provisoires. Si vous ne les
              acceptez pas, n&apos;utilisez pas le service et demandez la fermeture de votre accès par le canal d&apos;invitation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Services fournis</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Devisia propose les services suivants :
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Génération automatique de devis via intelligence artificielle</li>
              <li>Gestion de projets et de clients</li>
              <li>Export de devis au format PDF</li>
              <li>Conservation des données nécessaires au fonctionnement du compte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Inscription et compte utilisateur</h2>
            <p className="text-gray-400 leading-relaxed">
              Pour utiliser Devisia, vous devez créer un compte en fournissant des informations exactes et à jour.
              Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées
              sur votre compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Propriété intellectuelle</h2>
            <p className="text-gray-400 leading-relaxed">
              Les droits applicables au logiciel et aux contenus devront être précisés avec l&apos;identité de l&apos;éditeur
              dans la version commerciale. L&apos;utilisateur reste responsable des informations qu&apos;il saisit et valide.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation de responsabilité</h2>
            <p className="text-gray-400 leading-relaxed">
              Devisia s&apos;efforce de fournir un service de qualité mais ne peut garantir l&apos;exactitude absolue
              des devis générés. Il appartient à l&apos;utilisateur de vérifier et valider tous les devis avant envoi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Modification des CGU</h2>
            <p className="text-gray-400 leading-relaxed">
              Ces conditions peuvent évoluer pendant la bêta. Une version datée et juridiquement validée devra être
              présentée avant toute ouverture commerciale.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
            <p className="text-gray-400 leading-relaxed">
              Le contact légal reste à renseigner avant l&apos;ouverture commerciale.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
