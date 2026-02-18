import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  roleAndCity: string;
  avatarUrl: string;
}

export function TestimonialCard({ quote, name, roleAndCity, avatarUrl }: TestimonialCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 md:p-7 flex flex-col gap-4 hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm md:text-base text-slate-200 leading-relaxed flex-1">{quote}</p>
      <div className="flex items-center gap-3 pt-2 border-t border-slate-700/40">
        <img
          src={avatarUrl}
          alt={name}
          className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-500/40 group-hover:ring-emerald-500/70 transition-all duration-300"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-50">{name}</span>
          <span className="text-xs text-slate-400">{roleAndCity}</span>
        </div>
      </div>
    </div>
  );
}
