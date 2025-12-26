interface TestimonialCardProps {
  quote: string;
  name: string;
  roleAndCity: string;
  avatarUrl: string;
}

export function TestimonialCard({ quote, name, roleAndCity, avatarUrl }: TestimonialCardProps) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 md:p-7 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500/50"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-50">{name}</span>
          <span className="text-xs text-slate-400">{roleAndCity}</span>
        </div>
      </div>
      <p className="text-sm md:text-base text-slate-200 leading-relaxed">{quote}</p>
    </div>
  );
}
