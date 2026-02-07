const TRUST_COMPANIES = [
  {
    name: 'Hérault Plomberie Services',
    initials: 'HPS',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    name: 'BatiSud Rénovation',
    initials: 'BSR',
    color: 'from-sky-500 to-blue-600',
  },
  {
    name: 'Occitanie Maçonnerie',
    initials: 'OM',
    color: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Pro Elec 34',
    initials: 'PE',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    name: 'MultiTravaux Construction',
    initials: 'MTC',
    color: 'from-cyan-500 to-teal-600',
  },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {TRUST_COMPANIES.map((company) => (
            <div
              key={company.name}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/70 px-4 py-5 shadow-sm hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${company.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-sm font-bold text-white tracking-tight">{company.initials}</span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-200 leading-tight text-center">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
