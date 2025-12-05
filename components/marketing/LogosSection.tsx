const logos = [
  'Hérault Plomberie Services',
  'BatiSud Rénovation',
  'Occitanie Maçonnerie',
  'Pro Elec 34',
  'MultiTravaux Construction',
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

        <div className="rounded-2xl border border-gray-800 bg-brand-darkCard/60 p-6 sm:p-8 shadow-inner shadow-black/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 items-center">
            {logos.map((logo) => (
              <div
                key={logo}
                className="flex items-center justify-center px-4 py-3 rounded-lg bg-brand-dark text-gray-400 text-sm sm:text-base font-medium border border-transparent hover:border-gray-800 transition"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
