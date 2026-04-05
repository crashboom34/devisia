'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

const footerLinks = {
  product: {
    title: 'Produit',
    links: [
      { name: 'Fonctionnalites', href: '/features' },
      { name: 'Tarifs', href: '/pricing' },
      { name: 'FAQ', href: '/faq' },
    ],
  },
  resources: {
    title: 'Ressources',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'Support', href: 'mailto:support@devisia.fr' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Mentions legales', href: '/terms' },
      { name: 'CGU', href: '/terms' },
      { name: 'Politique de confidentialite', href: '/privacy' },
    ],
  },
};

export function SiteFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-brand-green">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Devisia</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              L&apos;outil de devis intelligent pour les professionnels du batiment.
            </p>
          </div>

          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-brand-green transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Devisia. Tous droits reserves.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-gray-400 hover:text-brand-green text-sm transition-colors">
              Confidentialite
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-brand-green text-sm transition-colors">
              Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
