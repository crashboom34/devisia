const TRUST_COMPANIES = [
  {
    name: 'Hérault Plomberie Services',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#plomberie-bg)"/>
        <rect x="8" y="8" width="24" height="24" rx="6" fill="url(#plomberie-panel)" opacity="0.35"/>
        <path
          d="M18.5 10.5C16.8 10.5 15.3 11.8 15.2 13.6L12.6 16.2C12.1 16.7 12.1 17.5 12.6 18L15.9 21.3L12.4 24.8C11.9 25.3 11.9 26.1 12.4 26.6L13.4 27.6C13.9 28.1 14.7 28.1 15.2 27.6L18.7 24.1L22 27.4C22.5 27.9 23.3 27.9 23.8 27.4L26.4 24.8C28.2 24.7 29.5 23.2 29.5 21.5C29.5 19.7 28 18.2 26.2 18.2C25.6 18.2 25 18.4 24.5 18.7L21.3 15.5C21.6 15 21.8 14.4 21.8 13.8C21.8 12 20.3 10.5 18.5 10.5Z"
          fill="white"
        />
        <circle cx="26.2" cy="21.5" r="1.8" fill="#34d399"/>
        <defs>
          <linearGradient id="plomberie-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14b8a6"/>
            <stop offset="1" stopColor="#10b981"/>
          </linearGradient>
          <linearGradient id="plomberie-panel" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="white"/>
            <stop offset="1" stopColor="#d1fae5"/>
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
        <rect x="7.5" y="9" width="25" height="22" rx="5.5" fill="white" fillOpacity="0.16"/>
        <path d="M11 20L20 12L29 20V30C29 30.6 28.6 31 28 31H12C11.4 31 11 30.6 11 30V20Z" fill="white"/>
        <path d="M20 12L29 20H11L20 12Z" fill="#e0f2fe"/>
        <rect x="17" y="22" width="6" height="9" rx="1.5" fill="#0ea5e9"/>
        <rect x="12.5" y="22.5" width="3.5" height="3.5" rx="0.8" fill="#7dd3fc"/>
        <rect x="24" y="22.5" width="3.5" height="3.5" rx="0.8" fill="#7dd3fc"/>
        <defs>
          <linearGradient id="batisud-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0ea5e9"/>
            <stop offset="1" stopColor="#2563eb"/>
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
        <rect x="7" y="10" width="26" height="20" rx="4" fill="white" fillOpacity="0.15"/>
        <path d="M10 15H19V20H10V15Z" fill="white"/>
        <path d="M21 15H30V20H21V15Z" fill="#fde68a"/>
        <path d="M10 22H18V27H10V22Z" fill="#fde68a"/>
        <path d="M20 22H30V27H20V22Z" fill="white"/>
        <path d="M10 29H16.5V31.5H10V29Z" fill="white"/>
        <path d="M18.5 29H30V31.5H18.5V29Z" fill="#fde68a"/>
        <path d="M9.5 14.5H30.5V27.5" stroke="#fef3c7" strokeWidth="0.8" strokeLinecap="round"/>
        <defs>
          <linearGradient id="maconnerie-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b"/>
            <stop offset="1" stopColor="#d97706"/>
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
        <path d="M12 11H28L26.5 28.5C26.4 29.3 25.7 30 24.9 30H15.1C14.3 30 13.6 29.3 13.5 28.5L12 11Z" fill="white" fillOpacity="0.18"/>
        <path d="M20.5 10L13.5 23H19L18 30L26.5 17H21L22 10H20.5Z" fill="white"/>
        <circle cx="20" cy="29" r="2" fill="#fde68a"/>
        <defs>
          <linearGradient id="proelec-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#facc15"/>
            <stop offset="1" stopColor="#eab308"/>
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
        <rect x="9" y="9" width="22" height="22" rx="6" fill="white" fillOpacity="0.14"/>
        <path d="M12 18L20 12L28 18V29C28 29.6 27.6 30 27 30H13C12.4 30 12 29.6 12 29V18Z" fill="white"/>
        <rect x="16.5" y="22" width="7" height="8" rx="1.5" fill="#8b5cf6"/>
        <path d="M14 16.5L20 12L26 16.5" stroke="#ede9fe" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="29" cy="13" r="3.5" fill="#a78bfa"/>
        <path d="M29 11.5V14.5M27.5 13H30.5" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
        <defs>
          <linearGradient id="multitravaux-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8b5cf6"/>
            <stop offset="1" stopColor="#6366f1"/>
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
