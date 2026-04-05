'use client';

import { Clock, CreditCard, MapPin, Circle as XCircle } from 'lucide-react';

const items = [
  { icon: Clock, label: 'Un devis en 2 min' },
  { icon: CreditCard, label: '14 jours gratuits' },
  { icon: MapPin, label: 'Donnees en France' },
  { icon: XCircle, label: 'Sans engagement' },
];

export function ReassuranceBar() {
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-center gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-brand-green/10">
                  <Icon className="h-5 w-5 text-brand-green" />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
