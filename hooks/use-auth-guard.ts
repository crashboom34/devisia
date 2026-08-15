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
  const [state, setState] = useState<AuthGuardState>({ user: null, isAdmin: false, adminRole: null, loading: true });
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelledRef.current) router.push(redirectTo);
        return;
      }

      if (!needsAdminRow) {
        if (!cancelledRef.current) setState({ user, isAdmin: false, adminRole: null, loading: false });
        return;
      }

      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const hasAccess = !!adminRow && (!requireSuperAdmin || adminRow.role === 'super_admin');

      if (!hasAccess) {
        if (!cancelledRef.current) router.push(notAdminRedirectTo);
        return;
      }

      if (!cancelledRef.current) setState({ user, isAdmin: true, adminRole: adminRow.role, loading: false });
    }

    check();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsAdminRow, requireSuperAdmin, redirectTo, notAdminRedirectTo]);

  return state;
}
