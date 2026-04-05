import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, FileText, Users, Crown } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  popular?: boolean;
  icon?: 'file' | 'users' | 'crown';
}

export function PricingCard({
  name,
  price,
  period = '/mois',
  description,
  features,
  cta,
  popular = false,
  icon = 'file',
}: PricingCardProps) {
  const icons = {
    file: FileText,
    users: Users,
    crown: Crown,
  };

  const Icon = icons[icon];

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 ${
      popular
        ? 'ring-2 ring-brand-green shadow-xl shadow-brand-green/10 border-brand-green/40'
        : 'border-gray-200 hover:border-brand-green/30 hover:shadow-lg'
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-brand-green text-white text-xs font-semibold px-4 py-1 rounded-full shadow">
            Le plus populaire
          </div>
        </div>
      )}

      <div className="p-8 pb-6">
        <div className="inline-flex p-2 rounded-lg bg-brand-green/10 mb-4">
          <Icon className="h-5 w-5 text-brand-green" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-6">{description}</p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-400">{period}</span>
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-green/5 border border-brand-green/15">
          <span className="text-xs text-brand-green font-medium">14 jours d&apos;essai gratuit</span>
        </div>
      </div>

      <div className="px-8 pb-8 flex flex-col flex-1">
        <ul className="space-y-3 mb-8 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
              <span className="text-gray-600 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Link href={cta.href} className="block">
          <Button
            className={`w-full ${
              popular
                ? 'bg-brand-green hover:bg-brand-greenDark text-white shadow-lg shadow-brand-green/20'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
            size="lg"
          >
            {cta.label}
          </Button>
        </Link>
      </div>
    </div>
  );
}
