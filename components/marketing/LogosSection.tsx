const TRUST_COMPANIES = [
  {
    name: 'Hérault Plomberie Services',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#plomberie-bg)"/>
        <rect x="5" y="5" width="30" height="30" rx="7" fill="url(#plomberie-card)" stroke="rgba(255,255,255,0.3)"/>
        <path d="M14.5 25.5L25 15" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M26.8 13.2C25.6 12 23.7 12 22.5 13.2L21 14.7L25.3 19L26.8 17.5C28 16.3 28 14.4 26.8 13.2Z" fill="white"/>
        <path d="M13.2 26.8C14.4 28 16.3 28 17.5 26.8L19 25.3L14.7 21L13.2 22.5C12 23.7 12 25.6 13.2 26.8Z" fill="#d1fae5"/>
        <path d="M18.3 11.2C16.7 11.2 15.4 12.5 15.4 14.1C15.4 14.8 15.6 15.4 16 16L12 20.1L14 22.1L18.1 18C18.7 18.4 19.3 18.6 20 18.6C21.6 18.6 22.9 17.3 22.9 15.7C22.9 14.1 21.6 12.8 20 12.8C19.4 12.8 18.8 13 18.3 13.3" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="27.6" cy="26.7" r="3" fill="#34d399"/>
        <path d="M26.8 26.7L27.6 27.6L29.2 25.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="plomberie-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14b8a6"/>
            <stop offset="1" stopColor="#10b981"/>
          </linearGradient>
          <linearGradient id="plomberie-card" x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="1" stopColor="rgba(16,185,129,0.25)"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: 'BatiSud Rénovation',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#batisud-bg)"/>
        <rect x="6" y="6" width="28" height="28" rx="7" fill="url(#batisud-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M10.5 20L20 12L29.5 20V30C29.5 30.8 28.8 31.5 28 31.5H12C11.2 31.5 10.5 30.8 10.5 30V20Z" fill="white"/>
        <path d="M20 12L29.5 20H10.5L20 12Z" fill="#bae6fd"/>
        <rect x="16.5" y="22" width="7" height="9.5" rx="1.6" fill="#0ea5e9"/>
        <rect x="12.6" y="23" width="3.6" height="3.6" rx="0.8" fill="#e0f2fe"/>
        <rect x="24" y="23" width="3.6" height="3.6" rx="0.8" fill="#e0f2fe"/>
        <path d="M14 15.8H26" stroke="#f8fafc" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M13.2 27.5H26.8" stroke="#e2e8f0" strokeWidth="1.1" strokeLinecap="round"/>
        <circle cx="27.4" cy="14.5" r="2.6" fill="#38bdf8"/>
        <path d="M26.4 14.5L27.4 15.5L28.7 13.9" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="batisud-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0ea5e9"/>
            <stop offset="1" stopColor="#2563eb"/>
          </linearGradient>
          <linearGradient id="batisud-card" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.22)"/>
            <stop offset="1" stopColor="rgba(37,99,235,0.25)"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: 'Occitanie Maçonnerie',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#maconnerie-bg)"/>
        <rect x="6" y="6" width="28" height="28" rx="7" fill="url(#maconnerie-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M10 16H18.8V21.5H10V16Z" fill="white"/>
        <path d="M20.2 16H30V21.5H20.2V16Z" fill="#fde68a"/>
        <path d="M10 23H18V28.5H10V23Z" fill="#fde68a"/>
        <path d="M19.8 23H30V28.5H19.8V23Z" fill="white"/>
        <path d="M10 30.2H16.4V32.2H10V30.2Z" fill="white"/>
        <path d="M18.2 30.2H30V32.2H18.2V30.2Z" fill="#fde68a"/>
        <path d="M11.2 14.5H28.8" stroke="#fef9c3" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M11.2 21.8H28.8" stroke="#fde68a" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M11.2 29H28.8" stroke="#fef3c7" strokeWidth="0.9" strokeLinecap="round"/>
        <circle cx="28.5" cy="13.5" r="2.5" fill="#fbbf24"/>
        <path d="M27.5 13.5L28.5 14.4L29.8 12.9" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="maconnerie-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b"/>
            <stop offset="1" stopColor="#d97706"/>
          </linearGradient>
          <linearGradient id="maconnerie-card" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.22)"/>
            <stop offset="1" stopColor="rgba(217,119,6,0.25)"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: 'Pro Elec 34',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#proelec-bg)"/>
        <rect x="6" y="6" width="28" height="28" rx="7" fill="url(#proelec-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M12 12H28L26.8 28.8C26.7 29.8 25.9 30.5 24.9 30.5H15.1C14.1 30.5 13.3 29.8 13.2 28.8L12 12Z" fill="white" fillOpacity="0.2"/>
        <path d="M21 10L13 23.5H19.2L18 31L27 17H20.6L22.2 10H21Z" fill="white"/>
        <circle cx="26.5" cy="14" r="3.1" fill="#fef9c3"/>
        <path d="M25.4 14L26.5 15.1L28.1 12.8" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 27H26" stroke="#fef3c7" strokeWidth="1" strokeLinecap="round"/>
        <defs>
          <linearGradient id="proelec-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#facc15"/>
            <stop offset="1" stopColor="#eab308"/>
          </linearGradient>
          <linearGradient id="proelec-card" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="1" stopColor="rgba(234,179,8,0.25)"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: 'MultiTravaux Construction',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#multitravaux-bg)"/>
        <rect x="6" y="6" width="28" height="28" rx="7" fill="url(#multitravaux-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M10.5 19L20 12L29.5 19V30C29.5 30.8 28.8 31.5 28 31.5H12C11.2 31.5 10.5 30.8 10.5 30V19Z" fill="white"/>
        <rect x="16.2" y="22.2" width="7.6" height="8.8" rx="1.6" fill="#7c3aed"/>
        <path d="M13.5 17.4L20 12.8L26.5 17.4" stroke="#ede9fe" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M13.6 26.5H26.4" stroke="#e9d5ff" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="28.5" cy="14" r="3.2" fill="#c4b5fd"/>
        <path d="M28.5 12.5V15.5M27 14H30" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
        <defs>
          <linearGradient id="multitravaux-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6"/>
            <stop offset="1" stopColor="#6366f1"/>
          </linearGradient>
          <linearGradient id="multitravaux-card" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.2)"/>
            <stop offset="1" stopColor="rgba(99,102,241,0.25)"/>
          </linearGradient>
        </defs>
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
