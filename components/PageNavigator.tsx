'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * PageNavigator Component
 *
 * This component handles smooth page transitions by:
 * 1. Hiding the current page with fade-out animation
 * 2. Navigating to the new page
 * 3. Showing the new page with fade-in animation
 */

interface PageNavigatorProps {
  children: React.ReactNode;
}

export function PageNavigator({ children }: PageNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayContent, setDisplayContent] = useState(true);

  useEffect(() => {
    // Reset transition state when pathname changes
    setIsTransitioning(false);
    setDisplayContent(true);
  }, [pathname]);

  /**
   * Navigate to a new page with smooth transition
   * @param targetPath - The path to navigate to (e.g., '/settings/complete')
   */
  const navigateWithTransition = (targetPath: string) => {
    if (pathname === targetPath) return; // Already on target page

    // Start transition
    setIsTransitioning(true);
    setDisplayContent(false);

    // Wait for fade-out animation, then navigate
    setTimeout(() => {
      router.push(targetPath);
    }, 300);
  };

  return (
    <div
      className={`page-transition-wrapper ${
        isTransitioning ? 'transitioning' : ''
      } ${displayContent ? 'visible' : 'hidden'}`}
    >
      {children}

      <style jsx>{`
        .page-transition-wrapper {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }

        .page-transition-wrapper.transitioning {
          opacity: 0;
          pointer-events: none;
        }

        .page-transition-wrapper.hidden {
          opacity: 0;
        }

        .page-transition-wrapper.visible {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

/**
 * usePageNavigation Hook
 *
 * Custom hook for programmatic page navigation with transitions
 *
 * Usage:
 * const { navigateTo, isTransitioning } = usePageNavigation();
 * navigateTo('/settings/complete');
 */
export function usePageNavigation() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = (path: string) => {
    setIsTransitioning(true);

    // Add fade-out class to body
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-in-out';

    setTimeout(() => {
      router.push(path);

      // Restore opacity after navigation
      setTimeout(() => {
        document.body.style.opacity = '1';
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  return { navigateTo, isTransitioning };
}
