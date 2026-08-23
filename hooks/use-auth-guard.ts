'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UseAuthGuardOptions {
  /** Require the user to be listed in admin_users (any role). Default false. */
  requireAdmin?: boolean;
  /** Require the user's admin_users.role to be exactly 'super_admin'. Implies requireAdmin. Default false. */
  requireSuperAdmin?: boolean;
  /** Route to send unauthenticated visitors to. Default '/auth/login'. */
  redirectTo?: string;
  /** Route to send authenticated-but-not-(super-)admin visitors to. Default '/dashboard' ('/admin' when requireSuperAdmin). */
  notAdminRedirectTo?: string;
}

interface AuthGuardState {
  user: User | null;
  isAdmin: boolean;
  adminRole: string | null;
  /** true while the initial getUser()/admin_users check is in flight */
  loading: boolean;
  /** Generic, user-safe error when the guard could not verify access. */
  error: Error | null;
}

const UNAUTHORIZED_STATE: AuthGuardState = {
  user: null,
  isAdmin: false,
  adminRole: null,
  loading: true,
  error: null,
};

function authGuardError(): Error {
  return new Error('Impossible de vérifier vos droits d’accès. Veuillez vous reconnecter.');
}

/**
 * Centralizes the "get the current user, redirect if missing, optionally
 * verify admin_users membership" pattern that was previously copy-pasted
 * across ~30 pages/components (see Phase 0 audit, finding on auth
 * duplication). Every protected client component should use this instead of
 * calling supabase.auth.getUser() directly.
 *
 * This is a client-side guard (the app currently stores the Supabase session
 * in localStorage, not cookies, so it cannot be enforced from
 * middleware/SSR yet — see docs/architecture for the follow-up needed to add
 * a true server-side guard via @supabase/ssr).
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardState {
  const {
    requireAdmin = false,
    requireSuperAdmin = false,
    redirectTo = '/auth/login',
    notAdminRedirectTo = requireSuperAdmin ? '/admin' : '/dashboard',
  } = options;
  const needsAdminRow = requireAdmin || requireSuperAdmin;
  const router = useRouter();
  const [state, setState] = useState<AuthGuardState>(UNAUTHORIZED_STATE);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let authChangeTimer: ReturnType<typeof setTimeout> | null = null;

    const isCurrentRequest = (requestId: number) => (
      !cancelled && requestIdRef.current === requestId
    );

    const beginRequest = (): number => {
      const requestId = ++requestIdRef.current;
      setState(UNAUTHORIZED_STATE);
      return requestId;
    };

    const failClosed = (requestId: number, error: unknown, destination: string) => {
      if (!isCurrentRequest(requestId)) return;

      console.error('Auth guard verification failed:', error);
      setState({
        user: null,
        isAdmin: false,
        adminRole: null,
        loading: false,
        error: authGuardError(),
      });
      router.replace(destination);
    };

    const verifyUser = async (user: User, requestId: number) => {
      try {
        if (!needsAdminRow) {
          if (isCurrentRequest(requestId)) {
            setState({ user, isAdmin: false, adminRole: null, loading: false, error: null });
          }
          return;
        }

        const { data: adminRow, error: adminError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (adminError) throw adminError;
        if (!isCurrentRequest(requestId)) return;

        const hasAccess = !!adminRow && (!requireSuperAdmin || adminRow.role === 'super_admin');

        if (!hasAccess) {
          setState(UNAUTHORIZED_STATE);
          router.replace(notAdminRedirectTo);
          return;
        }

        setState({ user, isAdmin: true, adminRole: adminRow.role, loading: false, error: null });
      } catch (error) {
        failClosed(requestId, error, needsAdminRow ? notAdminRedirectTo : redirectTo);
      }
    };

    const handleSessionUser = (user: User | null) => {
      const requestId = beginRequest();

      if (!user) {
        router.replace(redirectTo);
        return;
      }

      // Keep the Supabase auth callback synchronous. Deferring avoids doing
      // async Supabase work while the auth client's internal lock is held.
      authChangeTimer = setTimeout(() => {
        authChangeTimer = null;
        void verifyUser(user, requestId);
      }, 0);
    };

    // Subscribe before getUser() so a newer auth event always supersedes the
    // initial request. requestIdRef prevents stale async results from winning.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (authChangeTimer) clearTimeout(authChangeTimer);
      handleSessionUser(session?.user ?? null);
    });

    const initialRequestId = beginRequest();
    async function checkInitialUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!isCurrentRequest(initialRequestId)) return;

        if (!data.user) {
          setState(UNAUTHORIZED_STATE);
          router.replace(redirectTo);
          return;
        }

        await verifyUser(data.user, initialRequestId);
      } catch (error) {
        failClosed(initialRequestId, error, redirectTo);
      }
    }

    void checkInitialUser();
    return () => {
      cancelled = true;
      ++requestIdRef.current;
      if (authChangeTimer) clearTimeout(authChangeTimer);
      subscription.unsubscribe();
    };
  }, [needsAdminRow, requireSuperAdmin, redirectTo, notAdminRedirectTo, router]);

  return state;
}
