const WORKFLOW = [
  { step: '1', title: 'Décrire', detail: 'Texte ou dictée selon le navigateur' },
  { step: '2', title: 'Structurer', detail: 'Lots et lignes proposés par le moteur' },
  { step: '3', title: 'Ajuster', detail: 'Quantités, prix, marge et mentions' },
  { step: '4', title: 'Valider', detail: 'Contrôle humain avant utilisation' },
];

export function LogosSection() {
  return (
    <section className="bg-brand-dark py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Un parcours simple et vérifiable</h2>
          <p className="text-lg text-gray-400">
            Chaque étape reste visible et modifiable pour adapter le devis à la réalité du chantier.
          </p>
        </div>

        <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW.map((item) => (
            <li key={item.step} className="rounded-2xl border border-slate-700/60 bg-slate-900/70 px-5 py-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white">
                {item.step}
              </span>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
