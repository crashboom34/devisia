const TRUST_COMPANIES = [
  { name: 'Hérault Plomberie Services', acronym: 'HPS' },
  { name: 'BatiSud Rénovation', acronym: 'BR' },
  { name: 'Occitanie Maçonnerie', acronym: 'OM' },
  { name: 'Pro Elec 34', acronym: 'PE34' },
  { name: 'MultiTravaux Construction', acronym: 'MTC' },
];

export function LogosSection() {
  return (
    <section className="py-20 bg-brand-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ils font confiance à Devisia</h2>
          <p className="text-lg text-gray-400">
            Artisans, TPE et entreprises du BTP utilisent Devisia pour gagner du temps et sécuriser leurs marges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {TRUST_COMPANIES.map((company) => (
            <div
              key={company.name}
              className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/70 px-5 py-3 shadow-sm hover:-translate-y-0.5 hover:border-emerald-400/70 hover:shadow-emerald-500/10 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 text-[11px] font-semibold text-slate-950 uppercase shrink-0">
                {company.acronym}
              </div>
              <span className="text-sm font-medium text-slate-100 leading-tight">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
