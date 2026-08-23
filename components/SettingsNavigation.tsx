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
      id: 'parameters',
      title: 'Paramètres Détaillés',
      description: 'Configuration par section',
      icon: Settings,
      path: '/settings/parametres',
      active: pathname === '/settings/parametres' || pathname === '/settings',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
        {navigationCards.map((card) => {
          const IconComponent = card.icon;
          const isHovered = hoveredCard === card.id;

          return (
            <Link key={card.id} href={card.path}>
              <Card
                className={`
                  cursor-pointer transition-all duration-300
                  ${card.active
                    ? 'border-2 border-primary bg-primary/10'
                    : 'border-border bg-surface hover:border-primary/40'
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
                        ${card.active ? 'bg-primary/10' : 'bg-surface-elevated'}
                      `}
                    >
                      <IconComponent
                        className={`
                          h-6 w-6
                          ${card.active ? 'text-primary' : 'text-muted-foreground'}
                        `}
                      />
                    </div>
                    {card.active && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        Actuel
                      </span>
                    )}
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-foreground">
                    {card.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {card.description}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant={card.active ? 'secondary' : 'primary'}
                      size="sm"
                      className="flex-1"
                    >
                      {card.active ? 'Page actuelle' : 'Accéder'}
                      <ChevronRight
                        className={`
                          h-4 w-4 ml-2 transition-transform
                          ${isHovered ? 'translate-x-1' : ''}
                        `}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Link href="/dashboard">
          <Button variant="outline">
            Retour au Dashboard
          </Button>
        </Link>
        <Link href="/project/new">
          <Button variant="primary">
            Nouveau Devis
            <ArrowRight className="h-4 w-4" />
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
 *
 * Note: Only "Paramètres Détaillés" is available now
 */

interface PageSwitcherProps {
  currentPage: 'settings' | 'parametres';
  onPageChange?: (page: string) => void;
}

export function PageSwitcher({ currentPage, onPageChange }: PageSwitcherProps) {
  const pages = [
    { id: 'parametres', label: 'Paramètres Détaillés', path: '/settings/parametres' },
  ];

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1">
      {pages.map((page) => (
        <Link key={page.id} href={page.path}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(page.id)}
          >
            {page.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
