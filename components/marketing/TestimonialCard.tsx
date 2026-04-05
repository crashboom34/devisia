import { Star } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  name: string;
  roleAndCity: string;
  avatarUrl: string;
}

export function TestimonialCard({ quote, name, roleAndCity, avatarUrl }: TestimonialCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 md:p-7 flex flex-col gap-4 hover:border-brand-green/30 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm md:text-base text-gray-700 leading-relaxed flex-1">{quote}</p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <img
          src={avatarUrl}
          alt={name}
          className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-green/30 group-hover:ring-brand-green/50 transition-all duration-300"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{name}</span>
          <span className="text-xs text-gray-500">{roleAndCity}</span>
        </div>
      </div>
    </div>
  );
}
