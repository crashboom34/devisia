import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, Crown, FileText, Users } from 'lucide-react';

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
    <Card className={`relative bg-brand-darkCard border-gray-800 hover:border-brand-green/50 transition-all duration-300 hover:-translate-y-1 ${
      popular ? 'ring-2 ring-brand-green shadow-lg shadow-brand-green/20' : ''
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-brand-green text-white text-xs font-semibold px-4 py-1 rounded-full">
            Le plus populaire
          </div>
        </div>
      )}

      <CardHeader className="pb-8 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex p-2 rounded-lg bg-brand-green/10">
            <Icon className="h-5 w-5 text-brand-green" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-gray-400">{period}</span>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-brand-green flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Link href={cta.href} className="block">
          <Button
            className={`w-full ${
              popular
                ? 'bg-brand-green hover:bg-green-600 text-white'
                : 'bg-brand-darkLight hover:bg-gray-800 text-white border border-gray-700'
            }`}
            size="lg"
          >
            {cta.label}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
