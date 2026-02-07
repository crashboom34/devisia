import { supabase } from './supabase';

/**
 * Subscription Helper Functions
 * These functions abstract AI model details from the frontend
 */

export interface SubscriptionInfo {
  tier_name: string;
  tier_level: number;
  max_projects_per_month: number;
  max_estimates_per_project: number;
  priority_support: boolean;
  ai_capability_level: string;
}

export interface ProjectLimitInfo {
  limit: number;
  used: number;
  remaining: number;
  has_reached_limit: boolean;
  tier_name: string;
}

/**
 * Get user's current subscription information
 * Returns generic capability info WITHOUT exposing AI model details
 */
export async function getUserSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_tiers:tier_id (
          name,
          display_name,
          tier_level,
          max_projects_per_month,
          max_estimates_per_project,
          priority_support
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      // Return free tier defaults
      return {
        tier_name: 'Free',
        tier_level: 0,
        max_projects_per_month: 5,
        max_estimates_per_project: 3,
        priority_support: false,
        ai_capability_level: 'Standard AI Intelligence',
      };
    }

    const tier = data.subscription_tiers as any;

    return {
      tier_name: tier.display_name,
      tier_level: tier.tier_level,
      max_projects_per_month: tier.max_projects_per_month,
      max_estimates_per_project: tier.max_estimates_per_project,
      priority_support: tier.priority_support,
      ai_capability_level: getAICapabilityLabel(tier.tier_level),
    };
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    return null;
  }
}

/**
 * Check if user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return !!adminData;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if user has reached their project limit
 * Uses database function for secure calculation
 * Admins have unlimited access unless they simulate a plan
 */
export async function checkProjectLimit(userId: string): Promise<ProjectLimitInfo> {
  try {
    const isAdmin = await isUserAdmin(userId);

    if (isAdmin) {
      return {
        limit: -1,
        used: 0,
        remaining: -1,
        has_reached_limit: false,
        tier_name: 'Admin - Illimite',
      };
    }

    const { data, error } = await supabase.rpc('check_project_limit', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking project limit:', error);
      return {
        limit: 5,
        used: 0,
        remaining: 5,
        has_reached_limit: false,
        tier_name: 'Free',
      };
    }

    return data;
  } catch (error) {
    console.error('Error in checkProjectLimit:', error);
    return {
      limit: 5,
      used: 0,
      remaining: 5,
      has_reached_limit: false,
      tier_name: 'Free',
    };
  }
}

/**
 * Convert tier level to user-friendly AI capability label
 * This is what users see instead of specific model names
 */
export function getAICapabilityLabel(tierLevel: number): string {
  switch (tierLevel) {
    case 1:
      return 'GPT-4.1 Mini AI';
    case 2:
      return 'Mistral Large 2 AI';
    case 3:
      return 'GPT-4.1 Premium AI';
    default:
      return 'AI-Powered';
  }
}

/**
 * Get AI capability description for marketing
 */
export function getAICapabilityDescription(tierLevel: number): string {
  switch (tierLevel) {
    case 1:
      return 'GPT-4.1 Mini - Fast and precise estimates at lower cost';
    case 2:
      return 'Mistral Large 2 - Advanced reasoning for complex projects';
    case 3:
      return 'GPT-4.1 - Maximum accuracy and comprehensive analysis';
    default:
      return 'AI-powered construction estimates';
  }
}

/**
 * Check if user can create a new project
 * Returns both permission and helpful message
 * Admins have unlimited access
 */
export async function canCreateProject(userId: string): Promise<{
  allowed: boolean;
  message?: string;
  upgrade_url?: string;
  isAdmin?: boolean;
}> {
  const isAdmin = await isUserAdmin(userId);

  if (isAdmin) {
    return {
      allowed: true,
      message: 'Acces administrateur illimite',
      isAdmin: true,
    };
  }

  const limitInfo = await checkProjectLimit(userId);

  if (limitInfo.has_reached_limit) {
    return {
      allowed: false,
      message: `Vous avez atteint votre limite de ${limitInfo.limit} projets par mois sur le plan ${limitInfo.tier_name}.`,
      upgrade_url: '/pricing/new',
      isAdmin: false,
    };
  }

  const remainingText = limitInfo.limit === -1
    ? 'Projets illimites'
    : `${limitInfo.remaining} projet${limitInfo.remaining > 1 ? 's' : ''} restant${limitInfo.remaining > 1 ? 's' : ''} ce mois`;

  return {
    allowed: true,
    message: remainingText,
    isAdmin: false,
  };
}

/**
 * Increment user's project usage counter
 * Called after successful project creation
 */
export async function incrementProjectUsage(userId: string): Promise<void> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscription) {
      await supabase
        .from('user_subscriptions')
        .update({
          projects_used_this_period: (subscription.projects_used_this_period || 0) + 1,
        })
        .eq('id', subscription.id);
    }
  } catch (error) {
    console.error('Error incrementing project usage:', error);
  }
}

/**
 * Get upgrade suggestion message based on current tier
 */
export function getUpgradeSuggestion(tierLevel: number): string | null {
  switch (tierLevel) {
    case 0:
    case 1:
      return 'Upgrade to Business for Mistral Large 2 AI and more projects';
    case 2:
      return 'Upgrade to Pro for GPT-4.1 Premium AI and unlimited projects';
    case 3:
      return null; // Already on highest tier
    default:
      return null;
  }
}
