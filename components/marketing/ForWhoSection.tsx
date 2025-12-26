export function ForWhoSection() {
  return (
    <section className="py-24 bg-brand-darkLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-12 space-y-3">
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-3">
            Pour qui ?
          </span>
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Pour qui est fait Devisia ?</h2>
            <p className="text-lg text-gray-400">
              De l'artisan solo à l'entreprise de construction, Devisia s'adapte à ton organisation et à ton volume de devis.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Artisans solo & auto-entrepreneurs */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 md:p-7 flex flex-col gap-3">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg">
              🧰
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Artisans solo &amp; auto-entrepreneurs</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Gagne du temps sur les devis (5 minutes au lieu d'une heure)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Garde la main sur tes prix et marges</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Envoie des devis propres depuis n'importe où</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Ne te bats plus avec Excel</span>
              </li>
            </ul>
          </div>

          {/* Petites entreprises du BTP */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 md:p-7 flex flex-col gap-3">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg">
              👥
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Petites entreprises du BTP (3 à 10 personnes)</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Centralise ta base de prix et modèles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Garantis la cohérence des prix entre collaborateurs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Vois l'état de tous les devis en un coup d'œil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Suis qui a envoyé quel devis à quel client</span>
              </li>
            </ul>
          </div>

          {/* Entreprises structurées */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 md:p-7 flex flex-col gap-3">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg">
              🏗️
            </div>
            <h3 className="text-lg font-semibold text-slate-50">Entreprises structurées et multi-sociétés</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Pilote plusieurs entités dans le même outil</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Applique des règles de prix communes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Vue d'ensemble sur volumes et taux de signature</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Suis la rentabilité estimée à l'échelle du groupe</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-center text-sm text-slate-300">
          Tu te reconnais dans l'un de ces profils ? Devisia parle ton langage : m², ml, fournitures, main-d'œuvre et marges, pas jargon informatique.
        </div>
      </div>
    </section>
  );
}
