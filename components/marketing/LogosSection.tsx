const TRUST_COMPANIES = [
  {
    name: 'Hérault Plomberie Services',
    logo: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="8" fill="url(#plomberie-bg)"/>
        <rect x="4.5" y="4.5" width="31" height="31" rx="7.5" fill="url(#plomberie-card)" stroke="rgba(255,255,255,0.3)"/>
        <path d="M10 14.5H30" stroke="#e2fef7" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M12.5 12.5C12.5 11.1 13.6 10 15 10H25C26.4 10 27.5 11.1 27.5 12.5V26C27.5 27.4 26.4 28.5 25 28.5H15C13.6 28.5 12.5 27.4 12.5 26V12.5Z" fill="white" fillOpacity="0.16"/>
        <circle cx="20" cy="19.5" r="6.5" fill="white"/>
        <path d="M17 19.5H23" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M20 16.5V22.5" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M15.5 28.8H24.5" stroke="#d1fae5" strokeWidth="1.2" strokeLinecap="round"/>
        <text x="20" y="32.2" textAnchor="middle" fontSize="6.2" fontFamily="Inter, Arial, sans-serif" fill="white" fontWeight="700">HPS</text>
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
        <rect x="4.5" y="4.5" width="31" height="31" rx="7.5" fill="url(#batisud-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M10.5 20.5L20 12.2L29.5 20.5V29.5C29.5 30.6 28.6 31.5 27.5 31.5H12.5C11.4 31.5 10.5 30.6 10.5 29.5V20.5Z" fill="white"/>
        <path d="M20 12.2L29.5 20.5H10.5L20 12.2Z" fill="#bae6fd"/>
        <rect x="16.3" y="22" width="7.4" height="9.8" rx="1.6" fill="#1d4ed8"/>
        <rect x="12.4" y="23.2" width="3.6" height="3.6" rx="0.8" fill="#e0f2fe"/>
        <rect x="24" y="23.2" width="3.6" height="3.6" rx="0.8" fill="#e0f2fe"/>
        <path d="M13 15.6H27" stroke="#f8fafc" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M12.6 27.2H27.4" stroke="#e2e8f0" strokeWidth="1.1" strokeLinecap="round"/>
        <path d="M12.5 11.2H27.5" stroke="#bfdbfe" strokeWidth="1" strokeLinecap="round"/>
        <text x="20" y="32.2" textAnchor="middle" fontSize="6.2" fontFamily="Inter, Arial, sans-serif" fill="white" fontWeight="700">BSR</text>
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
        <rect x="4.5" y="4.5" width="31" height="31" rx="7.5" fill="url(#maconnerie-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M10 16.2H18.7V21.6H10V16.2Z" fill="white"/>
        <path d="M20.3 16.2H30V21.6H20.3V16.2Z" fill="#fde68a"/>
        <path d="M10 23.1H18V28.5H10V23.1Z" fill="#fde68a"/>
        <path d="M20 23.1H30V28.5H20V23.1Z" fill="white"/>
        <path d="M10 30.2H16.3V32.4H10V30.2Z" fill="white"/>
        <path d="M18.1 30.2H30V32.4H18.1V30.2Z" fill="#fde68a"/>
        <path d="M11 14.5H29" stroke="#fef9c3" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M11 21.8H29" stroke="#fde68a" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M11 29H29" stroke="#fef3c7" strokeWidth="0.9" strokeLinecap="round"/>
        <path d="M13.2 12.5H26.8" stroke="#fcd34d" strokeWidth="1" strokeLinecap="round"/>
        <text x="20" y="32.2" textAnchor="middle" fontSize="6.2" fontFamily="Inter, Arial, sans-serif" fill="white" fontWeight="700">OM</text>
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
        <rect x="4.5" y="4.5" width="31" height="31" rx="7.5" fill="url(#proelec-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M12 12H28L26.6 29C26.5 30 25.6 30.8 24.6 30.8H15.4C14.4 30.8 13.5 30 13.4 29L12 12Z" fill="white" fillOpacity="0.2"/>
        <path d="M21.2 9.8L13 23.6H19.4L18.2 31.4L27.2 17.4H20.8L22.6 9.8H21.2Z" fill="white"/>
        <path d="M14 26.8H26" stroke="#fef3c7" strokeWidth="1.1" strokeLinecap="round"/>
        <circle cx="14.5" cy="14.5" r="3" fill="#fde047"/>
        <path d="M13.4 14.5L14.5 15.6L16.1 13.2" stroke="#78350f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="24.5" y="32.2" textAnchor="middle" fontSize="6.2" fontFamily="Inter, Arial, sans-serif" fill="white" fontWeight="700">PE34</text>
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
        <rect x="4.5" y="4.5" width="31" height="31" rx="7.5" fill="url(#multitravaux-card)" stroke="rgba(255,255,255,0.28)"/>
        <path d="M10.2 19.2L20 12L29.8 19.2V30C29.8 31 29 31.8 28 31.8H12C11 31.8 10.2 31 10.2 30V19.2Z" fill="white"/>
        <rect x="15.8" y="22.2" width="8.4" height="9.6" rx="1.8" fill="#6d28d9"/>
        <path d="M13 17.2L20 12.2L27 17.2" stroke="#ede9fe" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13.5 26.6H26.5" stroke="#ddd6fe" strokeWidth="1" strokeLinecap="round"/>
        <circle cx="27.2" cy="13.8" r="3" fill="#c4b5fd"/>
        <path d="M27.2 12.4V15.2M25.8 13.8H28.6" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
        <text x="20" y="32.2" textAnchor="middle" fontSize="6.2" fontFamily="Inter, Arial, sans-serif" fill="white" fontWeight="700">MTC</text>
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
