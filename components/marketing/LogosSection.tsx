const TRUST_COMPANIES = [
  {
    name: 'Hérault Plomberie Services',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#10b981"/>
        <path d="M12 20L18 14L24 20L18 26L12 20Z" fill="white"/>
        <circle cx="28" cy="12" r="4" fill="#34d399"/>
      </svg>
    )
  },
  {
    name: 'BatiSud Rénovation',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0ea5e9"/>
        <rect x="10" y="10" width="20" height="8" fill="white"/>
        <rect x="10" y="20" width="20" height="10" fill="white" fillOpacity="0.7"/>
        <rect x="18" y="24" width="4" height="6" fill="#0ea5e9"/>
      </svg>
    )
  },
  {
    name: 'Occitanie Maçonnerie',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#f59e0b"/>
        <rect x="8" y="12" width="10" height="6" fill="white"/>
        <rect x="20" y="12" width="10" height="6" fill="white" fillOpacity="0.7"/>
        <rect x="8" y="20" width="10" height="6" fill="white" fillOpacity="0.7"/>
        <rect x="20" y="20" width="10" height="6" fill="white"/>
        <rect x="8" y="28" width="10" height="4" fill="white"/>
        <rect x="20" y="28" width="10" height="4" fill="white" fillOpacity="0.7"/>
      </svg>
    )
  },
  {
    name: 'Pro Elec 34',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#eab308"/>
        <path d="M20 8L25 18H15L20 8Z" fill="white"/>
        <path d="M20 32L15 22H25L20 32Z" fill="white" fillOpacity="0.8"/>
        <circle cx="20" cy="20" r="3" fill="white"/>
      </svg>
    )
  },
  {
    name: 'MultiTravaux Construction',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#8b5cf6"/>
        <path d="M20 10L30 18V30H10V18L20 10Z" fill="white"/>
        <rect x="16" y="22" width="8" height="8" fill="#8b5cf6"/>
      </svg>
    )
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {TRUST_COMPANIES.map((company) => (
            <div
              key={company.name}
              className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/70 px-5 py-4 shadow-sm hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
            >
              <div className="shrink-0">
                {company.logo}
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
