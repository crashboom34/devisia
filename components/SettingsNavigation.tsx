'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Settings,
  FileText,
  Info,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

/**
 * SettingsNavigation Component
 *
 * Provides quick navigation between different settings pages
 * with visual feedback and smooth transitions
 */

export function SettingsNavigation() {
  const pathname = usePathname();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const navigationCards = [
    {
      id: 'api-info',
      title: 'Informations API',
      description: 'Gestion centralisée des clés API',
      icon: Info,
      path: '/settings',
      color: 'blue',
      active: pathname === '/settings',
    },
    {
      id: 'parameters',
      title: 'Paramètres Détaillés',
      description: 'Configuration par section',
      icon: Settings,
      path: '/settings/parametres',
      color: 'purple',
      active: pathname === '/settings/parametres',
    },
    {
      id: 'complete',
      title: 'Paramètres Complets',
      description: 'Tous les réglages en un seul endroit',
      icon: FileText,
      path: '/settings/complete',
      color: 'emerald',
      active: pathname === '/settings/complete',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {navigationCards.map((card) => {
          const IconComponent = card.icon;
          const isHovered = hoveredCard === card.id;

          return (
            <Link key={card.id} href={card.path}>
              <Card
                className={`
                  cursor-pointer transition-all duration-300
                  ${card.active
                    ? `bg-${card.color}-600/20 border-${card.color}-500 border-2`
                    : 'bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#3a3a3a]'
                  }
                  ${isHovered ? 'transform scale-105 shadow-lg' : ''}
                `}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`
                        p-3 rounded-lg
                        ${card.active
                          ? `bg-${card.color}-500/20`
                          : 'bg-[#1a1a1a]'
                        }
                      `}
                    >
                      <IconComponent
                        className={`
                          h-6 w-6
                          ${card.active
                            ? `text-${card.color}-400`
                            : 'text-slate-400'
                          }
                        `}
                      />
                    </div>
                    {card.active && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        Actuel
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {card.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {card.active ? 'Page actuelle' : 'Accéder'}
                    </span>
                    <ChevronRight
                      className={`
                        h-4 w-4 transition-transform
                        ${isHovered ? 'translate-x-1' : ''}
                        ${card.active ? 'text-blue-400' : 'text-slate-500'}
                      `}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="outline" className="border-[#2a2a2a] text-slate-300">
            Retour au Dashboard
          </Button>
        </Link>
        <Link href="/project/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Nouveau Devis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * PageSwitcher Component
 *
 * Compact navigation switcher for settings pages
 * Can be embedded in page headers
 */

interface PageSwitcherProps {
  currentPage: 'settings' | 'parametres' | 'complete';
  onPageChange?: (page: string) => void;
}

export function PageSwitcher({ currentPage, onPageChange }: PageSwitcherProps) {
  const pages = [
    { id: 'settings', label: 'API Info', path: '/settings' },
    { id: 'parametres', label: 'Détaillés', path: '/settings/parametres' },
    { id: 'complete', label: 'Complets', path: '/settings/complete' },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
      {pages.map((page) => (
        <Link key={page.id} href={page.path}>
          <Button
            variant={currentPage === page.id ? 'default' : 'ghost'}
            size="sm"
            className={
              currentPage === page.id
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'text-slate-400 hover:text-white'
            }
            onClick={() => onPageChange?.(page.id)}
          >
            {page.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
