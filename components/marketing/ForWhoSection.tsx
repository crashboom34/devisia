export function ForWhoSection() {
  return (
    <section className="py-24 bg-brand-darkLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Pour qui est fait Devisia ?</h2>
          <p className="text-lg text-gray-400">
            De l’artisan solo à l’entreprise de construction, Devisia s’adapte à ton organisation et à ton volume de devis.
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p className="text-base sm:text-lg">
            Devisia a été conçu pour le terrain, pas pour “tous les métiers du monde”. Si tu travailles dans le bâtiment, tu te
            reconnaîtras forcément.
          </p>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Artisans solo & auto-entrepreneurs</h3>
            <p>
              Tu gères tout : prospection, chantier, devis, factures. Devisia te permet de sortir des devis propres en quelques
              minutes, même le soir après le chantier, sans te battre avec Excel. Tu gardes tes prix, tes habitudes, mais tu
              sécurises tes marges et ton image auprès des clients.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Petites entreprises du BTP (3 à 10 personnes)</h3>
            <p>
              Quand plusieurs personnes font des devis, les prix et la présentation partent vite dans tous les sens. Avec
              Devisia, tu centralises ta base de prix et tes modèles pour que toute l’équipe parle le même langage. Tu sais qui
              a envoyé quel devis, à quel client, et tu vois en un coup d’œil ce qui est en attente, accepté ou refusé.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Entreprises structurées et multi-sociétés</h3>
            <p>
              Si tu gères plusieurs équipes ou plusieurs sociétés, tu as besoin de garder la main sur les prix et les marges.
              Devisia te permet de piloter plusieurs entités dans le même outil, d’appliquer des règles de prix communes et de
              suivre les volumes de devis, les taux de signature et la rentabilité estimée à l’échelle du groupe.
            </p>
          </div>

          <p className="text-base sm:text-lg text-gray-200">
            Tu te reconnais dans l’un de ces profils ? Devisia parle ton langage : m², ml, fournitures, main-d’œuvre et marges,
            pas jargon informatique.
          </p>
        </div>
      </div>
    </section>
  );
}
