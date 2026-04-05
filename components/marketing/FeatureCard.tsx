'use client';

import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 hover:border-brand-green/30 hover:shadow-lg hover:shadow-brand-green/5 transition-all duration-300 hover:-translate-y-0.5">
      <div className="mb-4 inline-flex p-3 rounded-xl bg-brand-green/10 group-hover:bg-brand-green/15 transition-colors">
        <Icon className="h-6 w-6 text-brand-green" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
