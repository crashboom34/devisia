'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getUserViewRestriction,
  isRouteAllowed,
  getRedirectRoute,
} from '@/lib/view-restrictions';

/**
 * ViewRestrictionManager Component
 *
 * Automatically enforces view restrictions by:
 * 1. Checking user's restriction settings
 * 2. Redirecting to allowed page if current page is restricted
 * 3. Hiding navigation elements for restricted pages
 *
 * Usage: Add to root layout to apply globally
 */

interface ViewRestrictionManagerProps {
  children: React.ReactNode;
}

export function ViewRestrictionManager({ children }: ViewRestrictionManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(true);

  useEffect(() => {
    checkRestrictions();
  }, [pathname]);

  const checkRestrictions = async () => {
    setIsChecking(true);

    try {
      const restriction = await getUserViewRestriction();

      // Check if current route is allowed
      const allowed = isRouteAllowed(pathname, restriction);
      setIsAllowed(allowed);

      // If not allowed, redirect to permitted page
      if (!allowed && restriction) {
        const redirectTo = getRedirectRoute(restriction);
        console.log(`Access denied to ${pathname}. Redirecting to ${redirectTo}`);
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error('Error checking view restrictions:', error);
      // On error, allow access (fail-open for better UX)
      setIsAllowed(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // If not allowed, show nothing (will redirect)
  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has view restrictions
 */
export function useViewRestriction() {
  const [restriction, setRestriction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestriction();
  }, []);

  const loadRestriction = async () => {
    try {
      const data = await getUserViewRestriction();
      setRestriction(data);
    } catch (error) {
      console.error('Error loading restriction:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    loadRestriction();
  };

  return {
    restriction,
    loading,
    refresh,
    isRestricted: !!restriction,
    hasFullAccess: !restriction,
  };
}
