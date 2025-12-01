'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * SettingsPageManager Component
 *
 * A comprehensive single-page view manager for settings pages.
 * Only one settings page is rendered and visible at any time.
 *
 * Features:
 * - Conditional rendering (pages not shown are not in DOM)
 * - Smooth transitions between pages
 * - State persistence in URL and localStorage
 * - Accessibility support with ARIA attributes
 * - Keyboard navigation support
 */

export type SettingsPageId =
  | 'general'
  | 'devis'
  | 'notifications'
  | 'appearance'
  | 'security';

interface SettingsPage {
  id: SettingsPageId;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
}

interface SettingsPageManagerProps {
  pages: SettingsPage[];
  defaultPage?: SettingsPageId;
  onPageChange?: (pageId: SettingsPageId) => void;
  persistState?: boolean;
}

export function SettingsPageManager({
  pages,
  defaultPage = 'general',
  onPageChange,
  persistState = true,
}: SettingsPageManagerProps) {
  const [activePage, setActivePage] = useState<SettingsPageId>(defaultPage);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user and their last visited page
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);

      if (persistState) {
        // Try to load from URL first
        const urlParams = new URLSearchParams(window.location.search);
        const pageFromUrl = urlParams.get('page') as SettingsPageId;

        if (pageFromUrl && pages.some(p => p.id === pageFromUrl)) {
          setActivePage(pageFromUrl);
          return;
        }

        // Fallback to localStorage
        const savedPage = localStorage.getItem(`settings-page-${user.id}`);
        if (savedPage && pages.some(p => p.id === savedPage)) {
          setActivePage(savedPage as SettingsPageId);
        }
      }
    }
  };

  /**
   * Navigate to a specific settings page
   * @param pageId - The ID of the page to navigate to
   */
  const navigateToPage = useCallback((pageId: SettingsPageId) => {
    if (pageId === activePage || isTransitioning) return;

    // Start transition
    setIsTransitioning(true);

    // Smooth transition delay
    setTimeout(() => {
      setActivePage(pageId);

      // Persist state
      if (persistState && userId) {
        localStorage.setItem(`settings-page-${userId}`, pageId);

        // Update URL without page reload
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageId);
        window.history.pushState({}, '', url.toString());
      }

      // Callback
      onPageChange?.(pageId);

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  }, [activePage, isTransitioning, persistState, userId, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Number keys to navigate
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < pages.length) {
          e.preventDefault();
          navigateToPage(pages[index].id);
        }
      }

      // Alt + Arrow keys to navigate
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const currentIndex = pages.findIndex(p => p.id === activePage);
        const newIndex = e.key === 'ArrowLeft'
          ? Math.max(0, currentIndex - 1)
          : Math.min(pages.length - 1, currentIndex + 1);
        navigateToPage(pages[newIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, pages, navigateToPage]);

  // Get active page component
  const activePageData = pages.find(p => p.id === activePage);
  const ActivePageComponent = activePageData?.component;

  return (
    <div className="settings-page-manager">
      {/* Navigation Sidebar */}
      <aside className="settings-sidebar">
        <nav role="navigation" aria-label="Settings navigation">
          <ul className="settings-nav-list">
            {pages.map((page, index) => (
              <li key={page.id}>
                <button
                  onClick={() => navigateToPage(page.id)}
                  className={`settings-nav-item ${activePage === page.id ? 'active' : ''}`}
                  aria-current={activePage === page.id ? 'page' : undefined}
                  aria-label={`${page.title} (Alt+${index + 1})`}
                  disabled={isTransitioning}
                >
                  <span className="settings-nav-icon">{page.icon}</span>
                  <div className="settings-nav-content">
                    <span className="settings-nav-title">{page.title}</span>
                    <span className="settings-nav-description">{page.description}</span>
                  </div>
                  {activePage === page.id && (
                    <span className="settings-nav-indicator" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Content Area - ONLY renders active page */}
      <main
        className={`settings-content ${isTransitioning ? 'transitioning' : ''}`}
        role="main"
        aria-live="polite"
        aria-busy={isTransitioning}
      >
        {ActivePageComponent && (
          <div className="settings-page-wrapper">
            <ActivePageComponent
              isActive={!isTransitioning}
              onNavigate={navigateToPage}
            />
          </div>
        )}
      </main>

      <style jsx>{`
        .settings-page-manager {
          display: flex;
          min-height: 100vh;
          background: #1a1a1a;
        }

        .settings-sidebar {
          width: 320px;
          background: #0f0f0f;
          border-right: 1px solid #2a2a2a;
          padding: 24px 16px;
          flex-shrink: 0;
        }

        .settings-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .settings-nav-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 16px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #94a3b8;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .settings-nav-item:hover:not(:disabled) {
          background: #1a1a1a;
          border-color: #2a2a2a;
          color: #fff;
        }

        .settings-nav-item.active {
          background: #1a1a1a;
          border-color: #3b82f6;
          color: #fff;
        }

        .settings-nav-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .settings-nav-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-nav-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-nav-title {
          font-size: 14px;
          font-weight: 600;
        }

        .settings-nav-description {
          font-size: 12px;
          opacity: 0.7;
        }

        .settings-nav-indicator {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
        }

        .settings-content {
          flex: 1;
          padding: 48px;
          overflow-y: auto;
          opacity: 1;
          transition: opacity 0.2s ease;
        }

        .settings-content.transitioning {
          opacity: 0;
          pointer-events: none;
        }

        .settings-page-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .settings-page-manager {
            flex-direction: column;
          }

          .settings-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #2a2a2a;
            padding: 16px;
          }

          .settings-nav-list {
            flex-direction: row;
            overflow-x: auto;
            gap: 8px;
          }

          .settings-nav-item {
            min-width: 200px;
          }

          .settings-content {
            padding: 24px;
          }
        }

        @media (max-width: 640px) {
          .settings-nav-item {
            min-width: 160px;
            padding: 12px;
          }

          .settings-nav-description {
            display: none;
          }

          .settings-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to access page navigation from within a settings page
 */
export function useSettingsNavigation() {
  const [currentPage, setCurrentPage] = useState<SettingsPageId>('general');

  return {
    currentPage,
    navigateTo: setCurrentPage,
  };
}
