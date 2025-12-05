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
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ils font confiance à Devisia</h2>
          <p className="text-lg text-gray-400">
            Artisans, TPE et entreprises du BTP utilisent Devisia pour gagner du temps et sécuriser leurs marges.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 items-center">
          {logos.map((logo) => (
            <div
              key={logo}
              className="flex items-center justify-center px-4 py-3 rounded-lg bg-brand-darkCard border border-gray-800 text-gray-400 text-sm sm:text-base"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
