'use client';

import { ReactNode } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  showBackButton?: boolean;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, showBackButton = true }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="mb-5 lg:mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm mb-3 lg:mb-4 overflow-x-auto scrollbar-hide">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1.5 shrink-0">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-500">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mt-0.5 h-8 w-8 text-gray-400 hover:text-gray-900 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
