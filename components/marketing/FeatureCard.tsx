import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-brand-darkCard border-gray-800 hover:border-brand-green/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-green/10">
      <CardContent className="p-6">
        <div className="mb-4 inline-flex p-3 rounded-xl bg-brand-green/10">
          <Icon className="h-6 w-6 text-brand-green" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
