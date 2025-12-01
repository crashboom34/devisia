/**
 * View Restriction System
 *
 * This module handles view restrictions for users who want to
 * see only specific pages (e.g., detailed settings only)
 */

import { supabase } from './supabase';

export type ViewMode = 'full' | 'detailed-settings-only' | 'api-info-only' | 'complete-settings-only';

interface ViewRestriction {
  user_id: string;
  view_mode: ViewMode;
  allowed_routes: string[];
  redirect_route: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's view restriction settings
 */
export async function getUserViewRestriction(): Promise<ViewRestriction | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_view_restrictions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // No restriction found - user has full access
      return null;
    }

    return data as ViewRestriction;
  } catch (error) {
    console.error('Error getting view restriction:', error);
    return null;
  }
}

/**
 * Set view restriction for current user
 */
export async function setUserViewRestriction(mode: ViewMode): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const restriction = getRestrictionConfig(mode);

    const { error } = await supabase
      .from('user_view_restrictions')
      .upsert({
        user_id: user.id,
        view_mode: mode,
        allowed_routes: restriction.allowed_routes,
        redirect_route: restriction.redirect_route,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Store in localStorage for immediate access
    localStorage.setItem(`view-mode-${user.id}`, mode);
    localStorage.setItem(`redirect-route-${user.id}`, restriction.redirect_route);

    return true;
  } catch (error) {
    console.error('Error setting view restriction:', error);
    return false;
  }
}

/**
 * Remove view restriction (restore full access)
 */
export async function removeViewRestriction(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_view_restrictions')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    // Clear localStorage
    localStorage.removeItem(`view-mode-${user.id}`);
    localStorage.removeItem(`redirect-route-${user.id}`);

    return true;
  } catch (error) {
    console.error('Error removing view restriction:', error);
    return false;
  }
}

/**
 * Get restriction configuration for a given mode
 */
function getRestrictionConfig(mode: ViewMode) {
  const configs = {
    'full': {
      allowed_routes: ['*'],
      redirect_route: '/dashboard',
    },
    'detailed-settings-only': {
      allowed_routes: ['/settings/parametres', '/auth/login', '/auth/register'],
      redirect_route: '/settings/parametres',
    },
    'api-info-only': {
      allowed_routes: ['/settings', '/auth/login', '/auth/register'],
      redirect_route: '/settings',
    },
    'complete-settings-only': {
      allowed_routes: ['/settings/complete', '/auth/login', '/auth/register'],
      redirect_route: '/settings/complete',
    },
  };

  return configs[mode];
}

/**
 * Check if current route is allowed
 */
export function isRouteAllowed(pathname: string, restriction: ViewRestriction | null): boolean {
  // No restriction = all routes allowed
  if (!restriction) return true;

  // Wildcard = all routes allowed
  if (restriction.allowed_routes.includes('*')) return true;

  // Check if current route is in allowed list
  return restriction.allowed_routes.some(route => pathname.startsWith(route));
}

/**
 * Get redirect route for restricted users
 */
export function getRedirectRoute(restriction: ViewRestriction | null): string {
  if (!restriction) return '/dashboard';
  return restriction.redirect_route;
}

/**
 * Quick access: Restrict to detailed settings only
 */
export async function restrictToDetailedSettings(): Promise<boolean> {
  return await setUserViewRestriction('detailed-settings-only');
}

/**
 * Quick access: Restore full access
 */
export async function restoreFullAccess(): Promise<boolean> {
  return await removeViewRestriction();
}
